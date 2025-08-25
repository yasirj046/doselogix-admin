'use client'

// React Imports
import { useEffect, useState, useMemo, useCallback } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'
import TablePagination from '@mui/material/TablePagination'
import MenuItem from '@mui/material/MenuItem'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'

// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'

// Component Imports
import axios from 'axios'

import { useSession } from 'next-auth/react'

import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomTextField from '@core/components/mui/TextField'

// Style Imports
import tableStyles from '@core/styles/table.module.css'
import { API_BASE_URL } from '@/contsants/api'

// Styled Components
const Icon = styled('i')({})

const fuzzyFilter = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
  }, [value])

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

const CustomDataTable = ({
  apiURL,
  queryKey,
  columns,
  filters = null,
  title = '',
  enableSelection = false,
  enableExport = true,
  enableSearch = true,
  defaultPageSize = 10,
  onRowClick = null,
  extraQueryParams = {},
  transformData = null,
  transformColumns = null
}) => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [filterValues, setFilterValues] = useState({})
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  // Get session for authentication
  const { data: session } = useSession()

  // Build query parameters
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams()

    // Add pagination
    params.append('pageNumber', currentPage + 1)
    params.append('pageSize', pageSize)

    // Add search
    if (globalFilter) {
      params.append('keyword', globalFilter)
    }

    // Add filters
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value) {
        params.append(key, value)
      }
    })

    // Add extra query params
    Object.entries(extraQueryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value)
      }
    })

    return params.toString()
  }, [currentPage, pageSize, globalFilter, filterValues, extraQueryParams])

  // API Call using React Query with axios
  const {
    data: apiResponse,
    isLoading,
    isFetching,
    error
  } = useQuery({
    queryKey: [queryKey, 'page', currentPage, pageSize, globalFilter, filterValues, extraQueryParams],
    queryFn: async () => {
      if (!apiURL) {
        throw new Error('API URL is required')
      }

      const queryParams = buildQueryParams()
      const url = `${API_BASE_URL}${apiURL}?${queryParams}`

      const config = {
        headers: {}
      }

      // Add authorization header if session exists
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`
      }

      const response = await axios.get(url, config)

      return response.data
    },
    enabled: !!apiURL && !!session, // Only run query when API URL and session are available
    staleTime: 0, // Always consider data stale to ensure fresh API calls
    cacheTime: 0, // Don't cache to ensure fresh data on every page change
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: true // Always refetch when component mounts
  })

  // Transform data if needed
  const tableData = useMemo(() => {
    if (!apiResponse) return []

    // Handle different API response structures
    let data = []
    let totalItems = 0
    let totalPages = 0

    if (apiResponse.result && apiResponse.result.docs) {
      // Structure: { result: { docs: [...], totalDocs: X, totalPages: Y } }
      data = apiResponse.result.docs
      totalItems = apiResponse.result.totalDocs || 0
      totalPages = apiResponse.result.totalPages || 0
    } else if (apiResponse.docs) {
      // Structure: { docs: [...], totalDocs: X, totalPages: Y }
      data = apiResponse.docs
      totalItems = apiResponse.totalDocs || 0
      totalPages = apiResponse.totalPages || 0
    } else if (Array.isArray(apiResponse)) {
      // Structure: [...]
      data = apiResponse
      totalItems = apiResponse.length
      totalPages = 1
    } else {
      // Fallback: assume it's the data directly
      data = apiResponse
      totalItems = Array.isArray(apiResponse) ? apiResponse.length : 0
      totalPages = 1
    }

    // Apply custom transform if provided
    if (transformData) {
      data = transformData(data)
    }

    return data
  }, [apiResponse, transformData])

  // Transform columns if needed
  const tableColumns = useMemo(() => {
    if (!columns) return []

    let processedColumns = transformColumns ? transformColumns(columns) : columns

    // Add selection column if enabled
    if (enableSelection) {
      const selectionColumn = {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            indeterminate={row.getIsSomeSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        )
      }

      processedColumns = [selectionColumn, ...processedColumns]
    }

    return processedColumns
  }, [columns, enableSelection, transformColumns])

  // Handle filter changes
  const handleFilterChange = (filterKey, value, filterConfig) => {
    setFilterValues(prev => ({
      ...prev,
      [filterKey]: value
    }))

    if (filterConfig?.onChange) {
      filterConfig.onChange(value)
    }

    setCurrentPage(0) // Reset to first page when filter changes
  }

  // Handle page size change
  const handlePageSizeChange = newPageSize => {
    setPageSize(newPageSize)
    setCurrentPage(0) // Reset to first page when page size changes
  }

  // Handle search change
  const handleSearchChange = value => {
    setGlobalFilter(value)
    setCurrentPage(0) // Reset to first page when search changes
  }

  // Get pagination info from API response
  const getPaginationInfo = () => {
    if (!apiResponse) return { totalItems: 0, totalPages: 0 }

    if (apiResponse.result) {
      return {
        totalItems: apiResponse.result.totalDocs || 0,
        totalPages: apiResponse.result.totalPages || 0
      }
    } else if (apiResponse.totalDocs) {
      return {
        totalItems: apiResponse.totalDocs || 0,
        totalPages: apiResponse.totalPages || 0
      }
    } else {
      return {
        totalItems: Array.isArray(apiResponse) ? apiResponse.length : 0,
        totalPages: 1
      }
    }
  }

  const { totalItems, totalPages } = getPaginationInfo()

  // Table configuration
  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter,
      pagination: {
        pageIndex: currentPage,
        pageSize: pageSize
      }
    },
    enableRowSelection: enableSelection,
    globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: totalPages
  })

  // Handle export functionality
  const handleExport = () => {
    // Implement export logic here
    console.log('Export functionality to be implemented')
  }

  // Handle row click
  const handleRowClick = row => {
    if (onRowClick) {
      onRowClick(row.original)
    }
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color='error' align='center'>
            Error loading data: {error.message}
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      {/* Title Section */}
      {title && <CardHeader title={title} className='pbe-4' />}

      {/* Filters Section */}
      {filters && (
        <>
          <CardHeader title={filters.heading || 'Filters'} className='pbe-4' />
          <CardContent>
            <Grid container spacing={6}>
              {filters.filterArray?.map((filter, index) => (
                <Grid size={{ xs: 12, sm: 4 }} key={index}>
                  <CustomTextField
                    select
                    fullWidth
                    id={`select-${filter.dbColumn}`}
                    value={filterValues[filter.dbColumn] || ''}
                    onChange={e => handleFilterChange(filter.dbColumn, e.target.value, filter)}
                    slotProps={{
                      select: { displayEmpty: true }
                    }}
                  >
                    <MenuItem value=''>{filter.placeholder || `Select ${filter.label}`}</MenuItem>
                    {filter.options?.map((option, optionIndex) => (
                      <MenuItem key={optionIndex} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </CustomTextField>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </>
      )}

      {/* Controls Section */}
      <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 border-bs gap-4'>
        <CustomTextField
          select
          value={pageSize}
          onChange={e => handlePageSizeChange(Number(e.target.value))}
          className='max-sm:is-full sm:is-[70px]'
        >
          <MenuItem value='10'>10</MenuItem>
          <MenuItem value='25'>25</MenuItem>
          <MenuItem value='50'>50</MenuItem>
          <MenuItem value='100'>100</MenuItem>
        </CustomTextField>

        <div className='flex flex-col sm:flex-row max-sm:is-full items-start sm:items-center gap-4'>
          {enableSearch && (
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={handleSearchChange}
              placeholder='Search...'
              className='max-sm:is-full'
            />
          )}
          {enableExport && (
            <Button
              color='secondary'
              variant='tonal'
              startIcon={<i className='tabler-upload' />}
              className='max-sm:is-full'
              onClick={handleExport}
            >
              Export
            </Button>
          )}
        </div>
      </div>

      {isLoading || isFetching ? (
        <Box display='flex' justifyContent='center' p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <div>
          {/* Table Section */}
          <div className='overflow-x-auto'>
            <table className={tableStyles.table}>
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id}>
                        {header.isPlaceholder ? null : (
                          <div
                            className={classnames({
                              'flex items-center': header.column.getIsSorted(),
                              'cursor-pointer select-none': header.column.getCanSort()
                            })}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: <i className='tabler-chevron-up text-xl' />,
                              desc: <i className='tabler-chevron-down text-xl' />
                            }[header.column.getIsSorted()] ?? null}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              {tableData.length === 0 && !isLoading ? (
                <tbody>
                  <tr>
                    <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                      No data available
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody>
                  {table.getRowModel().rows.map(row => (
                    <tr
                      key={row.id}
                      className={classnames({
                        selected: row.getIsSelected(),
                        'cursor-pointer hover:bg-gray-50': onRowClick
                      })}
                      onClick={() => handleRowClick(row)}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>

          {/* Pagination Section */}
          <TablePaginationComponent
            table={table}
            totalItems={totalItems}
            totalPages={totalPages}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </Card>
  )
}

export default CustomDataTable
