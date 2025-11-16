'use client'

// React Imports
import { useState, useMemo, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid2'
import Box from '@mui/material/Box'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'

// Third-party Imports
import { createColumnHelper } from '@tanstack/react-table'
import { toast } from 'react-toastify'

// Component Imports
import CustomDataTable from '@components/custom-components/CustomDataTable'

// Service Imports
import { reportService } from '@/services/reportService'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Column Definitions
const columnHelper = createColumnHelper()

const ProductDetailedReportPage = () => {
  const router = useRouter()
  const { lang: locale, id: productIdCustomerId } = useParams()

  // Extract productId and customerId from the combined ID
  const pathSegments = productIdCustomerId?.split('_') || []
  const productId = pathSegments[0]
  const customerId = pathSegments[1]

  // States
  const [productInfo, setProductInfo] = useState(null)
  const [customerInfo, setCustomerInfo] = useState(null)
  const [statistics, setStatistics] = useState({
    totalQuantity: 0,
    totalReturnQuantity: 0,
    netQuantity: 0,
    totalBonus: 0,
    totalDiscount: 0,
    totalAmount: 0,
    totalInvoices: 0
  })
  const [filterValues, setFilterValues] = useState({})
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const exportMenuOpen = Boolean(exportAnchorEl)

  // Build query params from filter values
  const queryParams = useMemo(() => {
    const params = {}
    if (filterValues.startDate) params.startDate = filterValues.startDate
    if (filterValues.endDate) params.endDate = filterValues.endDate
    return params
  }, [filterValues])

  // Fetch product detailed report data
  const { data: reportData, isLoading: isLoadingReport, error: reportError } =
    reportService.getProductDetailedReport('product-detailed-report', productId, customerId, queryParams)

  // Update product info, customer info, and statistics when data changes
  useEffect(() => {
    if (reportData?.result) {
      const report = reportData.result
      console.log('Product Report Data:', report) // Debug log
      setProductInfo(report.product || {})
      setCustomerInfo(report.customer || {})
      setStatistics(report.statistics || {
        totalQuantity: 0,
        totalReturnQuantity: 0,
        netQuantity: 0,
        totalBonus: 0,
        totalDiscount: 0,
        totalAmount: 0,
        totalInvoices: 0
      })
    }
  }, [reportData])

  // Log any errors
  useEffect(() => {
    if (reportError) {
      console.error('Product Report Error:', reportError)
      toast.error('Failed to load product report data')
    }
  }, [reportError])

  // Handle export menu
  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget)
  }

  const handleExportClose = () => {
    setExportAnchorEl(null)
  }

  // Generate printable HTML content
  const generatePrintableContent = () => {
    const currentDate = new Date().toLocaleDateString('en-PK')
    const salesData = reportData?.result?.docs || []
    const formatCurrency = (amount) => `₨${(amount || 0).toLocaleString()}`
    const formatDate = (date) => {
      if (!date) return 'N/A'
      return new Date(date).toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    const tableRows = salesData.map(sale => `
      <tr>
        <td>${sale.salesInvoiceNumber || 'N/A'}</td>
        <td>${formatDate(sale.invoiceDate)}</td>
        <td>${sale.batchNumber || 'N/A'}</td>
        <td class="text-right">${sale.quantity || 0}</td>
        <td class="text-right">${sale.returnQuantity || 0}</td>
        <td class="text-right">${sale.netQuantity || 0}</td>
        <td class="text-right">${sale.bonus || 0}</td>
        <td class="text-right">${formatCurrency(sale.rate)}</td>
        <td class="text-right">${formatCurrency(sale.discount)}</td>
        <td class="text-right font-medium">${formatCurrency(sale.totalAmount)}</td>
      </tr>
    `).join('')

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Product Report - ${productInfo?.productName || 'Product'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { text-align: center; margin-bottom: 5px; }
            h3 { text-align: center; margin-top: 0; color: #666; }
            .info-section { margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 4px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .info-item { margin: 5px 0; }
            .info-label { font-weight: bold; color: #666; }
            .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin: 20px 0; }
            .stat-box { text-align: center; padding: 15px; background-color: #f9f9f9; border-radius: 4px; }
            .stat-value { font-size: 1.2em; font-weight: bold; color: #1976d2; }
            .stat-label { font-size: 0.9em; color: #666; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .text-right { text-align: right; }
            .font-medium { font-weight: 500; }
            .totals { font-weight: bold; background-color: #e3f2fd; }
            @media print {
              @page { size: A4; margin: 15mm; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h2>DoseLogix - Product Detailed Report</h2>
          <h3>${productInfo?.productName || 'Product'} for ${customerInfo?.customerName || 'Customer'}</h3>
          <p style="text-align: center; color: #666;">Report Date: ${currentDate}</p>

          <div class="info-section">
            <div class="info-grid">
              <div>
                <div class="info-item">
                  <span class="info-label">Product:</span> ${productInfo?.productName || 'N/A'}
                </div>
                <div class="info-item">
                  <span class="info-label">Brand:</span> ${productInfo?.brandName || 'N/A'}
                </div>
                <div class="info-item">
                  <span class="info-label">Group:</span> ${productInfo?.groupName || 'N/A'}
                </div>
                <div class="info-item">
                  <span class="info-label">Subgroup:</span> ${productInfo?.subGroupName || 'N/A'}
                </div>
              </div>
              <div>
                <div class="info-item">
                  <span class="info-label">Customer:</span> ${customerInfo?.customerName || 'N/A'}
                </div>
                <div class="info-item">
                  <span class="info-label">Area:</span> ${customerInfo?.areaName || 'N/A'}
                </div>
                <div class="info-item">
                  <span class="info-label">Subarea:</span> ${customerInfo?.subAreaName || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-value">${statistics.totalInvoices || 0}</div>
              <div class="stat-label">Total Invoices</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${statistics.totalQuantity || 0}</div>
              <div class="stat-label">Sold Quantity</div>
            </div>
            <div class="stat-box">
              <div class="stat-value" style="color: #d32f2f;">${statistics.totalReturnQuantity || 0}</div>
              <div class="stat-label">Return Quantity</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${statistics.netQuantity || 0}</div>
              <div class="stat-label">Net Quantity</div>
            </div>
            <div class="stat-box">
              <div class="stat-value" style="color: #2e7d32;">${statistics.totalBonus || 0}</div>
              <div class="stat-label">Total Bonus</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${formatCurrency(statistics.totalDiscount)}</div>
              <div class="stat-label">Total Discount</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${formatCurrency(statistics.totalAmount)}</div>
              <div class="stat-label">Total Amount</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Batch #</th>
                <th>Sold Qty</th>
                <th>Return Qty</th>
                <th>Net Qty</th>
                <th>Bonus</th>
                <th>Rate</th>
                <th>Discount</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr class="totals">
                <td colspan="3">Total</td>
                <td class="text-right">${statistics.totalQuantity || 0}</td>
                <td class="text-right">${statistics.totalReturnQuantity || 0}</td>
                <td class="text-right">${statistics.netQuantity || 0}</td>
                <td class="text-right">${statistics.totalBonus || 0}</td>
                <td colspan="1"></td>
                <td class="text-right">${formatCurrency(statistics.totalDiscount)}</td>
                <td class="text-right">${formatCurrency(statistics.totalAmount)}</td>
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
  const exportToPDF = (filename) => {
    const currentDate = new Date().toLocaleDateString('en-PK')
    const salesData = reportData?.result?.docs || []
    const htmlForPdf = generatePrintableRawHtml(salesData, currentDate)

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
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
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
    const formatCurrency = (amount) => `₨${(amount || 0).toLocaleString()}`
    const formatDate = (date) => {
      if (!date) return 'N/A'
      return new Date(date).toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    return `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="text-align: center;">Product Detailed Report</h2>
        <p style="text-align: center;"><strong>Report Date:</strong> ${currentDate}</p>
        <h3>Summary</h3>
        <p>Total Invoices: ${statistics.totalInvoices || 0}</p>
        <p>Sold Quantity: ${statistics.totalQuantity || 0}</p>
        <p>Return Quantity: ${statistics.totalReturnQuantity || 0}</p>
        <p>Net Quantity: ${statistics.netQuantity || 0}</p>
        <p>Total Bonus: ${statistics.totalBonus || 0}</p>
        <p>Total Discount: ${formatCurrency(statistics.totalDiscount)}</p>
        <p>Total Amount: ${formatCurrency(statistics.totalAmount)}</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5;">Invoice #</th>
              <th style="border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5;">Date</th>
              <th style="border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5;">Batch #</th>
              <th style="border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5;">Sold Qty</th>
              <th style="border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5;">Return Qty</th>
              <th style="border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5;">Net Qty</th>
              <th style="border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5;">Bonus</th>
              <th style="border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5;">Rate</th>
              <th style="border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5;">Discount</th>
              <th style="border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(sale => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${sale.salesInvoiceNumber || 'N/A'}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${formatDate(sale.invoiceDate)}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${sale.batchNumber || 'N/A'}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${sale.quantity || 0}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${sale.returnQuantity || 0}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${sale.netQuantity || 0}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${sale.bonus || 0}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(sale.rate)}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(sale.discount)}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(sale.totalAmount)}</td>
              </tr>
            `).join('')}
            <tr style="font-weight: bold; background-color: #f9f9f9;">
              <td colspan="3" style="border: 1px solid #ddd; padding: 8px;">Total</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${statistics.totalQuantity || 0}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${statistics.totalReturnQuantity || 0}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${statistics.netQuantity || 0}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${statistics.totalBonus || 0}</td>
              <td style="border: 1px solid #ddd; padding: 8px;"></td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(statistics.totalDiscount)}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(statistics.totalAmount)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `
  }

  // Download CSV
  const downloadCSV = (data, filename) => {
    const headers = ['Invoice #', 'Date', 'Batch #', 'Sold Qty', 'Return Qty', 'Net Qty', 'Bonus', 'Rate', 'Discount', 'Amount']
    const csvRows = [headers.join(',')]

    const formatDate = (date) => {
      if (!date) return ''
      return new Date(date).toLocaleDateString('en-CA')
    }

    data.forEach(sale => {
      const csvRow = [
        `"${sale.salesInvoiceNumber || 'N/A'}"`,
        `"${formatDate(sale.invoiceDate)}"`,
        `"${sale.batchNumber || 'N/A'}"`,
        sale.quantity || 0,
        sale.returnQuantity || 0,
        sale.netQuantity || 0,
        sale.bonus || 0,
        sale.rate || 0,
        sale.discount || 0,
        sale.totalAmount || 0
      ]
      csvRows.push(csvRow.join(','))
    })

    csvRows.push(`"Total","","",${statistics.totalQuantity || 0},${statistics.totalReturnQuantity || 0},${statistics.netQuantity || 0},${statistics.totalBonus || 0},"",${statistics.totalDiscount || 0},${statistics.totalAmount || 0}`)

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

  // Handle export
  const handleExport = async (format = 'excel') => {
    handleExportClose()

    try {
      const currentDate = new Date().toISOString().slice(0, 10)
      const sanitizedProductName = (productInfo?.productName || 'product').replace(/[/\\?%*:|"<>]/g, '')
      const filename = `${sanitizedProductName}-report-${currentDate}`

      if (format === 'print') {
        generatePrintableContent()
      } else if (format === 'pdf') {
        exportToPDF(`${filename}.pdf`)
        toast.info('PDF generation started; download will begin shortly')
      } else if (format === 'excel') {
        const salesData = reportData?.result?.docs || []
        downloadCSV(salesData, `${filename}.csv`)
        toast.success('CSV export started')
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export report')
    }
  }

  // Handle back navigation
  const handleBack = () => {
    router.push(getLocalizedUrl('/reports/products', locale))
  }

  // Format currency
  const formatCurrency = (amount) => {
    return `₨${(amount || 0).toLocaleString()}`
  }

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Define columns
  const columns = [
    columnHelper.accessor('salesInvoiceNumber', {
      header: 'Invoice #',
      cell: ({ row }) => (
        <Typography color='text.primary' className='font-medium'>
          {row.original.salesInvoiceNumber || 'N/A'}
        </Typography>
      )
    }),
    columnHelper.accessor('invoiceDate', {
      header: 'Date',
      cell: ({ row }) => (
        <Typography color='text.primary'>
          {formatDate(row.original.invoiceDate)}
        </Typography>
      )
    }),
    columnHelper.accessor('batchNumber', {
      header: 'Batch #',
      cell: ({ row }) => (
        <Typography color='text.secondary'>
          {row.original.batchNumber || 'N/A'}
        </Typography>
      )
    }),
    columnHelper.accessor('quantity', {
      header: 'Sold Qty',
      cell: ({ row }) => (
        <Typography color='primary.main' className='font-medium'>
          {row.original.quantity || 0}
        </Typography>
      )
    }),
    columnHelper.accessor('returnQuantity', {
      header: 'Return Qty',
      cell: ({ row }) => (
        <Typography color='error.main'>
          {row.original.returnQuantity || 0}
        </Typography>
      )
    }),
    columnHelper.accessor('netQuantity', {
      header: 'Net Qty',
      cell: ({ row }) => (
        <Typography color='text.primary' className='font-medium'>
          {row.original.netQuantity || 0}
        </Typography>
      )
    }),
    columnHelper.accessor('bonus', {
      header: 'Bonus',
      cell: ({ row }) => (
        <Typography color='success.main'>
          {row.original.bonus || 0}
        </Typography>
      )
    }),
    columnHelper.accessor('rate', {
      header: 'Rate',
      cell: ({ row }) => (
        <Typography color='text.primary'>
          {formatCurrency(row.original.rate)}
        </Typography>
      )
    }),
    columnHelper.accessor('discount', {
      header: 'Discount',
      cell: ({ row }) => (
        <Typography color='info.main'>
          {formatCurrency(row.original.discount)}
        </Typography>
      )
    }),
    columnHelper.accessor('totalAmount', {
      header: 'Amount',
      cell: ({ row }) => (
        <Typography color='text.primary' className='font-medium'>
          {formatCurrency(row.original.totalAmount)}
        </Typography>
      )
    })
  ]

  // Filters configuration
  const filters = {
    heading: 'Filters',
    filterArray: [
      {
        label: 'Start Date',
        dbColumn: 'startDate',
        type: 'date',
        placeholder: 'Start Date',
        value: filterValues.startDate || '',
        onChange: (value) => setFilterValues(prev => ({ ...prev, startDate: value }))
      },
      {
        label: 'End Date',
        dbColumn: 'endDate',
        type: 'date',
        placeholder: 'End Date',
        value: filterValues.endDate || '',
        onChange: (value) => setFilterValues(prev => ({ ...prev, endDate: value }))
      }
    ]
  }

  return (
    <div className='flex flex-col gap-6'>
      {/* Header */}
      <Card>
        <div className='flex flex-wrap items-center justify-between gap-4 p-6'>
          <div className='flex items-center gap-4'>
            <Button
              variant='outlined'
              color='secondary'
              startIcon={<i className='tabler-arrow-left' />}
              onClick={handleBack}
            >
              Back
            </Button>
            <div>
              <Typography variant='h4' className='mb-1'>
                {productInfo?.productName || 'Product Report'}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Detailed sales for {customerInfo?.customerName}
              </Typography>
            </div>
          </div>
          <div className='flex gap-3'>
            <Button
              variant='outlined'
              color='secondary'
              startIcon={<i className='tabler-download' />}
              endIcon={<i className='tabler-chevron-down' />}
              onClick={handleExportClick}
            >
              Export
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

      {/* Product and Customer Information */}
      {productInfo && customerInfo && (
        <Card>
          <div className='p-6'>
            <Typography variant='h6' className='mb-4'>
              Details
            </Typography>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box className='space-y-3'>
                  <div>
                    <Typography variant='body2' color='text.secondary' className='mb-1'>
                      Product
                    </Typography>
                    <Typography variant='body1' className='font-medium'>
                      {productInfo.productName || 'N/A'}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant='body2' color='text.secondary' className='mb-1'>
                      Brand
                    </Typography>
                    <Typography variant='body1'>
                      {productInfo.brandName || 'N/A'}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant='body2' color='text.secondary' className='mb-1'>
                      Group / Subgroup
                    </Typography>
                    <Typography variant='body1'>
                      {productInfo.groupName || 'N/A'} / {productInfo.subGroupName || 'N/A'}
                    </Typography>
                  </div>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box className='space-y-3'>
                  <div>
                    <Typography variant='body2' color='text.secondary' className='mb-1'>
                      Customer
                    </Typography>
                    <Typography variant='body1' className='font-medium'>
                      {customerInfo.customerName || 'N/A'}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant='body2' color='text.secondary' className='mb-1'>
                      Area / Subarea
                    </Typography>
                    <Typography variant='body1'>
                      {customerInfo.areaName || 'N/A'} / {customerInfo.subAreaName || 'N/A'}
                    </Typography>
                  </div>
                </Box>
              </Grid>
            </Grid>
          </div>
        </Card>
      )}

      {/* Statistics Summary */}
      {isLoadingReport ? (
        <Card>
          <Box className='flex justify-center items-center p-10'>
            <CircularProgress />
          </Box>
        </Card>
      ) : (
        <Card>
          <div className='p-6'>
            <Typography variant='h6' className='mb-4'>
              Summary Statistics
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 12/7 }}>
                <Box className='text-center'>
                  <Typography variant='h4' color='primary'>
                    {statistics.totalInvoices || 0}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Total Invoices
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 12/7 }}>
                <Box className='text-center'>
                  <Typography variant='h4' color='text.primary'>
                    {statistics.totalQuantity || 0}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Sold Quantity
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 12/7 }}>
                <Box className='text-center'>
                  <Typography variant='h4' color='error.main'>
                    {statistics.totalReturnQuantity || 0}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Return Quantity
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 12/7 }}>
                <Box className='text-center'>
                  <Typography variant='h4' color='text.primary'>
                    {statistics.netQuantity || 0}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Net Quantity
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 12/7 }}>
                <Box className='text-center'>
                  <Typography variant='h4' color='success.main'>
                    {statistics.totalBonus || 0}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Total Bonus
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 12/7 }}>
                <Box className='text-center'>
                  <Typography variant='h4' color='info.main'>
                    {formatCurrency(statistics.totalDiscount)}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Total Discount
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 12/7 }}>
                <Box className='text-center'>
                  <Typography variant='h4' color='text.primary'>
                    {formatCurrency(statistics.totalAmount)}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Total Amount
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </div>
        </Card>
      )}

      {/* Sales Data Table */}
      <Card>
        <CustomDataTable
          apiURL={`/reports/products/${productId}/${customerId}`}
          queryKey='product-detailed-sales'
          columns={columns}
          filters={filters}
          enableSelection={false}
          extraQueryParams={queryParams}
          defaultPageSize={10}
          enableSearch={true}
          enableExport={false}
        />
      </Card>
    </div>
  )
}

export default ProductDetailedReportPage
