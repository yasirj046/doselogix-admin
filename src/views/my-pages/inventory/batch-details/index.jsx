'use client'

// React Imports
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'

// MUI Imports
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles'

// Third-party Imports
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'

// Service Imports
import { inventoryService } from '@/services/inventoryService'

// Styles
import tableStyles from '@core/styles/table.module.css'

// Styled Components
const Icon = styled('i')({})

// Column Definitions for batch details table
const columnHelper = createColumnHelper()

const BatchDetailsPage = () => {
  const router = useRouter()
  const params = useParams()
  const productId = params?.productId

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [stockStatusFilter, setStockStatusFilter] = useState('')
  const [expiryStatusFilter, setExpiryStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [sortOrder, setSortOrder] = useState('asc')

  // API call to get batch details
  const {
    data: batchDetailsData,
    isLoading,
    error
  } = inventoryService.getBatchDetailsByProduct('get-batch-details', productId)

  const batchDetails = batchDetailsData?.data?.result || []
  const productInfo = batchDetails[0] || {}

  // Memoize today's date to avoid creating new Date objects on every render
  const today = useMemo(() => new Date(), [])

  // Reset filters when component mounts
  useEffect(() => {
    setSearchTerm('')
    setStockStatusFilter('')
    setExpiryStatusFilter('')
    setSortBy('')
    setSortOrder('asc')
  }, [productId])

  // Helper function to calculate stock status (memoized)
  const getStockStatus = useCallback((quantity, reserved) => {
    if (quantity === 0) return 'Out of Stock'
    if (quantity <= 10) return 'Low Stock'
    if (quantity === reserved) return 'Reserved'
    return 'In Stock'
  }, [])

  // Helper function to calculate expiry status (memoized)
  const getExpiryStatus = useCallback((expiryDate) => {
    if (!expiryDate) return 'Unknown'

    const expiry = new Date(expiryDate)
    const daysToExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))

    if (daysToExpiry < 0) return 'Expired'
    if (daysToExpiry <= 30) return 'Expiring Soon'
    if (daysToExpiry <= 90) return 'Near Expiry'
    return 'Valid'
  }, [today])

  // Memoized filtered batch details
  const filteredBatchDetails = useMemo(() => {
    return batchDetails.filter(batch => {
      // Text search
      const matchesSearch = !searchTerm ||
        (batch.batchNumber && batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (batch.expiryDate && new Date(batch.expiryDate).toLocaleDateString().includes(searchTerm))

      // Stock status filter
      const quantity = batch.currentQuantity || 0
      const reserved = batch.reservedQuantity || 0
      const stockStatus = getStockStatus(quantity, reserved)
      const matchesStockStatus = !stockStatusFilter || stockStatus === stockStatusFilter

      // Expiry status filter
      const expiryStatus = getExpiryStatus(batch.expiryDate)
      const matchesExpiryStatus = !expiryStatusFilter || expiryStatus === expiryStatusFilter

      return matchesSearch && matchesStockStatus && matchesExpiryStatus
    })
  }, [batchDetails, searchTerm, stockStatusFilter, expiryStatusFilter, getStockStatus, getExpiryStatus])

  // Memoized sorted batch details
  const sortedBatchDetails = useMemo(() => {
    if (!sortBy) return filteredBatchDetails

    return [...filteredBatchDetails].sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case 'batchNumber':
          aValue = a.batchNumber || ''
          bValue = b.batchNumber || ''
          break
        case 'expiryDate':
          aValue = a.expiryDate ? new Date(a.expiryDate) : new Date(0)
          bValue = b.expiryDate ? new Date(b.expiryDate) : new Date(0)
          break
        case 'quantity':
          aValue = a.currentQuantity || 0
          bValue = b.currentQuantity || 0
          break
        case 'available':
          aValue = (a.currentQuantity || 0) - (a.reservedQuantity || 0)
          bValue = (b.currentQuantity || 0) - (b.reservedQuantity || 0)
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }, [filteredBatchDetails, sortBy, sortOrder])

  // Clear all filters (memoized)
  const clearFilters = useCallback(() => {
    setSearchTerm('')
    setStockStatusFilter('')
    setExpiryStatusFilter('')
    setSortBy('')
    setSortOrder('asc')
  }, [])

  // Define columns for batch details table (memoized)
  const columns = useMemo(() => [
    columnHelper.accessor('batchNumber', {
      header: 'Batch Number',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Icon className='tabler-barcode text-primary' />
          <Typography className='font-medium' color='text.primary'>
            {row.original.batchNumber || 'N/A'}
          </Typography>
        </div>
      )
    }),
    columnHelper.accessor('expiryDate', {
      header: 'Expiry Date',
      cell: ({ row }) => {
        const expiryDate = row.original.expiryDate ? new Date(row.original.expiryDate) : null
        const isExpired = expiryDate && expiryDate < today
        const daysToExpiry = expiryDate ? Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24)) : null

        return (
          <div className='flex flex-col'>
            <Typography color={isExpired ? 'error' : 'text.primary'}>
              {expiryDate ? expiryDate.toLocaleDateString() : 'N/A'}
            </Typography>
            {daysToExpiry !== null && (
              <Typography variant='body2' color='text.secondary'>
                {daysToExpiry < 0 ? `Expired ${Math.abs(daysToExpiry)} days ago` :
                 daysToExpiry === 0 ? 'Expires today' :
                 `${daysToExpiry} days remaining`}
              </Typography>
            )}
          </div>
        )
      }
    }),
    columnHelper.accessor('currentQuantity', {
      header: 'Quantity',
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <Typography className='font-semibold' color='text.primary'>
            {row.original.currentQuantity ? row.original.currentQuantity.toLocaleString() : '0'}
          </Typography>
          {row.original.reservedQuantity > 0 && (
            <Typography variant='body2' className='text-warning-main'>
              {row.original.reservedQuantity} reserved
            </Typography>
          )}
        </div>
      )
    }),
    columnHelper.accessor('availableQuantity', {
      header: 'Available',
      cell: ({ row }) => {
        const available = (row.original.currentQuantity || 0) - (row.original.reservedQuantity || 0)
        return (
          <Typography className={`font-medium ${available > 0 ? 'text-success-main' : 'text-error-main'}`}>
            {available.toLocaleString()}
          </Typography>
        )
      }
    }),
    columnHelper.accessor('stockStatus', {
      header: 'Stock Status',
      cell: ({ row }) => {
        const quantity = row.original.currentQuantity || 0
        const reserved = row.original.reservedQuantity || 0
        const status = getStockStatus(quantity, reserved)

        let color = 'success'
        switch (status) {
          case 'Out of Stock':
            color = 'error'
            break
          case 'Low Stock':
            color = 'warning'
            break
          case 'Reserved':
            color = 'info'
            break
          default:
            color = 'success'
        }

        return (
          <Chip
            variant='tonal'
            label={status}
            size='small'
            color={color}
            className='capitalize font-medium'
          />
        )
      }
    }),
    columnHelper.accessor('expiryStatus', {
      header: 'Expiry Status',
      cell: ({ row }) => {
        const status = getExpiryStatus(row.original.expiryDate)

        let color = 'success'
        switch (status) {
          case 'Expired':
            color = 'error'
            break
          case 'Expiring Soon':
            color = 'warning'
            break
          case 'Near Expiry':
            color = 'info'
            break
          case 'Unknown':
            color = 'default'
            break
          default:
            color = 'success'
        }

        return (
          <Chip
            variant='tonal'
            label={status}
            size='small'
            color={color}
            className='capitalize font-medium'
          />
        )
      }
    }),
    columnHelper.accessor('pricing', {
      header: 'Pricing',
      cell: ({ row }) => (
        <div className='flex flex-col gap-1'>
          <Typography variant='body2'>
            <strong>Sale:</strong> ₨{row.original.salePrice ? row.original.salePrice.toLocaleString() : '0'}
          </Typography>
          <Typography variant='body2'>
            <strong>Retail:</strong> ₨{row.original.retailPrice ? row.original.retailPrice.toLocaleString() : '0'}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            <strong>Cost:</strong> ₨{row.original.averageCost ? row.original.averageCost.toLocaleString() : '0'}
          </Typography>
        </div>
      )
    })
  ], [today, getStockStatus, getExpiryStatus])

  // Table configuration
  const table = useReactTable({
    data: sortedBatchDetails,
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  // Memoized totals calculations (use original data for totals, not filtered)
  const totals = useMemo(() => {
    const totalQuantity = batchDetails.reduce((sum, batch) => sum + (batch.currentQuantity || 0), 0)
    const totalReserved = batchDetails.reduce((sum, batch) => sum + (batch.reservedQuantity || 0), 0)
    const totalAvailable = totalQuantity - totalReserved

    return { totalQuantity, totalReserved, totalAvailable }
  }, [batchDetails])

  // Memoized filtered totals calculations
  const filteredTotals = useMemo(() => {
    const filteredTotalQuantity = sortedBatchDetails.reduce((sum, batch) => sum + (batch.currentQuantity || 0), 0)
    const filteredTotalReserved = sortedBatchDetails.reduce((sum, batch) => sum + (batch.reservedQuantity || 0), 0)
    const filteredTotalAvailable = filteredTotalQuantity - filteredTotalReserved

    return { filteredTotalQuantity, filteredTotalReserved, filteredTotalAvailable }
  }, [sortedBatchDetails])

  if (!productId) {
    return (
      <Box p={4} textAlign='center'>
        <Typography color='error'>
          Product ID is required to view batch details
        </Typography>
      </Box>
    )
  }

  return (
    <div>
      {/* Header Section */}
      <Box mb={3}>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-3'>
            <IconButton onClick={() => router.back()}>
              <Icon className='tabler-arrow-left' />
            </IconButton>
            <Icon className='tabler-pill text-primary' />
            <div>
              <Typography variant='h4'>
                Batch Details - {productInfo.productId?.productName || 'Product'}
              </Typography>
              <Typography variant='body1' color='text.secondary' className='mt-1'>
                Brand: {productInfo.brandId?.brandName || 'N/A'} | Total Batches: {batchDetails.length}
              </Typography>
            </div>
          </div>
          <div className='flex gap-2'>
            <Button variant='contained' startIcon={<Icon className='tabler-download' />}>
              Export Report
            </Button>
          </div>
        </div>
      </Box>

      {isLoading ? (
        <Box display='flex' justifyContent='center' alignItems='center' height='300px'>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box p={4} textAlign='center'>
          <Typography color='error'>
            Error loading batch details: {error.message}
          </Typography>
        </Box>
      ) : batchDetails.length === 0 ? (
        <Box p={4} textAlign='center'>
          <Typography color='text.secondary'>
            No batch details found for this product.
          </Typography>
        </Box>
      ) : (
        <>
          {/* Summary Cards */}
          <Card className='mb-6'>
            <CardContent>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Card variant='outlined' sx={{ height: '100%' }}>
                    <CardContent className='text-center' sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '120px' }}>
                      <Icon className='tabler-package text-primary mb-2' style={{ fontSize: '2rem' }} />
                      <Typography variant='h4' className='text-primary'>
                        {totals.totalQuantity.toLocaleString()}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Total Quantity
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Card variant='outlined' sx={{ height: '100%' }}>
                    <CardContent className='text-center' sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '120px' }}>
                      <Icon className='tabler-lock text-warning-main mb-2' style={{ fontSize: '2rem' }} />
                      <Typography variant='h4' className='text-warning-main'>
                        {totals.totalReserved.toLocaleString()}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Reserved Quantity
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Card variant='outlined' sx={{ height: '100%' }}>
                    <CardContent className='text-center' sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '120px' }}>
                      <Icon className='tabler-check-square text-success-main mb-2' style={{ fontSize: '2rem' }} />
                      <Typography variant='h4' className='text-success-main'>
                        {totals.totalAvailable.toLocaleString()}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Available Quantity
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Search and Filter Section */}
          <Card className='mb-6'>
            <CardContent>
              <Typography variant='h6' className='mb-4 flex items-center gap-2'>
                <Icon className='tabler-search' />
                Search & Filter Batches
              </Typography>

              <Grid container spacing={3}>
                {/* Search Input */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Search batches"
                    placeholder="Search by batch number or expiry date..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Icon className='tabler-search' />
                        </InputAdornment>
                      ),
                      endAdornment: searchTerm && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setSearchTerm('')}>
                            <Icon className='tabler-x' />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>

                {/* Stock Status Filter */}
                <Grid size={{ xs: 12, md: 2.5 }}>
                  <FormControl fullWidth>
                    <InputLabel>Stock Status</InputLabel>
                    <Select
                      value={stockStatusFilter}
                      onChange={(e) => setStockStatusFilter(e.target.value)}
                      label="Stock Status"
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="In Stock">In Stock</MenuItem>
                      <MenuItem value="Low Stock">Low Stock</MenuItem>
                      <MenuItem value="Out of Stock">Out of Stock</MenuItem>
                      <MenuItem value="Reserved">Reserved</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Expiry Status Filter */}
                <Grid size={{ xs: 12, md: 2.5 }}>
                  <FormControl fullWidth>
                    <InputLabel>Expiry Status</InputLabel>
                    <Select
                      value={expiryStatusFilter}
                      onChange={(e) => setExpiryStatusFilter(e.target.value)}
                      label="Expiry Status"
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="Valid">Valid</MenuItem>
                      <MenuItem value="Near Expiry">Near Expiry</MenuItem>
                      <MenuItem value="Expiring Soon">Expiring Soon</MenuItem>
                      <MenuItem value="Expired">Expired</MenuItem>
                      <MenuItem value="Unknown">Unknown</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Sort By */}
                <Grid size={{ xs: 12, md: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      label="Sort By"
                    >
                      <MenuItem value="">
                        <em>Default Order</em>
                      </MenuItem>
                      <MenuItem value="batchNumber">Batch Number</MenuItem>
                      <MenuItem value="expiryDate">Expiry Date</MenuItem>
                      <MenuItem value="quantity">Quantity</MenuItem>
                      <MenuItem value="available">Available</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Sort Order */}
                <Grid size={{ xs: 12, md: 1 }}>
                  <IconButton
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    sx={{ mt: 1, height: '56px', width: '56px' }}
                    color="primary"
                  >
                    <Icon className={`tabler-sort-${sortOrder === 'asc' ? 'ascending' : 'descending'}`} />
                  </IconButton>
                </Grid>
              </Grid>

              {/* Filter Summary */}
              <Box mt={3} display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                  <Typography variant="body2" color="text.secondary">
                    Showing {sortedBatchDetails.length} of {batchDetails.length} batches
                  </Typography>

                  {/* Active Filter Chips */}
                  {(searchTerm || stockStatusFilter || expiryStatusFilter) && (
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {searchTerm && (
                        <Chip
                          size="small"
                          label={`Search: "${searchTerm}"`}
                          onDelete={() => setSearchTerm('')}
                          color="primary"
                          variant="outlined"
                        />
                      )}
                      {stockStatusFilter && (
                        <Chip
                          size="small"
                          label={`Stock: ${stockStatusFilter}`}
                          onDelete={() => setStockStatusFilter('')}
                          color="primary"
                          variant="outlined"
                        />
                      )}
                      {expiryStatusFilter && (
                        <Chip
                          size="small"
                          label={`Expiry: ${expiryStatusFilter}`}
                          onDelete={() => setExpiryStatusFilter('')}
                          color="primary"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  )}
                </Box>

                {/* Clear All Filters Button */}
                {(searchTerm || stockStatusFilter || expiryStatusFilter || sortBy !== '' || sortOrder !== 'asc') && (
                  <Button
                    size="small"
                    onClick={clearFilters}
                    startIcon={<Icon className='tabler-refresh' />}
                  >
                    Clear All
                  </Button>
                )}
              </Box>

              {/* Filtered Summary Cards - Show only when filters are applied */}
              {sortedBatchDetails.length !== batchDetails.length && (
                <Box mt={3}>
                  <Typography variant="body2" color="text.secondary" className="mb-2">
                    Filtered Results Summary:
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 4 }}>
                      <Card variant='outlined' size="small">
                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Typography variant="body2" color="text.secondary">Total</Typography>
                          <Typography variant="h6" className='text-primary'>
                            {filteredTotals.filteredTotalQuantity.toLocaleString()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Card variant='outlined'>
                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Typography variant="body2" color="text.secondary">Reserved</Typography>
                          <Typography variant="h6" className='text-warning-main'>
                            {filteredTotals.filteredTotalReserved.toLocaleString()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Card variant='outlined'>
                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Typography variant="body2" color="text.secondary">Available</Typography>
                          <Typography variant="h6" className='text-success-main'>
                            {filteredTotals.filteredTotalAvailable.toLocaleString()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Batch Details Table */}
          <Card>
            <CardContent>
              <Typography variant='h6' className='mb-4'>
                Batch Details
              </Typography>
              {sortedBatchDetails.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Icon className='tabler-search-off' style={{ fontSize: '3rem', opacity: 0.3 }} />
                  <Typography variant="h6" color="text.secondary" mt={2}>
                    No batches found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {batchDetails.length === 0
                      ? "No batch details available for this product."
                      : "Try adjusting your search criteria or filters."
                    }
                  </Typography>
                  {batchDetails.length > 0 && (
                    <Button
                      variant="outlined"
                      onClick={clearFilters}
                      startIcon={<Icon className='tabler-refresh' />}
                      sx={{ mt: 2 }}
                    >
                      Clear All Filters
                    </Button>
                  )}
                </Box>
              ) : (
                <div className='overflow-x-auto'>
                  <table className={tableStyles.table}>
                    <thead>
                      {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map(header => (
                            <th key={header.id}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())
                              }
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.map(row => (
                        <tr key={row.id}>
                          {row.getVisibleCells().map(cell => (
                            <td key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default BatchDetailsPage
