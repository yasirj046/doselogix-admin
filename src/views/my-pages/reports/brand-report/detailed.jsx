'use client'

// React Imports
import { useState, useMemo, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid2'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
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

const BrandDetailedReportPage = () => {
  const router = useRouter()
  const { lang: locale, id: brandId } = useParams()

  // States
  const [brandInfo, setBrandInfo] = useState(null)
  const [statistics, setStatistics] = useState({
    totalInvoices: 0,
    grossPurchases: 0,
    totalFreight: 0,
    totalDiscount: 0,
    grandTotal: 0,
    totalPaid: 0,
    outstandingAmount: 0
  })
  const [filterValues, setFilterValues] = useState({})
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const exportMenuOpen = Boolean(exportAnchorEl)

  // Build query params from filter values
  const queryParams = useMemo(() => {
    const params = {}
    if (filterValues.startDate) params.startDate = filterValues.startDate
    if (filterValues.endDate) params.endDate = filterValues.endDate
    if (filterValues.paymentStatus) params.paymentStatus = filterValues.paymentStatus
    return params
  }, [filterValues])

  // Fetch brand detailed report data for statistics
  const { data: reportData, isLoading: isLoadingReport } =
    reportService.getBrandDetailedReport('brand-detailed-report', brandId, queryParams)

    // Update brand info and statistics when data changes
  useEffect(() => {
    if (reportData?.result) {
      const report = reportData.result
      setBrandInfo(report.brand || {})
      setStatistics(report.statistics || {
        totalInvoices: 0,
        grossPurchases: 0,
        totalFreight: 0,
        totalDiscount: 0,
        grandTotal: 0,
        totalPaid: 0,
        outstandingAmount: 0
      })
    }
  }, [reportData])

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

  // Get purchase entries from the report data
  const purchaseEntries = reportData?.result?.docs || []

  // Local currency formatter to be used inside printable HTML
  const formatCurrency = (amount) => `₨${(amount || 0).toLocaleString()}`

  // Generate table rows
    const tableRows = purchaseEntries.map(entry => {
      const formatDate = (date) => {
        if (!date) return 'N/A'
        return new Date(date).toLocaleDateString('en-PK', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      }

      const getPaymentStatus = (entry) => {
        const totalPaid = entry.totalPaid || 0
        const grandTotal = entry.grandTotal || 0
        if (totalPaid === 0) return 'Unpaid'
        if (totalPaid >= grandTotal) return 'Paid'
        return 'Partial'
      }

      return `
        <tr>
          <td><span class="font-medium">${entry.invoiceNumber || 'N/A'}</span></td>
          <td>${formatDate(entry.invoiceDate)}</td>
          <td class="currency">${formatCurrency(entry.grossTotal)}</td>
          <td class="currency text-secondary">${formatCurrency(entry.freight)}</td>
          <td class="currency" style="color: #0288d1;">${formatCurrency(entry.flatDiscount)}</td>
          <td class="currency" style="color: #0288d1;">${formatCurrency(entry.specialDiscount)}</td>
          <td class="currency font-medium">${formatCurrency(entry.grandTotal)}</td>
          <td class="currency font-medium" style="color: #2e7d32;">${formatCurrency(entry.totalPaid)}</td>
          <td class="currency font-medium" style="color: ${(entry.grandTotal || 0) - (entry.totalPaid || 0) > 0 ? '#d32f2f' : '#2e7d32'};">
            ${formatCurrency((entry.grandTotal || 0) - (entry.totalPaid || 0))}
          </td>
          <td><span class="status-chip-table status-${getPaymentStatus(entry).toLowerCase()}">${getPaymentStatus(entry)}</span></td>
          <td><span class="text-secondary max-w-truncate">${entry.remarks || '-'}</span></td>
        </tr>
      `
    }).join('')

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Brand Report - ${brandInfo?.brandName || 'Brand'}</title>
          <style>
            body {
              font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
              margin: 0;
              padding: 24px;
              background-color: #fafafa;
              color: rgba(0, 0, 0, 0.87);
              line-height: 1.5;
            }
            .page-container {
              display: flex;
              flex-direction: column;
              gap: 20px;
              max-width: none;
              margin: 0;
              background-color: #fafafa;
            }
            .card {
              background-color: #fff;
              border-radius: 4px;
              box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12);
              overflow: hidden;
            }
            /* Single container variant used for print: keeps everything inside one bordered box */
            .single-card {
              background-color: #fff;
              border-radius: 6px;
              border: 1px solid rgba(0,0,0,0.08);
              overflow: hidden;
            }
            .divider {
              height: 1px;
              background: rgba(0,0,0,0.08);
              margin: 0;
            }
            .card-content {
              padding: 20px;
            }
            .header-content {
              display: flex;
              flex-wrap: wrap;
              align-items: center;
              justify-content: space-between;
              gap: 16px;
            }
            .header-left {
              display: flex;
              align-items: center;
              gap: 16px;
            }
            .header-info h4 {
              margin: 0 0 4px 0;
              font-size: 1.5rem;
              font-weight: 400;
              line-height: 1.235;
              color: rgba(0, 0, 0, 0.87);
            }
            .header-info p {
              margin: 0;
              font-size: 0.875rem;
              color: rgba(0, 0, 0, 0.6);
            }
            .section-title {
              margin: 0 0 16px 0;
              font-size: 1.125rem;
              font-weight: 500;
              line-height: 1.6;
              color: rgba(0, 0, 0, 0.87);
            }
            .brand-info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr auto;
              gap: 24px;
            }
            .info-group {
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            .info-item {
              display: flex;
              flex-direction: column;
              gap: 4px;
            }
            .info-label {
              font-size: 0.75rem;
              color: rgba(0, 0, 0, 0.6);
              font-weight: 400;
              margin-bottom: 4px;
            }
            .info-value {
              font-size: 0.875rem;
              color: rgba(0, 0, 0, 0.87);
              font-weight: 500;
            }
            .status-chip {
              display: inline-flex;
              align-items: center;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 0.8125rem;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.02857em;
              width: fit-content;
            }
            .status-active {
              background-color: rgba(76, 175, 80, 0.08);
              color: #2e7d32;
            }
            .status-inactive {
              background-color: rgba(244, 67, 54, 0.08);
              color: #d32f2f;
            }
            .statistics-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 24px;
              margin-top: 16px;
            }
            .stat-item {
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
            }
            .stat-value {
              font-size: 1.25rem;
              font-weight: 400;
              line-height: 1.235;
              margin-bottom: 8px;
            }
            .stat-value-primary { color: #1976d2; }
            .stat-value-default { color: rgba(0, 0, 0, 0.87); }
            .stat-value-info { color: #0288d1; }
            .stat-value-success { color: #2e7d32; }
            .stat-value-error { color: #d32f2f; }
            .stat-label {
              font-size: 0.875rem;
              color: rgba(0, 0, 0, 0.6);
              font-weight: 400;
            }
            .table-container {
              margin-top: 10px;
              overflow-x: hidden;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: auto;
              font-size: 0.6rem; /* slightly smaller but readable */
            }
            th {
              background-color: #f5f5f5;
              color: rgba(0, 0, 0, 0.87);
              font-weight: 500;
              font-size: 0.75rem;
              text-align: left;
              padding: 6px;
              border-bottom: 1px solid rgba(0, 0, 0, 0.12);
              white-space: normal; /* allow wrapping */
            }
            td {
              padding: 6px;
              border-bottom: 1px solid rgba(0, 0, 0, 0.12);
              color: rgba(0, 0, 0, 0.87);
              font-size: 0.65rem;
              white-space: nowrap; /* keep numeric columns compact */
              overflow: hidden;
              text-overflow: ellipsis;
            }
            /* Prefer wrapping for the Remarks column (11) */
            td:nth-child(11) { white-space: normal; word-break: break-word; max-width: 160px; }
            th:nth-child(11) { white-space: normal; }
            /* Keep currency columns tight and no-wrap */
            .currency { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
            .status-chip-table { display: inline-flex; align-items: center; padding: 3px 6px; border-radius: 10px; font-size: 0.65rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.02em; }
            .status-paid { background-color: rgba(76, 175, 80, 0.08); color: #2e7d32; }
            .status-partial { background-color: rgba(255, 152, 0, 0.08); color: #f57c00; }
            .status-unpaid { background-color: rgba(244, 67, 54, 0.08); color: #d32f2f; }
            .text-secondary { color: rgba(0, 0, 0, 0.6); }
            .font-medium { font-weight: 500; }
            .max-w-truncate {
              max-width: 160px;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            @media print {
              body {
                background-color: #fff;
                padding: 0;
                margin: 0;
              }
              .page-container {
                gap: 24px;
                max-width: none;
                margin: 0;
              }
              .card {
                box-shadow: none;
                border: 1px solid #e0e0e0;
                page-break-inside: avoid;
              }
              @page {
                size: A4;
                margin: 20mm 15mm 20mm 15mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="page-container">
            <div class="single-card">
              <!-- Header -->
              <div class="card-content">
                <div class="header-content">
                  <div class="header-left">
                    <div class="header-info">
                      <h4>${brandInfo?.brandName || 'Brand Report'}</h4>
                      <p>Detailed purchase report for ${brandInfo?.brandName}</p>
                    </div>
                  </div>
                  <div class="header-actions">
                    <span style="font-size: 0.875rem; color: rgba(0, 0, 0, 0.6);">Report Date: ${currentDate}</span>
                  </div>
                </div>
              </div>

              <hr class="divider" />

              <!-- Brand Information -->
              ${brandInfo ? `
              <div class="card-content">
                <h6 class="section-title">Brand Information</h6>
                <div class="brand-info-grid">
                  <div class="info-group">
                    <div class="info-item">
                      <span class="info-label">Brand Name</span>
                      <span class="info-value font-medium">${brandInfo.brandName || 'N/A'}</span>
                    </div>
                    ${brandInfo.address ? `
                    <div class="info-item">
                      <span class="info-label">Address</span>
                      <span class="info-value">${brandInfo.address}</span>
                    </div>
                    ` : ''}
                  </div>
                  <div class="info-group">
                    ${brandInfo.primaryContact ? `
                    <div class="info-item">
                      <span class="info-label">Primary Contact</span>
                      <span class="info-value">${brandInfo.primaryContact}</span>
                    </div>
                    ` : ''}
                    ${brandInfo.secondaryContact ? `
                    <div class="info-item">
                      <span class="info-label">Secondary Contact</span>
                      <span class="info-value">${brandInfo.secondaryContact}</span>
                    </div>
                    ` : ''}
                  </div>
                  <div class="info-group">
                    <div class="info-item">
                      <span class="info-label">Status</span>
                      <span class="status-chip ${brandInfo.isActive ? 'status-active' : 'status-inactive'}">
                        ${brandInfo.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <hr class="divider" />
              ` : ''}

              <!-- Statistics -->
              <div class="card-content">
                <h6 class="section-title">Summary Statistics</h6>
                <div class="statistics-grid">
                  <div class="stat-item">
                    <div class="stat-value stat-value-primary">${statistics.totalInvoices || 0}</div>
                    <div class="stat-label">Total Invoices</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value stat-value-default">₨${(statistics.grossPurchases || 0).toLocaleString()}</div>
                    <div class="stat-label">Gross Purchases</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value stat-value-default">₨${(statistics.totalFreight || 0).toLocaleString()}</div>
                    <div class="stat-label">Total Freight</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value stat-value-info">₨${(statistics.totalDiscount || 0).toLocaleString()}</div>
                    <div class="stat-label">Total Discount</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value stat-value-default">₨${(statistics.grandTotal || 0).toLocaleString()}</div>
                    <div class="stat-label">Grand Total</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value stat-value-success">₨${(statistics.totalPaid || 0).toLocaleString()}</div>
                    <div class="stat-label">Total Paid</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value stat-value-error">₨${(statistics.outstandingAmount || 0).toLocaleString()}</div>
                    <div class="stat-label">Outstanding Amount</div>
                  </div>
                </div>
              </div>

              <hr class="divider" />

              <!-- Purchase Entries -->
              <div class="card-content">
                <h6 class="section-title">Purchase Entries</h6>
                <div class="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Invoice Date</th>
                        <th>Gross Amount</th>
                        <th>Freight</th>
                        <th>Flat Discount</th>
                        <th>Special Discount</th>
                        <th>Grand Total</th>
                        <th>Paid</th>
                        <th>Balance</th>
                        <th>Status</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${tableRows}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    // Create a hidden iframe, write content into it and trigger print without opening a new tab
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

    // Print once content loads in iframe. Use a single-run guard to avoid double-printing
    let printed = false
    const removeIframe = () => {
      try { document.body.removeChild(iframe) } catch (e) { /* ignore */ }
    }

    const onLoadHandler = () => {
      if (printed) return
      printed = true
      try {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
      } catch (err) {
        console.error('Print error:', err)
        // fallback: open in same window's print
        window.print()
      }

      // remove iframe after a short delay to ensure print dialog opened
      setTimeout(removeIframe, 500)
    }

    // Some browsers may not fire onload for iframe when writing doc; use a small timeout as backup
    const fallbackTimeout = setTimeout(() => { if (!printed) onLoadHandler() }, 700)
    iframe.onload = () => {
      if (!printed) {
        clearTimeout(fallbackTimeout)
        onLoadHandler()
      }
    }

    return iframe
  }

  // Helper: sanitize file name
  const sanitizeFileName = (name) => {
    if (!name) return 'brand'
    return name.replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, ' ').trim()
  }

  // Helper: download CSV (used for Excel export fallback)
  const downloadCSV = (entries, filename) => {
    const headers = [
      'Invoice #',
      'Invoice Date',
      'Gross Amount',
      'Freight',
      'Flat Discount',
      'Special Discount',
      'Grand Total',
      'Paid',
      'Balance',
      'Status',
      'Remarks'
    ]

    const csvRows = [headers.join(',')]

    const formatDate = (date) => {
      if (!date) return ''
      return new Date(date).toLocaleDateString('en-CA')
    }

    const getPaymentStatus = (entry) => {
      const totalPaid = entry.totalPaid || 0
      const grandTotal = entry.grandTotal || 0
      if (totalPaid === 0) return 'Unpaid'
      if (totalPaid >= grandTotal) return 'Paid'
      return 'Partial'
    }

    entries.forEach(entry => {
      const row = [
        `"${(entry.invoiceNumber || '').toString().replace(/"/g, '""')}"`,
        `"${formatDate(entry.invoiceDate)}"`,
        entry.grossTotal || 0,
        entry.freight || 0,
        entry.flatDiscount || 0,
        entry.specialDiscount || 0,
        entry.grandTotal || 0,
        entry.totalPaid || 0,
        ((entry.grandTotal || 0) - (entry.totalPaid || 0)),
        getPaymentStatus(entry),
        `"${(entry.remarks || '').toString().replace(/"/g, '""')}"`
      ]
      csvRows.push(row.join(','))
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

  // Helper: export to PDF using html2pdf loaded inside a hidden iframe
  // This avoids opening a new tab and triggers a direct download with the given filename.
  const exportToPDF = (pdfFilename) => {
    const currentDate = new Date().toLocaleDateString('en-PK')
    const purchaseEntries = reportData?.result?.docs || []

    // Reuse the same HTML used for printing but inject html2pdf script which will auto-download PDF
    const htmlForPdf = generatePrintableRawHtml(purchaseEntries, currentDate)

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
    // Inject html2pdf from CDN and call it to save PDF with the provided filename
    iframeDoc.write(`<!doctype html><html><head><meta charset="utf-8"></head><body>${htmlForPdf}
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.3/html2pdf.bundle.min.js"></script>
      <script>
        (function(){
          const opt = {
            margin:       10,
            filename:     "${pdfFilename}",
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };
          // Delay slightly to ensure styles/loading
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

    // Cleanup when download completes or errors
    const onMessage = (e) => {
      if (!e.data) return
      if (e.data.type === 'html2pdf-done' || e.data.type === 'html2pdf-error') {
        try { document.body.removeChild(iframe) } catch (err) {}
        window.removeEventListener('message', onMessage)
      }
    }
    window.addEventListener('message', onMessage)
  }

  // Create a raw printable HTML string without writing it to an iframe (used by exportToPDF)
  const generatePrintableRawHtml = (purchaseEntries, currentDate) => {
    // Build the same tableRows HTML as in generatePrintableContent
    const formatCurrency = (amount) => `₨${(amount || 0).toLocaleString()}`
    const tableRows = (purchaseEntries || []).map(entry => {
      const formatDate = (date) => {
        if (!date) return 'N/A'
        return new Date(date).toLocaleDateString('en-PK', {
          year: 'numeric', month: 'short', day: 'numeric'
        })
      }
      const getPaymentStatus = (entry) => {
        const totalPaid = entry.totalPaid || 0
        const grandTotal = entry.grandTotal || 0
        if (totalPaid === 0) return 'Unpaid'
        if (totalPaid >= grandTotal) return 'Paid'
        return 'Partial'
      }
      return `
        <tr>
          <td><span class="font-medium">${entry.invoiceNumber || 'N/A'}</span></td>
          <td>${formatDate(entry.invoiceDate)}</td>
          <td class="currency">${formatCurrency(entry.grossTotal)}</td>
          <td class="currency text-secondary">${formatCurrency(entry.freight)}</td>
          <td class="currency" style="color: #0288d1;">${formatCurrency(entry.flatDiscount)}</td>
          <td class="currency" style="color: #0288d1;">${formatCurrency(entry.specialDiscount)}</td>
          <td class="currency font-medium">${formatCurrency(entry.grandTotal)}</td>
          <td class="currency font-medium" style="color: #2e7d32;">${formatCurrency(entry.totalPaid)}</td>
          <td class="currency font-medium" style="color: ${(entry.grandTotal || 0) - (entry.totalPaid || 0) > 0 ? '#d32f2f' : '#2e7d32'};">${formatCurrency((entry.grandTotal || 0) - (entry.totalPaid || 0))}</td>
          <td><span class="status-chip-table status-${getPaymentStatus(entry).toLowerCase()}">${getPaymentStatus(entry)}</span></td>
          <td><span class="text-secondary max-w-truncate">${entry.remarks || '-'}</span></td>
        </tr>
      `
    }).join('')

    // Keep same CSS and structure but minimal head to ensure html2pdf renders similarly
    return `
      <div style="font-family: 'Roboto','Helvetica','Arial',sans-serif; padding: 20px; color: rgba(0,0,0,0.87);">
        <h2>${brandInfo?.brandName || 'Brand Report'}</h2>
        <p>Report Date: ${currentDate}</p>
        <h3>Summary Statistics</h3>
        <p>Total Invoices: ${statistics.totalInvoices || 0}</p>
        <p>Gross Purchases: ₨${(statistics.grossPurchases || 0).toLocaleString()}</p>
        <hr/>
        <h3>Purchase Entries</h3>
        <table style="width:100%; border-collapse: collapse; font-size:12px;">
          <thead>
            <tr>
              <th>Invoice #</th><th>Invoice Date</th><th>Gross Amount</th><th>Freight</th><th>Flat Discount</th><th>Special Discount</th><th>Grand Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Remarks</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
    `
  }

  // Handle export
  const handleExport = async (format = 'excel') => {
    handleExportClose()

    try {
      const filenameDate = new Date().toISOString().slice(0, 10)
      const baseName = sanitizeFileName(brandInfo?.brandName || 'brand')

      if (format === 'print') {
        // Generate printable HTML content directly (print dialog)
        generatePrintableContent()
      } else if (format === 'pdf') {
        const pdfFilename = `${baseName} - report - ${filenameDate}.pdf`
        exportToPDF(pdfFilename)
        toast.info('PDF generation started; download will begin shortly')
      } else if (format === 'excel') {
        // Excel fallback: generate CSV which Excel can open
        const purchaseEntries = reportData?.result?.docs || []
        const csvFilename = `${baseName} - report - ${filenameDate}.csv`
        downloadCSV(purchaseEntries, csvFilename)
        toast.success('CSV export started')
      } else {
        // Unknown format: try server-side endpoint if available
        const exportParams = {
          brandId,
          format,
          ...filterValues
        }

        const data = await reportService.exportBrandDetailedReport(exportParams)

        if (data?.success) {
          toast.success(`Report exported to ${format.toUpperCase()} successfully`)
        } else {
          toast.error('Failed to export report')
        }
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export report')
    }
  }

  // Handle back navigation
  const handleBack = () => {
    router.push(getLocalizedUrl('/reports/brands', locale))
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

  // Get payment status color
  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'success'
      case 'partial':
        return 'warning'
      case 'unpaid':
        return 'error'
      default:
        return 'default'
    }
  }

  // Define columns
  const columns = [
    columnHelper.accessor('invoiceNumber', {
      header: 'Invoice #',
      cell: ({ row }) => (
        <Typography color='text.primary' className='font-medium'>
          {row.original.invoiceNumber || 'N/A'}
        </Typography>
      )
    }),
    columnHelper.accessor('invoiceDate', {
      header: 'Invoice Date',
      cell: ({ row }) => (
        <Typography color='text.primary'>
          {formatDate(row.original.invoiceDate)}
        </Typography>
      )
    }),
    columnHelper.accessor('grossTotal', {
      header: 'Gross Amount',
      cell: ({ row }) => (
        <Typography color='text.primary'>
          {formatCurrency(row.original.grossTotal)}
        </Typography>
      )
    }),
    columnHelper.accessor('freight', {
      header: 'Freight',
      cell: ({ row }) => (
        <Typography color='text.secondary'>
          {formatCurrency(row.original.freight)}
        </Typography>
      )
    }),
    columnHelper.accessor('flatDiscount', {
      header: 'Flat Discount',
      cell: ({ row }) => (
        <Typography color='info.main'>
          {formatCurrency(row.original.flatDiscount)}
        </Typography>
      )
    }),
    columnHelper.accessor('specialDiscount', {
      header: 'Special Discount',
      cell: ({ row }) => (
        <Typography color='info.main'>
          {formatCurrency(row.original.specialDiscount)}
        </Typography>
      )
    }),
    columnHelper.accessor('grandTotal', {
      header: 'Grand Total',
      cell: ({ row }) => (
        <Typography color='text.primary' className='font-medium'>
          {formatCurrency(row.original.grandTotal)}
        </Typography>
      )
    }),
    columnHelper.accessor('totalPaid', {
      header: 'Paid',
      cell: ({ row }) => (
        <Typography color='success.main' className='font-medium'>
          {formatCurrency(row.original.totalPaid)}
        </Typography>
      )
    }),
    columnHelper.accessor('remainingBalance', {
      header: 'Balance',
      cell: ({ row }) => {
        const balance = row.original.remainingBalance || 0
        return (
          <Typography color={balance > 0 ? 'error.main' : 'success.main'} className='font-medium'>
            {formatCurrency(balance)}
          </Typography>
        )
      }
    }),
    columnHelper.accessor('paymentStatus', {
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.paymentStatus || 'Unpaid'
        return (
          <Chip
            label={status}
            color={getPaymentStatusColor(status)}
            size='small'
            variant='tonal'
          />
        )
      }
    }),
    columnHelper.accessor('remarks', {
      header: 'Remarks',
      cell: ({ row }) => (
        <Typography color='text.secondary' variant='body2' className='max-w-[200px] truncate'>
          {row.original.remarks || '-'}
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
        onChange: (value) => setFilterValues(prev => ({ ...prev, startDate: value }))
      },
      {
        label: 'End Date',
        dbColumn: 'endDate',
        type: 'date',
        placeholder: 'End Date',
        onChange: (value) => setFilterValues(prev => ({ ...prev, endDate: value }))
      },
      {
        label: 'Payment Status',
        dbColumn: 'paymentStatus',
        placeholder: 'Select Status',
        options: [
          { value: 'paid', label: 'Paid' },
          { value: 'unpaid', label: 'Unpaid' },
          { value: 'partial', label: 'Partial' }
        ],
        onChange: (value) => setFilterValues(prev => ({ ...prev, paymentStatus: value }))
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
                {brandInfo?.brandName || 'Brand Report'}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Detailed purchase report for {brandInfo?.brandName}
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

      {/* Brand Information */}
      {brandInfo && (
        <Card>
          <div className='p-6'>
            <Typography variant='h6' className='mb-4'>
              Brand Information
            </Typography>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 5 }}>
                <Box className='space-y-3'>
                  <div>
                    <Typography variant='body2' color='text.secondary' className='mb-1'>
                      Brand Name
                    </Typography>
                    <Typography variant='body1' className='font-medium'>
                      {brandInfo.brandName || 'N/A'}
                    </Typography>
                  </div>
                  {brandInfo.address && (
                    <div>
                      <Typography variant='body2' color='text.secondary' className='mb-1'>
                        Address
                      </Typography>
                      <Typography variant='body1'>
                        {brandInfo.address}
                      </Typography>
                    </div>
                  )}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <Box className='space-y-3'>
                  {brandInfo.primaryContact && (
                    <div>
                      <Typography variant='body2' color='text.secondary' className='mb-1'>
                        Primary Contact
                      </Typography>
                      <Typography variant='body1'>
                        {brandInfo.primaryContact}
                      </Typography>
                    </div>
                  )}
                  {brandInfo.secondaryContact && (
                    <div>
                      <Typography variant='body2' color='text.secondary' className='mb-1'>
                        Secondary Contact
                      </Typography>
                      <Typography variant='body1'>
                        {brandInfo.secondaryContact}
                      </Typography>
                    </div>
                  )}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Box className='space-y-3'>
                  <div>
                    <Typography variant='body2' color='text.secondary' className='mb-1'>
                      Status
                    </Typography>
                    <Chip
                      label={brandInfo.isActive ? 'Active' : 'Inactive'}
                      color={brandInfo.isActive ? 'success' : 'error'}
                      size='small'
                      variant='tonal'
                    />
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
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box className='text-center'>
                  <Typography variant='h4' color='primary'>
                    {statistics.totalInvoices || 0}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Total Invoices
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box className='text-center'>
                  <Typography variant='h4' color='text.primary'>
                    {formatCurrency(statistics.grossPurchases)}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Gross Purchases
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box className='text-center'>
                  <Typography variant='h4' color='text.primary'>
                    {formatCurrency(statistics.totalFreight)}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Total Freight
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box className='text-center'>
                  <Typography variant='h4' color='info.main'>
                    {formatCurrency(statistics.totalDiscount)}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Total Discount
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box className='text-center'>
                  <Typography variant='h4' color='text.primary'>
                    {formatCurrency(statistics.grandTotal)}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Grand Total
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box className='text-center'>
                  <Typography variant='h4' color='success.main'>
                    {formatCurrency(statistics.totalPaid)}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Total Paid
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box className='text-center'>
                  <Typography variant='h4' color='error.main'>
                    {formatCurrency(statistics.outstandingAmount)}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Outstanding Amount
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </div>
        </Card>
      )}

      {/* Purchase Entries Table */}
      <Card>
        <CustomDataTable
          apiURL={`/reports/brands/${brandId}`}
          queryKey='brand-detailed-purchase-entries'
          columns={columns}
          filters={filters}
          enableSelection={false}
          extraQueryParams={{}}
          defaultPageSize={10}
          enableSearch={true}
          enableExport={false}
        />
      </Card>
    </div>
  )
}

export default BrandDetailedReportPage
