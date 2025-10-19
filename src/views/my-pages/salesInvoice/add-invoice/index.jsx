'use client'

// React Imports
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

// MUI Imports
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Grid from '@mui/material/Grid2'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'

// Third-party Imports
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'react-toastify'

// Component Imports
import CustomInput from '@/components/custom-components/CustomInput'
import CustomSelect from '@/components/custom-components/CustomSelect'
import CustomButton from '@/components/custom-components/CustomButton'
import FormikProvider from '@/contexts/formikContext'

// Service Imports
import { salesInvoiceService } from '@/services/salesInvoiceService'
import { lookupService } from '@/services/lookupService'
import { productService } from '@/services/productService'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Validation Schemas
const productSchema = Yup.object().shape({
  productId: Yup.string().required('Product is required'),
  inventoryId: Yup.string().required('Inventory batch is required'),
  quantity: Yup.number().min(1, 'Quantity must be at least 1').required('Quantity is required'),
  bonus: Yup.number().min(0, 'Bonus must be positive'),
  stock: Yup.number().min(0, 'Stock must be positive'),
  expiryDate: Yup.date(),
  price: Yup.number().min(0, 'Price must be positive').required('Price is required'),
  discount: Yup.number().min(0, 'Discount must be positive'),
  discountType: Yup.string().oneOf(['percentage', 'flat'], 'Invalid discount type'),
  lessToMinimumCheck: Yup.boolean()
})

const AddSalesInvoicePage = () => {
  const router = useRouter()
  const params = useParams()
  const invoiceId = params?.invoiceId

  // States
  const [customers, setCustomers] = useState([])
  const [employees, setEmployees] = useState([])
  const [products, setProducts] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [selectedCustomerData, setSelectedCustomerData] = useState(null)
  const [filteredProducts, setFilteredProducts] = useState([])
  const [editingProductIndex, setEditingProductIndex] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState('')
  const [isAddingPayment, setIsAddingPayment] = useState(false)
  const [isRemovingPayment, setIsRemovingPayment] = useState(false)

  // Hooks
  const queryClient = useQueryClient()
  const isEditMode = !!invoiceId

  // Get sales invoice details if editing
  const {
    data: salesInvoiceDetails,
    isLoading: isLoadingSalesInvoiceDetails,
    error: salesInvoiceDetailsError
  } = useQuery({
    queryKey: ['get-sales-invoice-details', invoiceId],
    queryFn: () => salesInvoiceService.getOneSalesEntryDetails('get-sales-invoice-details', invoiceId).queryFn(),
    enabled: isEditMode,
    retry: false,
    refetchOnWindowFocus: false
  })

  // Get last invoice data by customer
  const { data: lastInvoiceData, isFetching: lastInvoiceLoading } = salesInvoiceService.getLastInvoiceByCustomer('get-last-invoice-by-customer', selectedCustomer)

  // Get available inventory for selected product
  const { data: inventoryData, isLoading: isLoadingInventory, error: inventoryError } = salesInvoiceService.getAvailableInventory('get-available-inventory', selectedProduct)

  // Create sales invoice mutation
  const createSalesInvoiceMutation = useMutation({
    mutationFn: salesInvoiceService.createSalesEntry().mutationFn,
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['get-all-sales-invoices'] })
      toast.success('Sales invoice created successfully!')
      router.push(getLocalizedUrl('/sales-invoice', params.lang))
    },
    onError: error => {
      console.error('Create sales invoice error:', error)
      toast.error(error?.response?.data?.message || 'Failed to create sales invoice')
    }
  })

  // Update sales invoice mutation
  const updateSalesInvoiceMutation = useMutation({
    mutationFn: salesInvoiceService.updateSalesEntry().mutationFn,
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['get-all-sales-invoices'] })
      toast.success('Sales invoice updated successfully!')
      router.push(getLocalizedUrl('/sales-invoice', params.lang))
    },
    onError: error => {
      console.error('Update sales invoice error:', error)
      toast.error(error?.response?.data?.message || 'Failed to update sales invoice')
    }
  })

  // Fetch lookup data using React Query
  const { data: customersData } = lookupService.getCustomersLookup('get-customers-lookup')
  const { data: employeesData } = lookupService.getEmployeesLookup('get-employees-lookup')
  const { data: productsData } = productService.getAllProducts('get-all-products')

  // Main formik for sales invoice
  const formik = useFormik({
    initialValues: {
      customerId: '',
      deliverBy: '',
      bookedBy: '',
      date: new Date().toISOString().split('T')[0],
      licenseNumber: '',
      licenseExpiry: '',
      deliveryLogNumber: '',
      cash: 0,
      products: [],
      paymentDetails: []
    },
    validationSchema: Yup.object({
      customerId: Yup.string().required('Customer is required'),
      deliverBy: Yup.string().required('Deliver by is required'),
      bookedBy: Yup.string().required('Booked by is required'),
      date: Yup.date().required('Date is required'),
      cash: Yup.number().min(0, 'Cash must be positive'),
      products: Yup.array().min(1, 'At least one product is required')
    }),
    onSubmit: values => {
      if (isEditMode) {
        updateSalesInvoiceMutation.mutate({ id: invoiceId, salesEntryData: values })
      } else {
        createSalesInvoiceMutation.mutate(values)
      }
    }
  })

  // Get current minimum price for validation
  const getCurrentMinPrice = () => {
    const selectedInventory = inventoryData?.result?.find(inv => inv.value === productFormik.values.inventoryId)
    return selectedInventory?.data?.minSalePrice ? Number(selectedInventory.data.minSalePrice) : 0
  }

  // Product formik for adding/editing products
  const productFormik = useFormik({
    initialValues: {
      productId: '',
      inventoryId: '',
      quantity: '',
      bonus: 0,
      stock: '',
      expiryDate: '',
      price: '',
      discount: 0,
      discountType: 'percentage',
      lessToMinimumCheck: false
    },
    validationSchema: productSchema,
    validate: values => {
      const errors = {}

      // Real-time minimum price validation
      if (values.price && values.inventoryId) {
        const selectedInventory = inventoryData?.result?.find(inv => inv.value === values.inventoryId)
        if (selectedInventory && selectedInventory.data.minSalePrice) {
          const minPrice = Number(selectedInventory.data.minSalePrice)
          const enteredPrice = Number(values.price)

          if (enteredPrice < minPrice && !values.lessToMinimumCheck) {
            errors.price = `Price cannot be below minimum sale price of ₨${minPrice}.`
          }
        }
      }

      return errors
    },
    onSubmit: values => {
      // Validate price against min sale price
      const selectedInventory = inventoryData?.result?.find(inv => inv.value === values.inventoryId)
      if (selectedInventory && selectedInventory.data.minSalePrice) {
        const minPrice = Number(selectedInventory.data.minSalePrice)
        const enteredPrice = Number(values.price)

        if (enteredPrice < minPrice && !values.lessToMinimumCheck) {
          productFormik.setFieldError('price', `Price cannot be below minimum sale price of ₨${minPrice}. Check "Allow below min price" to proceed.`)
          return
        }
      }

      const existingProducts = formik.values.products

      if (editingProductIndex !== null) {
        // Update existing product
        const updatedProducts = [...existingProducts]
        updatedProducts[editingProductIndex] = values
        formik.setFieldValue('products', updatedProducts)
        setEditingProductIndex(null)
      } else {
        // Add new product
        formik.setFieldValue('products', [...existingProducts, values])
      }

      // Reset product form
      productFormik.resetForm()
      setSelectedProduct('')
    }
  })

  // Payment formik for adding payments
  const paymentFormik = useFormik({
    initialValues: {
      method: '',
      reference: '',
      amountPaid: ''
    },
    validationSchema: Yup.object({
      method: Yup.string().required('Payment method is required'),
      amountPaid: Yup.number().min(1, 'Amount must be greater than 0').required('Amount is required')
    }),
    onSubmit: values => {
      const existingPayments = formik.values.paymentDetails
      formik.setFieldValue('paymentDetails', [...existingPayments, values])
      paymentFormik.resetForm()
      setIsAddingPayment(false)
    }
  })

  // Transform customers data
  useEffect(() => {
    if (customersData?.data?.success) {
      const result = customersData.data.result?.docs || customersData.data.result || []
      const transformedCustomers = result.map(customer => {
        // Check if it's already in lookup format (has label/value) or paginated format (has _id/customerName)
        if (customer.label && customer.value) {
          // Lookup format - already has label and value
          return {
            value: customer.value,
            label: customer.label,
            data: customer // Store full customer data for auto-filling fields
          }
        } else {
          // Paginated format - transform it
          return {
            value: customer._id || customer.id,
            label: customer.customerName || customer.name || 'Unknown Customer',
            data: customer // Store full customer data for auto-filling fields
          }
        }
      })
      setCustomers(transformedCustomers)
    }
  }, [customersData])

  // Transform employees data
  useEffect(() => {
    if (employeesData?.data?.success) {
      const result = employeesData.data.result?.docs || employeesData.data.result || []
      const transformedEmployees = result.map(employee => {
        // Check if it's already in lookup format (has label/value) or paginated format (has _id/employeeName)
        if (employee.label && employee.value) {
          // Lookup format - already has label and value
          return {
            value: employee.value,
            label: employee.label
          }
        } else {
          // Paginated format - transform it
          return {
            value: employee._id || employee.id,
            label: employee.employeeName || employee.name || 'Unknown Employee'
          }
        }
      })
      setEmployees(transformedEmployees)
    }
  }, [employeesData])

  // Transform products data
  useEffect(() => {
    if (productsData?.data?.success) {
      const result = productsData.data.result?.docs || productsData.data.result || []
      const transformedProducts = result.map(product => {
        // Check if it's already in lookup format (has label/value) or paginated format (has _id/productName)
        if (product.label && product.value) {
          // Lookup format - already has label and value
          return {
            value: product.value,
            label: product.label
          }
        } else {
          // Paginated format - transform it
          return {
            value: product._id || product.id,
            label: product.productName || product.name || 'Unknown Product'
          }
        }
      })
      setProducts(transformedProducts)
      setFilteredProducts(transformedProducts)
    }
  }, [productsData])

  // Handle customer selection and auto-fill license fields
  useEffect(() => {
    if (selectedCustomer && customers.length > 0) {
      const customerData = customers.find(customer => customer.value === selectedCustomer)?.data
      if (customerData) {
        setSelectedCustomerData(customerData)
      }
    } else {
      setSelectedCustomerData(null)
    }
  }, [selectedCustomer, customers])

  // Auto-fill license fields from last invoice data
  useEffect(() => {
    if (lastInvoiceData?.data?.success && lastInvoiceData.data.result) {
      const lastInvoice = lastInvoiceData.data.result
      formik.setFieldValue('licenseNumber', lastInvoice.licenseNumber || '')
      formik.setFieldValue('licenseExpiry', lastInvoice.licenseExpiry ? new Date(lastInvoice.licenseExpiry).toISOString().split('T')[0] : '')
    } else if (selectedCustomer && !lastInvoiceLoading) {
      // Clear if no last invoice found
      formik.setFieldValue('licenseNumber', '')
      formik.setFieldValue('licenseExpiry', '')
    }
  }, [lastInvoiceData, selectedCustomer, lastInvoiceLoading])

  // Load sales invoice data if editing
  useEffect(() => {
    if (salesInvoiceDetails?.data?.success && salesInvoiceDetails.data.result) {
      const invoiceData = salesInvoiceDetails.data.result

      formik.setValues({
        customerId: invoiceData.customerId || '',
        deliverBy: invoiceData.deliverBy || '',
        bookedBy: invoiceData.bookedBy || '',
        date: invoiceData.date ? invoiceData.date.split('T')[0] : new Date().toISOString().split('T')[0],
        licenseNumber: invoiceData.licenseNumber || '',
        licenseExpiry: invoiceData.licenseExpiry ? invoiceData.licenseExpiry.split('T')[0] : '',
        deliveryLogNumber: invoiceData.deliveryLogNumber || '',
        cash: invoiceData.cash || 0,
        products: invoiceData.products || [],
        paymentDetails: invoiceData.paymentDetails || []
      })

      setSelectedCustomer(invoiceData.customerId || '')
    }
  }, [salesInvoiceDetails])



  // Sync selectedProduct with formik value to ensure consistency
  useEffect(() => {
    if (productFormik.values.productId !== selectedProduct) {
      setSelectedProduct(productFormik.values.productId)
    }
  }, [productFormik.values.productId])

  // Handle product selection changes - reset form when product is unselected
  useEffect(() => {
    if (!selectedProduct) {
      // Reset all product-related fields when no product is selected
      productFormik.setFieldValue('inventoryId', '')
      productFormik.setFieldValue('stock', '')
      productFormik.setFieldValue('expiryDate', '')
      productFormik.setFieldValue('price', '')
      productFormik.setFieldValue('quantity', '')
      productFormik.setFieldValue('bonus', 0)
      productFormik.setFieldValue('discount', 0)
      productFormik.setFieldValue('discountType', 'percentage')
      productFormik.setFieldValue('lessToMinimumCheck', false)
    }
  }, [selectedProduct])

  // Handle inventory data when it's loaded
  useEffect(() => {
    if (selectedProduct && inventoryData?.success && inventoryData?.result) {
      const transformedInventory = inventoryData.result

      // Auto-select first batch (FEFO - First Expiry First Out) when inventory is loaded
      if (transformedInventory.length > 0 && !productFormik.values.inventoryId) {
        const firstBatch = transformedInventory[0]

        productFormik.setFieldValue('inventoryId', firstBatch.value)

        // Set stock and expiry immediately
        productFormik.setFieldValue('stock', firstBatch.data.currentQuantity || 0)
        productFormik.setFieldValue('expiryDate', firstBatch.data.expiryDate ? new Date(firstBatch.data.expiryDate).toISOString().split('T')[0] : '')

        // Set price
        const priceToSet = firstBatch.data.salePrice || firstBatch.data.price || 0
        productFormik.setFieldValue('price', priceToSet)
      }
    }
  }, [inventoryData, selectedProduct])

  // Handle inventory selection
  useEffect(() => {
    if (productFormik.values.inventoryId && inventoryData?.result?.length > 0) {
      const selectedInventory = inventoryData.result.find(inv => inv.value === productFormik.values.inventoryId)

      if (selectedInventory) {
        const inventoryItem = selectedInventory.data

        // Always set stock and expiry from selected inventory (non-changeable fields)
        productFormik.setFieldValue('stock', inventoryItem.currentQuantity || 0)
        productFormik.setFieldValue('expiryDate', inventoryItem.expiryDate ? new Date(inventoryItem.expiryDate).toISOString().split('T')[0] : '')

        // Auto-populate price from inventory but allow user to change it
        const priceToSet = inventoryItem.salePrice || inventoryItem.price || 0
        productFormik.setFieldValue('price', priceToSet)
      }
    }
  }, [productFormik.values.inventoryId, inventoryData])

  // Calculate totals
  const calculateTotals = () => {
    const products = formik.values.products
    const subtotal = products.reduce((sum, product) => {
      const quantity = Number(product.quantity) || 0
      const price = Number(product.price) || 0
      const discount = Number(product.discount) || 0
      const discountType = product.discountType || 'percentage'

      const lineTotal = quantity * price

      // Calculate discount amount based on type
      let discountAmount = 0
      if (discountType === 'percentage') {
        discountAmount = (lineTotal * discount) / 100
      } else {
        discountAmount = discount
      }

      return sum + (lineTotal - discountAmount)
    }, 0)

    const cash = Number(formik.values.cash) || 0
    const totalPaid = cash + (formik.values.paymentDetails || []).reduce((sum, payment) => sum + (Number(payment.amountPaid) || 0), 0)
    const remainingBalance = Math.max(0, subtotal - totalPaid)

    return {
      subtotal,
      grandTotal: subtotal,
      totalPaid,
      remainingBalance
    }
  }

  const totals = calculateTotals()

  // Handle removing product
  const handleRemoveProduct = (index) => {
    const updatedProducts = formik.values.products.filter((_, i) => i !== index)
    formik.setFieldValue('products', updatedProducts)
  }

  // Handle editing product
  const handleEditProduct = (index) => {
    const product = formik.values.products[index]
    productFormik.setValues(product)
    setSelectedProduct(product.productId)
    setEditingProductIndex(index)
  }

  // Handle removing payment
  const handleRemovePayment = (index) => {
    const updatedPayments = formik.values.paymentDetails.filter((_, i) => i !== index)
    formik.setFieldValue('paymentDetails', updatedPayments)
  }

  if (isEditMode && isLoadingSalesInvoiceDetails) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, mb: 3 }}>
          <IconButton
            onClick={() => router.push(getLocalizedUrl('/sales-invoice', params.lang))}
            sx={{ p: 2 }}
          >
            <i className="tabler-arrow-left" />
          </IconButton>
          <div>
            <Typography variant="h4">
              {isEditMode ? 'Edit Sales Invoice' : 'Add New Sales Invoice'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isEditMode ? 'Update the sales invoice details' : 'Create a new sales invoice for customer transaction'}
            </Typography>
          </div>
        </Box>
      </Box>

      <FormikProvider formik={{ ...formik, isLoading: createSalesInvoiceMutation.isPending || updateSalesInvoiceMutation.isPending }}>
        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={6}>
            {/* Left Column - Main Form */}
            <Grid size={{ xs: 12, lg: 12 }}>
              {/* Basic Information Card */}
              <Card sx={{ mb: 6 }}>
                <CardHeader title="Basic Information" />
                <CardContent>
                  <Grid container spacing={4}>
                    {/* Row 1: Customer and Date */}
                    <Grid size={{ xs: 12, sm: 6, lg: 6 }}>
                      <CustomSelect
                        fullWidth
                        label="Customer"
                        name="customerId"
                        value={formik.values.customerId}
                        onChange={(e) => {
                          formik.handleChange(e)
                          setSelectedCustomer(e.target.value)
                        }}
                        onBlur={formik.handleBlur}
                        error={formik.touched.customerId && Boolean(formik.errors.customerId)}
                        helperText={formik.touched.customerId && formik.errors.customerId}
                        options={customers}
                        placeholder="Select Customer"
                        autoComplete={true}
                        requiredField
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, lg: 6 }}>
                      <CustomInput
                        fullWidth
                        type="date"
                        label="Invoice Date"
                        name="date"
                        value={formik.values.date}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.date && Boolean(formik.errors.date)}
                        helperText={formik.touched.date && formik.errors.date}
                        requiredField
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                      <CustomInput
                        fullWidth
                        label="Delivery Log Number"
                        name="deliveryLogNumber"
                        value={formik.values.deliveryLogNumber}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="Enter delivery log number"
                      />
                    </Grid>

                    {/* Row 2: Employee Information */}
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                      <CustomSelect
                        fullWidth
                        label="Delivered By"
                        name="deliverBy"
                        value={formik.values.deliverBy}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.deliverBy && Boolean(formik.errors.deliverBy)}
                        helperText={formik.touched.deliverBy && formik.errors.deliverBy}
                        options={employees}
                        placeholder="Select Employee"
                        autoComplete={true}
                        requiredField
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                      <CustomSelect
                        fullWidth
                        label="Booked By"
                        name="bookedBy"
                        value={formik.values.bookedBy}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.bookedBy && Boolean(formik.errors.bookedBy)}
                        helperText={formik.touched.bookedBy && formik.errors.bookedBy}
                        options={employees}
                        placeholder="Select Employee"
                        autoComplete={true}
                        requiredField
                      />
                    </Grid>
                    {/* Non type able fields */}
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                      <Box className="p-3 border rounded-lg bg-gray-50">
                        <Typography variant="body2" className="text-gray-600 mb-1">
                          License Number
                        </Typography>
                        <Typography variant="body1" className="font-medium">
                          {lastInvoiceLoading ? (
                            'Loading...'
                          ) : lastInvoiceData?.data?.success ? (
                            lastInvoiceData.data.result.licenseNumber || 'No Record'
                          ) : (
                            'No Record'
                          )}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                      <Box className="p-3 border rounded-lg bg-gray-50">
                        <Typography variant="body2" className="text-gray-600 mb-1">
                          License Expiry Date
                        </Typography>
                        <Typography variant="body1" className="font-medium">
                          {lastInvoiceLoading ? (
                            'Loading...'
                          ) : lastInvoiceData?.data?.success && lastInvoiceData.data.result.licenseExpiry ? (
                            new Date(lastInvoiceData.data.result.licenseExpiry).toLocaleDateString()
                          ) : (
                            'No Record'
                          )}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Products Card */}
              <Card sx={{ mb: 6 }}>
                <CardHeader title="Products" />
                <CardContent>
                  {/* Add Product Form */}
                  <FormikProvider formik={productFormik}>
                    <Box component="form" onSubmit={productFormik.handleSubmit} sx={{ mb: 6 }}>
                      <Typography variant="h6" sx={{ mb: 4 }}>
                        {editingProductIndex !== null ? 'Edit Product' : 'Add Product'}
                      </Typography>
                      <Grid container spacing={4}>
                        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                          <CustomSelect
                            fullWidth
                            label="Product"
                            name="productId"
                            value={productFormik.values.productId}
                            onChange={(e) => {
                              productFormik.handleChange(e)
                              setSelectedProduct(e.target.value)
                            }}
                            onBlur={productFormik.handleBlur}
                            error={productFormik.touched.productId && Boolean(productFormik.errors.productId)}
                            helperText={productFormik.touched.productId && productFormik.errors.productId}
                            options={filteredProducts}
                            placeholder="Select Product"
                            autoComplete ={true}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                          <CustomSelect
                            fullWidth
                            label="Inventory Batch"
                            name="inventoryId"
                            value={productFormik.values.inventoryId}
                            onChange={productFormik.handleChange}
                            onBlur={productFormik.handleBlur}
                            error={productFormik.touched.inventoryId && Boolean(productFormik.errors.inventoryId)}
                            helperText={productFormik.touched.inventoryId && productFormik.errors.inventoryId}
                            options={inventoryData?.result || []}
                            placeholder={
                              !productFormik.values.productId
                                ? "Select product first"
                                : isLoadingInventory
                                  ? "Loading batches..."
                                  : (inventoryData?.result?.length || 0) === 0
                                    ? "No batches available"
                                    : "Select Batch"
                            }
                            disabled={!productFormik.values.productId || isLoadingInventory}
                            autoComplete ={true}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                          <CustomInput
                            fullWidth
                            type="number"
                            label="Stock"
                            name="stock"
                            value={productFormik.values.stock}
                            onChange={productFormik.handleChange}
                            onBlur={productFormik.handleBlur}
                            error={productFormik.touched.stock && Boolean(productFormik.errors.stock)}
                            helperText={productFormik.touched.stock && productFormik.errors.stock}
                            disabled={true}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                          <CustomInput
                            fullWidth
                            type="date"
                            label="Expiry Date"
                            name="expiryDate"
                            value={productFormik.values.expiryDate}
                            onChange={productFormik.handleChange}
                            onBlur={productFormik.handleBlur}
                            error={productFormik.touched.expiryDate && Boolean(productFormik.errors.expiryDate)}
                            helperText={productFormik.touched.expiryDate && productFormik.errors.expiryDate}
                            disabled={true}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                          <CustomInput
                            fullWidth
                            type="number"
                            label="Quantity"
                            name="quantity"
                            value={productFormik.values.quantity}
                            onChange={productFormik.handleChange}
                            onBlur={productFormik.handleBlur}
                            error={productFormik.touched.quantity && Boolean(productFormik.errors.quantity)}
                            helperText={productFormik.touched.quantity && productFormik.errors.quantity}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                          <CustomInput
                            fullWidth
                            type="number"
                            label="Bonus"
                            name="bonus"
                            value={productFormik.values.bonus}
                            onChange={productFormik.handleChange}
                            onBlur={productFormik.handleBlur}
                            error={productFormik.touched.bonus && Boolean(productFormik.errors.bonus)}
                            helperText={productFormik.touched.bonus && productFormik.errors.bonus}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                          <CustomInput
                            fullWidth
                            type="number"
                            label="Price"
                            name="price"
                            value={productFormik.values.price}
                            onChange={productFormik.handleChange}
                            onBlur={productFormik.handleBlur}
                            error={productFormik.touched.price && Boolean(productFormik.errors.price)}
                            helperText={productFormik.touched.price && productFormik.errors.price}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">₨</InputAdornment>
                            }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                          <CustomSelect
                            fullWidth
                            label="Discount Type"
                            name="discountType"
                            value={productFormik.values.discountType}
                            onChange={productFormik.handleChange}
                            onBlur={productFormik.handleBlur}
                            error={productFormik.touched.discountType && Boolean(productFormik.errors.discountType)}
                            helperText={productFormik.touched.discountType && productFormik.errors.discountType}
                            options={[
                              { value: 'percentage', label: 'Percentage (%)' },
                              { value: 'flat', label: 'Flat Amount (₨)' }
                            ]}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                          <CustomInput
                            fullWidth
                            type="number"
                            label="Discount"
                            name="discount"
                            value={productFormik.values.discount}
                            onChange={productFormik.handleChange}
                            onBlur={productFormik.handleBlur}
                            error={productFormik.touched.discount && Boolean(productFormik.errors.discount)}
                            helperText={productFormik.touched.discount && productFormik.errors.discount}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">
                                {productFormik.values.discountType === 'percentage' ? '%' : '₨'}
                              </InputAdornment>
                            }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', mt: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={productFormik.values.lessToMinimumCheck}
                                  onChange={(e) => productFormik.setFieldValue('lessToMinimumCheck', e.target.checked)}
                                  name="lessToMinimumCheck"
                                />
                              }
                              label={
                                getCurrentMinPrice() > 0
                                  ? `Allow below min ₨${getCurrentMinPrice()} price`
                                  : "Allow below min price"
                              }
                            />
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
                            <Button
                              variant="outlined"
                              onClick={() => {
                                productFormik.resetForm()
                                setSelectedProduct('')
                                setEditingProductIndex(null)
                              }}
                            >
                              Clear Form
                            </Button>
                            <CustomButton
                              type="submit"
                              variant="contained"
                              loading={false}
                              disabled={!productFormik.values.productId || !productFormik.values.inventoryId}
                            >
                              {editingProductIndex !== null ? 'Update Product' : 'Add Product'}
                            </CustomButton>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </FormikProvider>

                  <Divider sx={{ my: 6 }} />

                  {/* Products List */}
                  {formik.values.products.length > 0 ? (
                    <Box>
                      <Typography variant="h6" sx={{ mb: 4 }}>Added Products</Typography>
                      {formik.values.products.map((product, index) => {
                        const productInfo = products.find(p => p.value === product.productId)
                        const quantity = Number(product.quantity) || 0
                        const price = Number(product.price) || 0
                        const discount = Number(product.discount) || 0
                        const discountType = product.discountType || 'percentage'

                        const lineTotal = quantity * price

                        // Calculate discount amount based on type
                        let discountAmount = 0
                        if (discountType === 'percentage') {
                          discountAmount = (lineTotal * discount) / 100
                        } else {
                          discountAmount = discount
                        }

                        const finalAmount = lineTotal - discountAmount

                        return (
                          <Paper key={index} sx={{ p: 4, mb: 4 }}>
                            <Grid container spacing={2} alignItems="center">
                              <Grid size={{ xs: 12, md: 4, lg: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary">Product</Typography>
                                <Typography>{productInfo?.label || 'Unknown Product'}</Typography>
                              </Grid>
                              <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Quantity</Typography>
                                <Typography>{quantity}</Typography>
                              </Grid>
                              <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Price</Typography>
                                <Typography>₨{price.toLocaleString()}</Typography>
                              </Grid>
                              <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Discount</Typography>
                                <Typography>
                                  {discount > 0 ? `${discount}${discountType === 'percentage' ? '%' : '₨'}` : 'None'}
                                </Typography>
                              </Grid>
                              <Grid size={{ xs: 6, sm: 3, md: 2, lg: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Amount</Typography>
                                <Typography fontWeight="bold">₨{finalAmount.toLocaleString()}</Typography>
                              </Grid>
                              <Grid size={{ xs: 12, md: 12, lg: 1 }}>
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                                  <IconButton size="small" onClick={() => handleEditProduct(index)}>
                                    <i className="tabler-edit text-primary" />
                                  </IconButton>
                                  <IconButton size="small" onClick={() => handleRemoveProduct(index)}>
                                    <i className="tabler-trash text-error" />
                                  </IconButton>
                                </Box>
                              </Grid>
                            </Grid>
                          </Paper>
                        )
                      })}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <Typography color="text.secondary">No products added yet</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Payment Details Card */}
              <Card>
                <CardHeader
                  title="Payment Details"
                  action={
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setIsAddingPayment(true)}
                      startIcon={<i className="tabler-plus" />}
                    >
                      Add Payment
                    </Button>
                  }
                />
                <CardContent>
                  {/* Add Payment Form */}
                  {isAddingPayment && (
                    <FormikProvider formik={paymentFormik}>
                      <Box component="form" onSubmit={paymentFormik.handleSubmit} sx={{ mb: 6, p: 4, border: 1, borderRadius: 1 }}>
                        <Typography variant="h6" sx={{ mb: 4 }}>Add Payment Method</Typography>
                        <Grid container spacing={4}>
                          <Grid size={{ xs: 12, md: 4 }}>
                            <CustomSelect
                              fullWidth
                              label="Payment Method"
                              name="method"
                              value={paymentFormik.values.method}
                              onChange={paymentFormik.handleChange}
                              onBlur={paymentFormik.handleBlur}
                              error={paymentFormik.touched.method && Boolean(paymentFormik.errors.method)}
                              helperText={paymentFormik.touched.method && paymentFormik.errors.method}
                              options={[
                                { value: 'bank', label: 'Bank Transfer' },
                                { value: 'cheque', label: 'Cheque' },
                                { value: 'card', label: 'Card Payment' },
                                { value: 'other', label: 'Other' }
                              ]}
                              placeholder="Select Method"
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 4 }}>
                            <CustomInput
                              fullWidth
                              label="Reference/Cheque Number"
                              name="reference"
                              value={paymentFormik.values.reference}
                              onChange={paymentFormik.handleChange}
                              onBlur={paymentFormik.handleBlur}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 4 }}>
                            <CustomInput
                              fullWidth
                              type="number"
                              label="Amount Paid"
                              name="amountPaid"
                              value={paymentFormik.values.amountPaid}
                              onChange={paymentFormik.handleChange}
                              onBlur={paymentFormik.handleBlur}
                              error={paymentFormik.touched.amountPaid && Boolean(paymentFormik.errors.amountPaid)}
                              helperText={paymentFormik.touched.amountPaid && paymentFormik.errors.amountPaid}
                              InputProps={{
                                startAdornment: <InputAdornment position="start">₨</InputAdornment>
                              }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <CustomButton
                                type="submit"
                                variant="contained"
                                loading={false}
                              >
                                Add Payment
                              </CustomButton>
                              <Button
                                variant="outlined"
                                onClick={() => {
                                  setIsAddingPayment(false)
                                  paymentFormik.resetForm()
                                }}
                              >
                                Cancel
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    </FormikProvider>
                  )}

                  {/* Payment Methods List */}
                  {formik.values.paymentDetails.length > 0 ? (
                    <Box>
                      <Typography variant="h6" sx={{ mb: 4 }}>Payment Methods</Typography>
                      {formik.values.paymentDetails.map((payment, index) => (
                        <Paper key={index} sx={{ p: 4, mb: 4 }}>
                          <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, md: 3 }}>
                              <Typography variant="subtitle2" color="text.secondary">Method</Typography>
                              <Chip label={payment.method} size="small" />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <Typography variant="subtitle2" color="text.secondary">Reference</Typography>
                              <Typography>{payment.reference || 'N/A'}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <Typography variant="subtitle2" color="text.secondary">Amount</Typography>
                              <Typography fontWeight="bold">₨{Number(payment.amountPaid).toLocaleString()}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-start' } }}>
                                <IconButton size="small" onClick={() => handleRemovePayment(index)}>
                                  <i className="tabler-trash text-error" />
                                </IconButton>
                              </Box>
                            </Grid>
                          </Grid>
                        </Paper>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">No payment methods added</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Right Column - Summary */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <Card sx={{ position: 'sticky', top: 6 }}>
                <CardHeader title="Invoice Summary" />
                <CardContent>
                  <Box sx={{ '& > *': { mb: 4 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Subtotal:</Typography>
                      <Typography fontWeight="bold">₨{totals.subtotal.toLocaleString()}</Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6">Grand Total:</Typography>
                      <Typography variant="h6" fontWeight="bold">₨{totals.grandTotal.toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography color="success.main">Cash Paid:</Typography>
                      <Typography color="success.main">₨{Number(formik.values.cash).toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography color="info.main">Other Payments:</Typography>
                      <Typography color="info.main">₨{(totals.totalPaid - Number(formik.values.cash)).toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography fontWeight="bold">Total Paid:</Typography>
                      <Typography fontWeight="bold">₨{totals.totalPaid.toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography
                        color={totals.remainingBalance > 0 ? "error.main" : "success.main"}
                      >
                        Remaining Balance:
                      </Typography>
                      <Typography
                        fontWeight="bold"
                        color={totals.remainingBalance > 0 ? "error.main" : "success.main"}
                      >
                        ₨{totals.remainingBalance.toLocaleString()}
                      </Typography>
                    </Box>

                    <Divider />

                    {/* Action Buttons */}
                    <Box sx={{ '& > *': { mb: 2 } }}>
                      <CustomButton
                        type="submit"
                        variant="contained"
                        fullWidth
                        loading={createSalesInvoiceMutation.isPending || updateSalesInvoiceMutation.isPending}
                        disabled={formik.values.products.length === 0}
                      >
                        {isEditMode ? 'Update Invoice' : 'Create Invoice'}
                      </CustomButton>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => router.push(getLocalizedUrl('/sales-invoice', params.lang))}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </form>
      </FormikProvider>
    </Box>
  )
}

export default AddSalesInvoicePage
