'use client'

// React Imports
import { useState, useMemo, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'

// Third-party Imports
import { createColumnHelper } from '@tanstack/react-table'
import { toast } from 'react-toastify'
import axios from '../../../../libs/axiosInstance'
import { API_BASE_URL } from '../../../../contsants/api'

// Component Imports
import CustomDataTable from '@components/custom-components/CustomDataTable'

// Service Imports
import { reportService } from '@/services/reportService'
import { lookupService } from '@/services/lookupService'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Column Definitions
const columnHelper = createColumnHelper()

const ProductReportPage = () => {
  const router = useRouter()
  const { lang: locale } = useParams()

  // States
  const [customers, setCustomers] = useState([])
  const [areas, setAreas] = useState([])
  const [subAreas, setSubAreas] = useState([])
  const [brands, setBrands] = useState([])
  const [groups, setGroups] = useState([])
  const [subGroups, setSubGroups] = useState([])
  const [products, setProducts] = useState([])
  const [filterValues, setFilterValues] = useState({})
  const [selectedRows, setSelectedRows] = useState([])
  const [currentPageData, setCurrentPageData] = useState([])
  const [isExporting, setIsExporting] = useState(false)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const exportMenuOpen = Boolean(exportAnchorEl)

  // Fetch lookup data
  const { data: customersData } = lookupService.getCustomersLookup('get-customers-lookup')
  const { data: areasData } = lookupService.getAreasByCustomersSalesLookup('get-areas-by-customers-sales-lookup')
  const { data: subAreasData } = lookupService.getSubAreasByCustomersSalesLookup('get-subareas-by-customers-sales-lookup', filterValues.areaId)
  const { data: brandsData } = lookupService.getBrandsLookup('get-brands-lookup')
  const { data: groupsData } = lookupService.getGroupsLookup('get-groups-lookup')
  const { data: subGroupsData } = lookupService.getSubGroupsLookup('get-subgroups-lookup')
  const { data: productsData } = lookupService.getProductsLookup('get-products-lookup')

  // Process lookup data
  useEffect(() => {
    if (customersData?.data?.success) {
      setCustomers(customersData.data.result || [])
    }
  }, [customersData])

  useEffect(() => {
    if (areasData?.data?.success) {
      setAreas(areasData.data.result || [])
    }
  }, [areasData])

  useEffect(() => {
    if (subAreasData?.data?.success) {
      setSubAreas(subAreasData.data.result || [])
    }
  }, [subAreasData])

  useEffect(() => {
    if (brandsData?.data?.success) {
      setBrands(brandsData.data.result || [])
    }
  }, [brandsData])

  useEffect(() => {
    if (groupsData?.data?.success) {
      setGroups(groupsData.data.result || [])
    }
  }, [groupsData])

  useEffect(() => {
    if (subGroupsData?.data?.success) {
      setSubGroups(subGroupsData.data.result || [])
    }
  }, [subGroupsData])

  useEffect(() => {
    if (productsData?.data?.success) {
      setProducts(productsData.data.result || [])
    }
  }, [productsData])

  // Build extraQueryParams from filter values
  const queryParams = useMemo(() => ({ ...filterValues }), [filterValues])

  // Export menu handlers
  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget)
  }

  const handleExportClose = () => {
    setExportAnchorEl(null)
  }

  // View details for a product/customer combination
  const handleViewDetails = (productId, customerId) => {
    if (!productId || !customerId) return
    router.push(getLocalizedUrl(`/reports/products/${productId}_${customerId}`, locale))
  }

  // Handle export (optimized)
  const handleExport = async (format = 'excel') => {
    handleExportClose()
    if (isExporting) return
    setIsExporting(true)

    try {
      const currentDate = new Date().toISOString().slice(0, 10)
      const filenameBase = selectedRows.length > 0 ? `product-report-selected-${currentDate}` : `product-report-all-${currentDate}`

      // If user has selected rows, export client-side (fast for small selections)
      if (selectedRows.length > 0) {
        if (format === 'print') {
          printReport(selectedRows, filenameBase)
        } else if (format === 'pdf') {
          exportToPDF(selectedRows, `${filenameBase}.pdf`)
        } else if (format === 'excel') {
          downloadCSV(selectedRows, `${filenameBase}.csv`)
        }

        toast.success('Export completed successfully')
        return
      }

      // No selections: use server-side export (blob) to avoid fetching/processing many records on client
      const params = { ...filterValues }
      const queryString = new URLSearchParams(params).toString()
      const exportUrl = `${API_BASE_URL}/reports/products/export${queryString ? `?${queryString}` : ''}`

      // Request blob from server
      const response = await axios.get(exportUrl, { responseType: 'blob' })
      const blob = new Blob([response.data], { type: response.data.type || 'application/octet-stream' })
      const blobUrl = window.URL.createObjectURL(blob)

      if (format === 'print') {
        // Open PDF/HTML in new tab and print if possible
        const w = window.open(blobUrl)
        // best-effort: try to print after tab loads
        setTimeout(() => { try { w && w.print && w.print() } catch (e) {} }, 1000)
      } else {
        // Download the blob (pdf or excel or csv as server provided)
        const ext = blob.type === 'application/pdf' || exportUrl.includes('format=pdf') ? 'pdf' : 'xlsx'
        const a = document.createElement('a')
        a.href = blobUrl
        a.setAttribute('download', `${filenameBase}.${ext}`)
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(blobUrl)
      }

      toast.success('Export completed successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export report')
    } finally {
      setIsExporting(false)
    }
  }

  // Download CSV
  const downloadCSV = (data, filename) => {
    const headers = [
      'Product',
      'Brand',
      'Group',
      'Subgroup',
      'Customer',
      'Area',
      'Subarea',
      'Total Quantity',
      'Return Quantity',
      'Net Quantity',
      'Total Bonus',
      'Total Invoices'
    ]
    const csvRows = [headers.join(',')]

    data.forEach(record => {
      const csvRow = [
        `"${record.productName || 'N/A'}"`,
        `"${record.brandName || 'N/A'}"`,
        `"${record.groupName || 'N/A'}"`,
        `"${record.subGroupName || 'N/A'}"`,
        `"${record.customerName || 'N/A'}"`,
        `"${record.areaName || 'N/A'}"`,
        `"${record.subAreaName || 'N/A'}"`,
        record.totalQuantity || 0,
        record.totalReturnQuantity || 0,
        record.netQuantity || 0,
        record.totalBonus || 0,
        record.totalInvoices || 0
      ]
      csvRows.push(csvRow.join(','))
    })

    const csvString = csvRows.join('\n')
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Print report
  const printReport = (data, title) => {
    const currentDate = new Date().toLocaleDateString('en-PK')

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h2 { text-align: center; color: #333; }
            .report-info { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .totals { font-weight: bold; background-color: #f9f9f9; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h2>Product Report</h2>
          <div class="report-info">
            <p><strong>Report Date:</strong> ${currentDate}</p>
            <p><strong>Total Records:</strong> ${data.length}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Brand</th>
                <th>Group</th>
                <th>Subgroup</th>
                <th>Customer</th>
                <th>Area</th>
                <th>Subarea</th>
                <th class="text-center">Sold Qty</th>
                <th class="text-center">Return Qty</th>
                <th class="text-center">Net Qty</th>
                <th class="text-center">Bonus</th>
                <th class="text-center">Invoices</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(record => `
                <tr>
                  <td>${record.productName || 'N/A'}</td>
                  <td>${record.brandName || 'N/A'}</td>
                  <td>${record.groupName || 'N/A'}</td>
                  <td>${record.subGroupName || 'N/A'}</td>
                  <td>${record.customerName || 'N/A'}</td>
                  <td>${record.areaName || 'N/A'}</td>
                  <td>${record.subAreaName || 'N/A'}</td>
                  <td class="text-center">${record.totalQuantity || 0}</td>
                  <td class="text-center">${record.totalReturnQuantity || 0}</td>
                  <td class="text-center">${record.netQuantity || 0}</td>
                  <td class="text-center">${record.totalBonus || 0}</td>
                  <td class="text-center">${record.totalInvoices || 0}</td>
                </tr>
              `).join('')}
              <tr class="totals">
                <td colspan="7"><strong>Total</strong></td>
                <td class="text-center"><strong>${data.reduce((sum, record) => sum + (record.totalQuantity || 0), 0)}</strong></td>
                <td class="text-center"><strong>${data.reduce((sum, record) => sum + (record.totalReturnQuantity || 0), 0)}</strong></td>
                <td class="text-center"><strong>${data.reduce((sum, record) => sum + (record.netQuantity || 0), 0)}</strong></td>
                <td class="text-center"><strong>${data.reduce((sum, record) => sum + (record.totalBonus || 0), 0)}</strong></td>
                <td class="text-center"><strong>${data.reduce((sum, record) => sum + (record.totalInvoices || 0), 0)}</strong></td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `

    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
    iframeDoc.open()
    iframeDoc.write(htmlContent)
    iframeDoc.close()

    setTimeout(() => {
      iframe.contentWindow.print()
      setTimeout(() => document.body.removeChild(iframe), 500)
    }, 500)
  }

  // Export to PDF
  const exportToPDF = (data, filename) => {
    const currentDate = new Date().toLocaleDateString('en-PK')
    const htmlForPdf = generatePrintableRawHtml(data, currentDate)

    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
    iframeDoc.open()
    iframeDoc.write(`<!doctype html><html><head><meta charset="utf-8"></head><body>${htmlForPdf}
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.3/html2pdf.bundle.min.js"></script>
      <script>
        (function(){
          const opt = {
            margin: 10,
            filename: "${filename}",
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
          };
          setTimeout(() => {
            html2pdf().from(document.body).set(opt).save().then(() => {
              try { window.parent.postMessage({ type: 'html2pdf-done' }, '*') } catch(e){}
            }).catch((e) => {
              try { window.parent.postMessage({ type: 'html2pdf-error', error: String(e) }, '*') } catch(e){}
            });
          }, 300);
        })();
      <\/script></body></html>`)
    iframeDoc.close()

    const onMessage = (e) => {
      if (!e.data) return
      if (e.data.type === 'html2pdf-done' || e.data.type === 'html2pdf-error') {
        try { document.body.removeChild(iframe) } catch (err) {}
        window.removeEventListener('message', onMessage)
      }
    }
    window.addEventListener('message', onMessage)
  }

  // Generate raw HTML for PDF
  const generatePrintableRawHtml = (data, currentDate) => {
    return `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="text-align: center;">Product Report</h2>
        <p style="text-align: center;"><strong>Report Date:</strong> ${currentDate}</p>
        <p style="text-align: center;"><strong>Total Records:</strong> ${data.length}</p>

        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="border: 1px solid #ddd; padding: 6px;">Product</th>
              <th style="border: 1px solid #ddd; padding: 6px;">Brand</th>
              <th style="border: 1px solid #ddd; padding: 6px;">Group</th>
              <th style="border: 1px solid #ddd; padding: 6px;">Subgroup</th>
              <th style="border: 1px solid #ddd; padding: 6px;">Customer</th>
              <th style="border: 1px solid #ddd; padding: 6px;">Area</th>
              <th style="border: 1px solid #ddd; padding: 6px;">Subarea</th>
              <th style="border: 1px solid #ddd; padding: 6px; text-align: center;">Sold Qty</th>
              <th style="border: 1px solid #ddd; padding: 6px; text-align: center;">Return Qty</th>
              <th style="border: 1px solid #ddd; padding: 6px; text-align: center;">Net Qty</th>
              <th style="border: 1px solid #ddd; padding: 6px; text-align: center;">Bonus</th>
              <th style="border: 1px solid #ddd; padding: 6px; text-align: center;">Invoices</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(record => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">${record.productName || 'N/A'}</td>
                <td style="border: 1px solid #ddd; padding: 6px;">${record.brandName || 'N/A'}</td>
                <td style="border: 1px solid #ddd; padding: 6px;">${record.groupName || 'N/A'}</td>
                <td style="border: 1px solid #ddd; padding: 6px;">${record.subGroupName || 'N/A'}</td>
                <td style="border: 1px solid #ddd; padding: 6px;">${record.customerName || 'N/A'}</td>
                <td style="border: 1px solid #ddd; padding: 6px;">${record.areaName || 'N/A'}</td>
                <td style="border: 1px solid #ddd; padding: 6px;">${record.subAreaName || 'N/A'}</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${record.totalQuantity || 0}</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${record.totalReturnQuantity || 0}</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${record.netQuantity || 0}</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${record.totalBonus || 0}</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${record.totalInvoices || 0}</td>
              </tr>
            `).join('')}
            <tr style="font-weight: bold; background-color: #f9f9f9;">
              <td colspan="7" style="border: 1px solid #ddd; padding: 6px;"><strong>Total</strong></td>
              <td style="border: 1px solid #ddd; padding: 6px; text-align: center;"><strong>${data.reduce((sum, record) => sum + (record.totalQuantity || 0), 0)}</strong></td>
              <td style="border: 1px solid #ddd; padding: 6px; text-align: center;"><strong>${data.reduce((sum, record) => sum + (record.totalReturnQuantity || 0), 0)}</strong></td>
              <td style="border: 1px solid #ddd; padding: 6px; text-align: center;"><strong>${data.reduce((sum, record) => sum + (record.netQuantity || 0), 0)}</strong></td>
              <td style="border: 1px solid #ddd; padding: 6px; text-align: center;"><strong>${data.reduce((sum, record) => sum + (record.totalBonus || 0), 0)}</strong></td>
              <td style="border: 1px solid #ddd; padding: 6px; text-align: center;"><strong>${data.reduce((sum, record) => sum + (record.totalInvoices || 0), 0)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    `
  }



  // Handle row selection change
  const handleRowSelectionChange = (rows) => {
    setSelectedRows(rows)
  }

  // Define columns
  const columns = [
    columnHelper.accessor('productName', {
      header: 'Product',
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <Typography color='text.primary' className='font-medium'>
            {row.original.productName || 'N/A'}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {row.original.brandName || 'N/A'}
          </Typography>
        </div>
      )
    }),
    columnHelper.accessor('customerName', {
      header: 'Customer',
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <Typography color='text.primary'>
            {row.original.customerName || 'N/A'}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {row.original.areaName || 'N/A'} {row.original.subAreaName ? `- ${row.original.subAreaName}` : ''}
          </Typography>
        </div>
      )
    }),
    columnHelper.accessor('groupName', {
      header: 'Group',
      cell: ({ row }) => (
        <Typography color='text.secondary'>
          {row.original.groupName || 'N/A'}
        </Typography>
      )
    }),
    columnHelper.accessor('subGroupName', {
      header: 'Subgroup',
      cell: ({ row }) => (
        <Typography color='text.secondary'>
          {row.original.subGroupName || 'N/A'}
        </Typography>
      )
    }),
    columnHelper.accessor('totalQuantity', {
      header: 'Sold Qty',
      cell: ({ row }) => (
        <Typography color='text.primary' className='font-medium'>
          {row.original.totalQuantity || 0}
        </Typography>
      )
    }),
    columnHelper.accessor('totalReturnQuantity', {
      header: 'Return Qty',
      cell: ({ row }) => (
        <Typography color='error.main'>
          {row.original.totalReturnQuantity || 0}
        </Typography>
      )
    }),
    columnHelper.accessor('netQuantity', {
      header: 'Net Qty',
      cell: ({ row }) => (
        <Typography color='primary.main' className='font-medium'>
          {row.original.netQuantity || 0}
        </Typography>
      )
    }),
    columnHelper.accessor('totalBonus', {
      header: 'Total Bonus',
      cell: ({ row }) => (
        <Typography color='success.main'>
          {row.original.totalBonus || 0}
        </Typography>
      )
    }),
    columnHelper.accessor('totalInvoices', {
      header: 'Invoices',
      cell: ({ row }) => (
        <Typography color='text.primary' className='font-medium'>
          {row.original.totalInvoices || 0}
        </Typography>
      )
    }),
    columnHelper.accessor('actions', {
      header: 'Actions',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Tooltip title='View Details'>
            <IconButton
              size='small'
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails(row.original.productId, row.original.customerId)
              }}
            >
              <i className='tabler-eye text-textSecondary' />
            </IconButton>
          </Tooltip>
        </div>
      ),
      enableSorting: false
    })
  ]

  // Filters configuration for CustomDataTable (embedded filters UI)
  const filters = {
    heading: 'Filters',
    filterArray: [
      {
        label: 'Product',
        dbColumn: 'productId',
        placeholder: 'Select Product',
        options: products,
        onChange: (value) => setFilterValues(prev => ({ ...prev, productId: value }))
      },
      {
        label: 'Brand',
        dbColumn: 'brandId',
        placeholder: 'Select Brand',
        options: brands,
        onChange: (value) => setFilterValues(prev => ({ ...prev, brandId: value }))
      },
      {
        label: 'Group',
        dbColumn: 'groupId',
        placeholder: 'Select Group',
        options: groups,
        onChange: (value) => setFilterValues(prev => ({ ...prev, groupId: value }))
      },
      {
        label: 'Subgroup',
        dbColumn: 'subGroupId',
        placeholder: 'Select Subgroup',
        options: subGroups,
        onChange: (value) => setFilterValues(prev => ({ ...prev, subGroupId: value }))
      },
      {
        label: 'Customer',
        dbColumn: 'customerId',
        placeholder: 'Select Customer',
        options: customers,
        onChange: (value) => setFilterValues(prev => ({ ...prev, customerId: value }))
      },
      {
        label: 'Area',
        dbColumn: 'areaId',
        placeholder: 'Select Area',
        options: areas,
        onChange: (value) => setFilterValues(prev => ({ ...prev, areaId: value }))
      },
      {
        label: 'Subarea',
        dbColumn: 'subAreaId',
        placeholder: 'Select Subarea',
        options: subAreas,
        onChange: (value) => setFilterValues(prev => ({ ...prev, subAreaId: value }))
      },
      {
        label: 'Start Date',
        dbColumn: 'startDate',
        type: 'date',
        placeholder: 'Start Date',
        onChange: (value) => setFilterValues(prev => ({ ...prev, startDate: value }))
      },
      {
        label: 'End Date',
        dbColumn: 'endDate',
        type: 'date',
        placeholder: 'End Date',
        onChange: (value) => setFilterValues(prev => ({ ...prev, endDate: value }))
      }
    ]
  }

  return (
    <div className='flex flex-col gap-6'>
      {/* Header */}
      <Card>
        <div className='flex flex-wrap items-center justify-between gap-4 p-6'>
          <div>
            <Typography variant='h4' className='mb-1'>
              Product Reports
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Product-wise sales summary and analysis
            </Typography>
          </div>
          <div className='flex gap-3'>
            <Button
              variant='outlined'
              color='secondary'
              startIcon={<i className='tabler-download' />}
              endIcon={<i className='tabler-chevron-down' />}
              onClick={handleExportClick}
            >
              Export {selectedRows.length > 0 ? `(${selectedRows.length})` : '(All)'}
            </Button>
            <Menu
              anchorEl={exportAnchorEl}
              open={exportMenuOpen}
              onClose={handleExportClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right'
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right'
              }}
            >
              <MenuItem onClick={() => handleExport('print')}>
                <ListItemIcon>
                  <i className='tabler-printer' />
                </ListItemIcon>
                <ListItemText>Print</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleExport('pdf')}>
                <ListItemIcon>
                  <i className='tabler-file-type-pdf' />
                </ListItemIcon>
                <ListItemText>Export as PDF</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleExport('excel')}>
                <ListItemIcon>
                  <i className='tabler-file-spreadsheet' />
                </ListItemIcon>
                <ListItemText>Export as Excel</ListItemText>
              </MenuItem>
            </Menu>
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <Card>
        <CustomDataTable
          apiURL='/reports/products'
          queryKey='get-products-report'
          columns={columns}
          filters={filters}
          enableSelection={true}
          onRowSelectionChange={handleRowSelectionChange}
          extraQueryParams={queryParams}
          defaultPageSize={10}
          enableSearch={true}
          enableExport={true}
        />
      </Card>
    </div>
  )
}

export default ProductReportPage
