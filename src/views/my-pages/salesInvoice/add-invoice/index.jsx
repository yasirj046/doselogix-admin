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
import { deliveryLogService } from '@/services/deliveryLogService'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Validation Schemas
const productSchema = Yup.object().shape({
  productId: Yup.string().required('Product is required'),
  inventoryId: Yup.string().required('Inventory batch is required'),
  quantity: Yup.number().min(1, 'Quantity must be at least 1').required('Quantity is required'),
  bonus: Yup.number().min(0, 'Bonus must be positive'),
  totalQuantity: Yup.number().min(1, 'Total quantity must be at least 1'),
  batchNumber: Yup.string(),
  stock: Yup.number().min(0, 'Stock must be positive'),
  expiryDate: Yup.date(),
  price: Yup.number().min(0, 'Price must be positive').required('Price is required'),
  discount: Yup.number().min(0, 'Discount must be positive'),
  discountType: Yup.string().oneOf(['percentage', 'flat'], 'Invalid discount type'),
  lessToMinimumCheck: Yup.boolean(),
  returnQuantity: Yup.number().min(0, 'Return quantity must be positive'),
  returnDate: Yup.date().nullable()
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
  const [priceHistory, setPriceHistory] = useState([])
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString())
  const [isReturnMode, setIsReturnMode] = useState(false)

  // Hooks
  const queryClient = useQueryClient()
  const isEditMode = !!invoiceId

  // Get sales invoice data if editing
  const {
    data: salesInvoiceDetails,
    isLoading: isLoadingSalesInvoiceDetails,
    error: salesInvoiceDetailsError
  } = salesInvoiceService.getSalesInvoiceForEdit('get-sales-invoice-for-edit', invoiceId)

  // Get next invoice number (only for new invoices, not when editing)
  const { data: nextInvoiceNumberData, isLoading: isLoadingInvoiceNumber, refetch: refetchInvoiceNumber } = salesInvoiceService.getNextInvoiceNumber(
    'get-next-invoice-number',
    !isEditMode ? invoiceDate : null
  )



  // Create sales invoice mutation
  const createSalesInvoiceMutation = salesInvoiceService.createSalesEntry()

  // Update sales invoice mutation
  const updateSalesInvoiceMutation = salesInvoiceService.updateSalesEntry()

  // Add payment to sales invoice mutation
  const addPaymentMutation = salesInvoiceService.addPaymentToCredit()

  // Remove payment from sales invoice mutation
  const removePaymentMutation = salesInvoiceService.removePaymentFromSalesInvoice()

  // Set up mutation handlers
  useEffect(() => {
    if (createSalesInvoiceMutation.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['get-all-sales-invoices'] })
      toast.success('Sales invoice created successfully!')
      router.push(getLocalizedUrl('/sales-invoice', params.lang))
    }
    if (createSalesInvoiceMutation.isError) {
      console.error('Create sales invoice error:', createSalesInvoiceMutation.error)
      toast.error(createSalesInvoiceMutation.error?.response?.data?.message || 'Failed to create sales invoice')
    }
  }, [createSalesInvoiceMutation.isSuccess, createSalesInvoiceMutation.isError, createSalesInvoiceMutation.error, queryClient, router, params.lang])

  useEffect(() => {
    if (updateSalesInvoiceMutation.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['get-all-sales-invoices'] })
      toast.success('Sales invoice updated successfully!')
      router.push(getLocalizedUrl('/sales-invoice', params.lang))
    }
    if (updateSalesInvoiceMutation.isError) {
      console.error('Update sales invoice error:', updateSalesInvoiceMutation.error)
      toast.error(updateSalesInvoiceMutation.error?.response?.data?.message || 'Failed to update sales invoice')
    }
  }, [updateSalesInvoiceMutation.isSuccess, updateSalesInvoiceMutation.isError, updateSalesInvoiceMutation.error, queryClient, router, params.lang])

  useEffect(() => {
    if (addPaymentMutation.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['get-sales-invoice-for-edit', invoiceId] })
      toast.success('Payment added successfully!')
      paymentFormik.resetForm()
    }
    if (addPaymentMutation.isError) {
      console.error('Add payment error:', addPaymentMutation.error)
      toast.error(addPaymentMutation.error?.response?.data?.message || 'Failed to add payment')
    }
  }, [addPaymentMutation.isSuccess, addPaymentMutation.isError, addPaymentMutation.error, queryClient, invoiceId])

  useEffect(() => {
    if (removePaymentMutation.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['get-sales-invoice-for-edit', invoiceId] })
      toast.success('Payment removed successfully!')
    }
    if (removePaymentMutation.isError) {
      console.error('Remove payment error:', removePaymentMutation.error)
      toast.error(removePaymentMutation.error?.response?.data?.message || 'Failed to remove payment')
    }
  }, [removePaymentMutation.isSuccess, removePaymentMutation.isError, removePaymentMutation.error, queryClient, invoiceId])

  // Fetch lookup data using React Query
  const { data: customersData } = lookupService.getCustomersLookup('get-customers-lookup')
  const { data: employeesData } = lookupService.getEmployeesLookup('get-employees-lookup')
  const { data: productsData } = productService.getAllProducts('get-all-products')

  // Force refresh sales invoice data when edit mode is detected
  useEffect(() => {
    if (isEditMode && invoiceId) {
      // Force refetch the specific sales invoice to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['get-sales-invoice-for-edit', invoiceId] })
    }
  }, [isEditMode, invoiceId, queryClient])

  // Main formik for sales invoice
  const formik = useFormik({
    initialValues: {
      customerId: '',
      deliverBy: '',
      bookedBy: '',
      date: new Date().toISOString().split('T')[0],
      salesInvoiceNumber: '',
      licenseNumber: '',
      licenseExpiry: '',
      deliveryLogNumber: '',
      totalDiscount: 0,
      cash: 0, // Add cash field support
      products: [],
      paymentDetails: []
    },
    validationSchema: Yup.object({
      customerId: Yup.string().required('Customer is required'),
      deliverBy: Yup.string().required('Deliver by is required'),
      bookedBy: Yup.string().required('Booked by is required'),
      date: Yup.date().required('Date is required'),
      salesInvoiceNumber: Yup.string().matches(/^SINV-\d{2}-\d{4}-\d{6}$/, 'Invalid sales invoice number format'),
      totalDiscount: Yup.number().min(0, 'Total discount must be positive'),
      cash: Yup.number().min(0, 'Cash amount must be positive'),
      products: Yup.array().min(1, 'At least one product is required')
    }),
    onSubmit: values => {
      const processedValues = {
        ...values,
        totalDiscount: parseFloat(values.totalDiscount) || 0,
        cash: parseFloat(values.cash) || 0, // Include cash field
        products: values.products.map(product => {
          const productInfo = productsData?.data?.result?.find(p => p._id === product.productId)

          // Base product data
          const baseProductData = {
            productId: product.productId,
            quantity: parseInt(product.quantity),
            price: parseFloat(product.price),
            amount: parseFloat(product.price) * parseInt(product.quantity),
            inventoryId: product.inventoryId,
            productName: productInfo?.productName || product.productName || 'Unknown Product',
            bonus: product.bonus || 0,
            percentageDiscount: product.percentageDiscount || 0,
            flatDiscount: product.flatDiscount || 0,
            lessToMinimumCheck: product.lessToMinimumCheck || false,
            returnQuantity: parseInt(product.returnQuantity) || 0,
            returnDate: product.returnDate || null
          }

          return baseProductData
        })
      }

      if (isEditMode) {
        updateSalesInvoiceMutation.mutate({ id: invoiceId, salesEntryData: processedValues })
      } else {
        createSalesInvoiceMutation.mutate(processedValues)
      }
    }
  })

  // Get delivery log number preview when employee is selected
  const { data: deliveryLogNumberData, isLoading: isLoadingDeliveryLogNumber } = deliveryLogService.getDeliveryLogNumber(
    'get-delivery-log-preview-number',
    formik.values.deliverBy,
    formik.values.date
  )



  // Product formik for adding/editing products
  const productFormik = useFormik({
    initialValues: {
      productId: '',
      inventoryId: '',
      quantity: '',
      bonus: 0,
      totalQuantity: '',
      batchNumber: '',
      stock: '',
      expiryDate: '',
      price: '',
      discount: 0,
      discountType: 'percentage',
      lessToMinimumCheck: false,
      returnQuantity: 0,
      returnDate: ''
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

      // Get batch information to store with the product (reuse the same selectedInventory variable)
      const batchNumber = selectedInventory?.label || selectedInventory?.data?.batchNumber || 'N/A'

      // Create product object with batch information and convert discount
      const productWithBatch = {
        ...values,
        batchNumber: batchNumber,
        percentageDiscount: values.discountType === 'percentage' ? values.discount : 0,
        flatDiscount: values.discountType === 'flat' ? values.discount : 0
      }

      const existingProducts = formik.values.products

      if (editingProductIndex !== null) {
        // Update existing product
        const updatedProducts = [...existingProducts]
        updatedProducts[editingProductIndex] = productWithBatch
        formik.setFieldValue('products', updatedProducts)
        setEditingProductIndex(null)
      } else {
        // Add new product
        formik.setFieldValue('products', [...existingProducts, productWithBatch])
      }

      // Reset product form
      productFormik.resetForm()
      setSelectedProduct('')
    }
  })

  // Get available inventory for selected product (moved after productFormik to avoid referencing before initialization)
  const { data: inventoryData, isLoading: isLoadingInventory, error: inventoryError } = salesInvoiceService.getAvailableInventory(
    'get-available-inventory',
    productFormik.values.productId
  )

  // Get current minimum price for validation (uses productFormik and inventoryData)
  const getCurrentMinPrice = () => {
    const selectedInventory = inventoryData?.result?.find(inv => inv.value === productFormik.values.inventoryId)
    return selectedInventory?.data?.minSalePrice ? Number(selectedInventory.data.minSalePrice) : 0
  }

  // Payment formik for adding payments
  const paymentFormik = useFormik({
    initialValues: {
      date: new Date().toISOString().split('T')[0],
      amountPaid: ''
    },
    validationSchema: Yup.object({
      date: Yup.date().required('Payment date is required'),
      // Allow negative payment amounts as well (returns/refunds). Require a number.
      amountPaid: Yup.number().required('Amount is required')
    }),
    onSubmit: values => {
      if (isEditMode) {
        addPaymentMutation.mutate({ salesInvoiceId: invoiceId, paymentData: values })
      } else {
        const existingPayments = formik.values.paymentDetails
        formik.setFieldValue('paymentDetails', [...existingPayments, values])
        paymentFormik.resetForm()
      }
    }
  })


  // Get last invoice data by customer
  const { data: lastInvoiceData, isFetching: lastInvoiceLoading } = salesInvoiceService.getLastInvoiceByCustomer('get-last-invoice-by-customer', formik.values.customerId)

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

  // Get last three prices for customer-product combination
  const { data: priceHistoryData, isLoading: isLoadingPriceHistory } = salesInvoiceService.getLastThreePricesForCustomer('get-price-history', formik.values.customerId, productFormik.values.productId)

  // Auto-fill next invoice number when creating new invoice
  useEffect(() => {
    if (!isEditMode && nextInvoiceNumberData?.data?.success && nextInvoiceNumberData.data.result) {
      const invoiceNumber = nextInvoiceNumberData.data.result.salesInvoiceNumber
      formik.setFieldValue('salesInvoiceNumber', invoiceNumber)
    }
  }, [nextInvoiceNumberData, isEditMode])

  // Refetch invoice number when date changes (in create mode only)
  useEffect(() => {
    if (!isEditMode && formik.values.date) {
      const newDate = new Date(formik.values.date).toISOString()
      setInvoiceDate(newDate)
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['get-next-invoice-number'] })
    }
  }, [formik.values.date, isEditMode, queryClient])

  // Update delivery log number when employee or date changes
  useEffect(() => {
    if (isEditMode) return; // Don't auto-update in edit mode

    // Access the correct nested path: data.data.result.deliveryLogNumber
    const deliveryLogNumber = deliveryLogNumberData?.data?.result?.deliveryLogNumber

    if (deliveryLogNumber) {
      console.log('Setting delivery log number:', deliveryLogNumber)
      formik.setFieldValue('deliveryLogNumber', deliveryLogNumber)
    } else if (!formik.values.deliverBy) {
      // Clear delivery log number when employee is deselected
      formik.setFieldValue('deliveryLogNumber', '')
    }
  }, [deliveryLogNumberData, formik.values.deliverBy, isEditMode])

  // Handle customer selection and auto-fill license fields
  useEffect(() => {
    if (formik.values.customerId && customers.length > 0) {
      const customerData = customers.find(customer => customer.value === formik.values.customerId)?.data
      if (customerData) {
        setSelectedCustomerData(customerData)
      }
    } else {
      setSelectedCustomerData(null)
    }
  }, [formik.values.customerId, customers])

  // Auto-fill license fields from last invoice data or customer data
  useEffect(() => {
    // Don't auto-fill in edit mode - data is already loaded
    if (isEditMode) return;

    if (lastInvoiceData?.data?.success && lastInvoiceData.data.result) {
      const lastInvoice = lastInvoiceData.data.result
      formik.setFieldValue('licenseNumber', lastInvoice.licenseNumber || '')
      formik.setFieldValue('licenseExpiry', lastInvoice.licenseExpiry ? new Date(lastInvoice.licenseExpiry).toISOString().split('T')[0] : '')
    } else if (selectedCustomerData && !lastInvoiceLoading) {
      // If no last invoice, use customer license data
      formik.setFieldValue('licenseNumber', selectedCustomerData.customerLicenseNumber || '')
      formik.setFieldValue('licenseExpiry', selectedCustomerData.customerLicenseExpiryDate ? new Date(selectedCustomerData.customerLicenseExpiryDate).toISOString().split('T')[0] : '')
    } else if (formik.values.customerId && !lastInvoiceLoading) {
      // Clear if no customer selected or no data available
      formik.setFieldValue('licenseNumber', '')
      formik.setFieldValue('licenseExpiry', '')
    }
  }, [lastInvoiceData, formik.values.customerId, selectedCustomerData, lastInvoiceLoading, isEditMode])

  // Load sales invoice data if editing
  useEffect(() => {
    if (isEditMode && salesInvoiceDetails?.data?.success && salesInvoiceDetails.data.result) {
      const invoiceData = salesInvoiceDetails.data.result

      // Format products data with proper date formatting and handle populated references
      const formattedProducts = (invoiceData.products || []).map(product => ({
        ...product,
        // Handle populated productId reference
        productId: product.productId?._id || product.productId || '',
        // Handle populated inventoryId reference
        inventoryId: product.inventoryId?._id || product.inventoryId || '',
        // Format expiry date if it exists
        expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : '',
        // Include return fields
        returnQuantity: product.returnQuantity || 0,
        returnDate: product.returnDate ? new Date(product.returnDate).toISOString().split('T')[0] : ''
      }))

      formik.setValues({
        // Handle populated customerId reference
        customerId: invoiceData.customerId?._id || invoiceData.customerId || '',
        // Handle populated deliverBy reference
        deliverBy: invoiceData.deliverBy?._id || invoiceData.deliverBy || '',
        // Handle populated bookedBy reference
        bookedBy: invoiceData.bookedBy?._id || invoiceData.bookedBy || '',
        date: invoiceData.date ? invoiceData.date.split('T')[0] : new Date().toISOString().split('T')[0],
        salesInvoiceNumber: invoiceData.salesInvoiceNumber || '',
        licenseNumber: invoiceData.licenseNumber || '',
        licenseExpiry: invoiceData.licenseExpiry ? invoiceData.licenseExpiry.split('T')[0] : '',
        deliveryLogNumber: invoiceData.deliveryLogNumber || '',
        totalDiscount: invoiceData.totalDiscount || 0,
        cash: invoiceData.cash || 0, // Add cash field support
        products: formattedProducts,
        paymentDetails: invoiceData.paymentDetails || []
      })

      // selectedCustomer state is no longer needed as we use formik.values.customerId directly

      // Set customer data for display if available
      if (invoiceData.customerId && typeof invoiceData.customerId === 'object') {
        setSelectedCustomerData(invoiceData.customerId)
      }

      // Check if any products have returns and set isReturnMode accordingly
      const hasReturns = formattedProducts.some(product => product.returnQuantity > 0)
      setIsReturnMode(hasReturns)
    }
  }, [salesInvoiceDetails, isEditMode])



  // Calculate total quantity when quantity or bonus changes
  useEffect(() => {
    const quantity = Number(productFormik.values.quantity) || 0
    const bonus = Number(productFormik.values.bonus) || 0
    const calculatedTotal = quantity + bonus

    if (calculatedTotal !== Number(productFormik.values.totalQuantity)) {
      productFormik.setFieldValue('totalQuantity', calculatedTotal)
    }
  }, [productFormik.values.quantity, productFormik.values.bonus])

  // Handle product selection changes - reset form when product is unselected
  useEffect(() => {
    if (!productFormik.values.productId) {
      // Reset all product-related fields when no product is selected
      productFormik.setFieldValue('inventoryId', '')
      productFormik.setFieldValue('stock', '')
      productFormik.setFieldValue('expiryDate', '')
      productFormik.setFieldValue('price', '')
      productFormik.setFieldValue('quantity', '')
      productFormik.setFieldValue('bonus', 0)
      productFormik.setFieldValue('totalQuantity', '')
      productFormik.setFieldValue('batchNumber', '')
      productFormik.setFieldValue('discount', 0)
      productFormik.setFieldValue('discountType', 'percentage')
      productFormik.setFieldValue('lessToMinimumCheck', false)
      productFormik.setFieldValue('returnQuantity', 0)
      productFormik.setFieldValue('returnDate', '')
      // Also clear price history when no product is selected
      setPriceHistory([])
    }
  }, [productFormik.values.productId])

  // Clear price history when customer changes
  useEffect(() => {
    if (!formik.values.customerId) {
      setPriceHistory([])
    }
  }, [formik.values.customerId])



  // Handle inventory data when it's loaded
  useEffect(() => {
    if (productFormik.values.productId && inventoryData?.success && inventoryData?.result && editingProductIndex === null) {
      const transformedInventory = inventoryData.result

      // Auto-select first batch (FEFO - First Expiry First Out) when inventory is loaded (only for new products)
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
  }, [inventoryData, productFormik.values.productId, editingProductIndex])

  // Handle inventory selection
  useEffect(() => {
    if (productFormik.values.inventoryId && inventoryData?.result?.length > 0) {
      const selectedInventory = inventoryData.result.find(inv => inv.value === productFormik.values.inventoryId)

      if (selectedInventory) {
        const inventoryItem = selectedInventory.data

        // Always set stock and expiry from selected inventory (non-changeable fields)
        productFormik.setFieldValue('stock', inventoryItem.currentQuantity || 0)
        productFormik.setFieldValue('expiryDate', inventoryItem.expiryDate ? new Date(inventoryItem.expiryDate).toISOString().split('T')[0] : '')

        // Only auto-populate price from inventory for new products (not when editing)
        if (editingProductIndex === null) {
          const priceToSet = inventoryItem.salePrice || inventoryItem.price || 0
          productFormik.setFieldValue('price', priceToSet)
        }
      }
    }
  }, [productFormik.values.inventoryId, inventoryData, editingProductIndex])

  // Update price history when data changes
  useEffect(() => {
    if (priceHistoryData?.data?.success) {
      setPriceHistory(priceHistoryData.data.result || [])
    } else {
      setPriceHistory([])
    }
  }, [priceHistoryData])

  // Calculate totals
  const calculateTotals = () => {
    const products = formik.values.products
    const subtotal = products.reduce((sum, product) => {
      const quantity = Number(product.quantity) || 0 // Ordered quantity only
      const price = Number(product.price) || 0
      const discount = Number(product.discount) || 0
      const discountType = product.discountType || 'percentage'

      // Note: totalQuantity (quantity + bonus) is used for inventory deduction on backend
      // But billing amount is calculated only on ordered quantity (not bonus)
      const total = quantity * price

      // Calculate discount amount based on type
      let discountAmount = 0
      if (discountType === 'percentage') {
        discountAmount = (total * discount) / 100
      } else {
        discountAmount = discount
      }

      return sum + (total - discountAmount)
    }, 0)

    const totalDiscount = Number(formik.values.totalDiscount) || 0
    const cash = Number(formik.values.cash) || 0
    const paymentsTotal = (formik.values.paymentDetails || []).reduce((sum, payment) => sum + (Number(payment.amountPaid) || 0), 0)
    const totalPaid = cash + paymentsTotal
    const grandTotal = Math.max(0, subtotal - totalDiscount)
    const remainingBalance = Math.max(0, grandTotal - totalPaid)

    return {
      subtotal,
      totalDiscount,
      grandTotal,
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
    if (isEditMode) {
      removePaymentMutation.mutate({ salesInvoiceId: invoiceId, paymentIndex: index })
    } else {
      const updatedPayments = formik.values.paymentDetails.filter((_, i) => i !== index)
      formik.setFieldValue('paymentDetails', updatedPayments)
    }
  }

  // Handle return quantity change
  const handleReturnQtyChange = (index, value) => {
    const updatedProducts = [...formik.values.products]
    const product = updatedProducts[index]
    const maxReturnQty = Number(product.quantity) || 0
    const returnQuantity = Math.min(Math.max(0, Number(value) || 0), maxReturnQty)

    updatedProducts[index] = {
      ...product,
      returnQuantity: returnQuantity
    }
    formik.setFieldValue('products', updatedProducts)
  }

  // Handle return date change
  const handleReturnDateChange = (index, value) => {
    const updatedProducts = [...formik.values.products]
    updatedProducts[index] = {
      ...updatedProducts[index],
      returnDate: value
    }
    formik.setFieldValue('products', updatedProducts)
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
            {/* Main Form */}
            <Grid size={{ xs: 12 }}>
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
                        onChange={formik.handleChange}
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
                        label="Sales Invoice Number"
                        name="salesInvoiceNumber"
                        value={formik.values.salesInvoiceNumber}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.salesInvoiceNumber && Boolean(formik.errors.salesInvoiceNumber)}
                        helperText={formik.touched.salesInvoiceNumber && formik.errors.salesInvoiceNumber}
                        placeholder={isLoadingInvoiceNumber ? "Generating..." : "Auto-generated or enter custom"}
                        disabled={!isEditMode && isLoadingInvoiceNumber}
                        InputProps={{
                          endAdornment: !isEditMode && isLoadingInvoiceNumber && (
                            <InputAdornment position="end">
                              <CircularProgress size={20} />
                            </InputAdornment>
                          )
                        }}
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
                        placeholder="Select employee to generate"
                        disabled
                        InputProps={{
                          endAdornment: isLoadingDeliveryLogNumber && (
                            <InputAdornment position="end">
                              <CircularProgress size={20} />
                            </InputAdornment>
                          )
                        }}
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
                    {/* License Information Fields */}
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                      <Box className="p-3 border rounded-lg">
                        <Typography variant="body2" className="text-gray-600 mb-1">
                          License Number
                        </Typography>
                        <Typography variant="body1" className="font-medium">
                          {lastInvoiceLoading ? (
                            'Loading...'
                          ) : formik.values.licenseNumber ? (
                            formik.values.licenseNumber
                          ) : (
                            'No Record'
                          )}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                      <Box className="p-3 border rounded-lg">
                        <Typography variant="body2" className="text-gray-600 mb-1">
                          License Expiry Date
                        </Typography>
                        <Typography variant="body1" className="font-medium">
                          {lastInvoiceLoading ? (
                            'Loading...'
                          ) : formik.values.licenseExpiry ? (
                            new Date(formik.values.licenseExpiry).toLocaleDateString()
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
                            onChange={productFormik.handleChange}
                            onBlur={productFormik.handleBlur}
                            error={productFormik.touched.productId && Boolean(productFormik.errors.productId)}
                            helperText={productFormik.touched.productId && productFormik.errors.productId}
                            options={filteredProducts}
                            placeholder="Select Product"
                            autoComplete={true}
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
                            label="Total Quantity"
                            name="totalQuantity"
                            value={productFormik.values.totalQuantity}
                            onChange={productFormik.handleChange}
                            onBlur={productFormik.handleBlur}
                            error={productFormik.touched.totalQuantity && Boolean(productFormik.errors.totalQuantity)}
                            helperText={productFormik.touched.totalQuantity && productFormik.errors.totalQuantity}
                            disabled={true}
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
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1.6 }}>
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
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
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
                        <Grid size={{ xs: 12, md: 8, lg:6 }}>
                          <Box className="p-3 border rounded-lg">
                            <Typography variant="body2" className="text-gray-600 mb-1">
                              Last 3 Prices to this Customer
                            </Typography>
                            <Typography variant="body1" className="font-medium">
                              {!formik.values.customerId ? (
                                'Select customer first'
                              ) : !productFormik.values.productId ? (
                                'Select product'
                              ) : isLoadingPriceHistory ? (
                                'Loading price history...'
                              ) : priceHistory.length > 0 ? (
                                <div className="flex gap-2 flex-wrap">
                                  {priceHistory.map((price, index) => (
                                    <div key={index} className="text-sm flex justify-between items-center bg-white p-2 rounded border gap-2">
                                      <span className="font-semibold text-green-600">₨{price.price?.toLocaleString()}</span>
                                      {/* <Chip
                                        label={price.batchNumber || 'N/A'}
                                        size="small"
                                        variant="outlined"
                                        color="primary"
                                      /> */}
                                      <span className="text-gray-500 text-xs">
                                        {price.date ? new Date(price.date).toLocaleDateString() : 'N/A'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                'No previous sales to this customer'
                              )}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
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
                                  ? `Allow below min ₨${getCurrentMinPrice()}`
                                  : "Allow below min price"
                              }
                            />
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
                            <Button
                              type="button"
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
                              type="button"
                              variant="contained"
                              loading={false}
                              disabled={!productFormik.values.productId || !productFormik.values.inventoryId}
                              onClick={(e) => {
                                e.preventDefault()
                                productFormik.handleSubmit()
                              }}
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
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6">Added Products</Typography>
                        {isEditMode && (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={isReturnMode}
                                onChange={(e) => setIsReturnMode(e.target.checked)}
                                color="warning"
                              />
                            }
                            label={
                              <Typography variant="body2" fontWeight="medium" color="warning.main">
                                Check Return Products
                              </Typography>
                            }
                          />
                        )}
                      </Box>

                      {/* Products Table */}
                      <Box sx={{ overflowX: 'auto' }}>
                        <table className='w-full border-collapse'>
                          <thead className='sticky top-0 shadow-sm'>
                            <tr>
                              <th className='p-3 text-left border-b font-semibold'>Product Name</th>
                              <th className='p-3 text-left border-b font-semibold'>Batch No.</th>
                              <th className='p-3 text-center border-b font-semibold'>Qty</th>
                              <th className='p-3 text-center border-b font-semibold'>Bonus</th>
                              <th className='p-3 text-center border-b font-semibold'>Total Qty</th>
                              <th className='p-3 text-center border-b font-semibold'>Unit Price</th>
                              <th className='p-3 text-center border-b font-semibold'>Discount</th>
                              <th className='p-6 text-center border-b font-semibold'>Total</th>
                              {isEditMode && (
                                <>
                                  <th className='p-3 text-center border-b font-semibold' style={{ color: '#ed6c02' }}>Return Qty</th>
                                  <th className='p-3 text-center border-b font-semibold' style={{ color: '#ed6c02' }}>Return Date</th>
                                </>
                              )}
                              <th className='p-3 text-center border-b font-semibold'>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formik.values.products.map((product, index) => {
                              const productInfo = products.find(p => p.value === product.productId)
                              const quantity = Number(product.quantity) || 0
                              const bonus = Number(product.bonus) || 0
                              const totalQuantity = Number(product.totalQuantity) || 0
                              const price = Number(product.price) || 0
                              const discount = Number(product.discount) || 0
                              const discountType = product.discountType || 'percentage'

                              // Get batch number from stored product data
                              const batchNumber = product.batchNumber || 'N/A'

                              // Discount is applied only to ordered quantity (not bonus)
                              // But inventory deduction should use totalQuantity (quantity + bonus)
                              const total = quantity * price

                              // Calculate discount amount based on type
                              let discountAmount = 0
                              if (discountType === 'percentage') {
                                discountAmount = (total * discount) / 100
                              } else {
                                discountAmount = discount
                              }

                              const finalAmount = total - discountAmount

                              return (
                                <tr key={index} className='hover:'>
                                  <td className='p-3 border-b font-medium'>
                                    {productInfo?.label || 'Unknown Product'}
                                  </td>
                                  <td className='p-3 border-b'>
                                    <Chip
                                      label={batchNumber}
                                      size="small"
                                      variant="outlined"
                                      color="primary"
                                    />
                                  </td>
                                  <td className='p-3 text-center border-b'>
                                    {product.returnQuantity > 0 ? (
                                      <span>
                                        {quantity - (product.returnQuantity || 0)}
                                        <span className='text-xs text-gray-500 ml-1'>
                                          ({quantity} - {product.returnQuantity})
                                        </span>
                                      </span>
                                    ) : (
                                      quantity
                                    )}
                                  </td>
                                  <td className='p-3 text-center border-b text-green-600'>
                                    {bonus}
                                  </td>
                                  <td className='p-3 text-center border-b font-bold text-blue-600'>
                                    {totalQuantity}
                                  </td>
                                  <td className='p-6 text-center border-b'>
                                    ₨{price.toLocaleString()}
                                  </td>
                                  <td className='p-6 text-center border-b text-orange-600'>
                                    {discount > 0 ? `${discount}${discountType === 'percentage' ? '%' : '₨'}` : '-'}
                                  </td>
                                  <td className='p-6 text-center border-b font-bold'>
                                    ₨{finalAmount.toLocaleString()}
                                  </td>
                                  {isEditMode && (
                                    <>
                                      <td className='p-3 text-center border-b'>
                                        <TextField
                                          type="number"
                                          size="small"
                                          inputProps={{
                                            min: 0,
                                            max: quantity,
                                            style: { textAlign: 'center' }
                                          }}
                                          value={product.returnQuantity || 0}
                                          onChange={(e) => handleReturnQtyChange(index, e.target.value)}
                                          disabled={!isReturnMode}
                                          sx={{ width: '100px' }}
                                        />
                                      </td>
                                      <td className='p-3 text-center border-b'>
                                        <TextField
                                          type="date"
                                          size="small"
                                          value={product.returnDate || ''}
                                          onChange={(e) => handleReturnDateChange(index, e.target.value)}
                                          disabled={!isReturnMode}
                                          sx={{ width: '150px' }}
                                          InputLabelProps={{
                                            shrink: true,
                                          }}
                                        />
                                      </td>
                                    </>
                                  )}
                                  <td className='p-3 text-center border-b'>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleEditProduct(index)}
                                      sx={{ color: 'primary.main', mr: 1 }}
                                    >
                                      <i className="tabler-edit" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleRemoveProduct(index)}
                                      sx={{ color: 'error.main' }}
                                    >
                                      <i className="tabler-trash" />
                                    </IconButton>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <Typography color="text.secondary">No products added yet</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Financial Details Card */}
              <Card sx={{ mb: 6 }}>
                <CardHeader title="Financial Details" />
                <CardContent>
                  <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 8 }}>
                      <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <CustomInput
                            name='totalDiscount'
                            label='Total Discount'
                            type='number'
                            placeholder='0'
                          />
                        </Grid>

                        {/* <Grid size={{ xs: 12, md: 6 }}>
                          <CustomInput
                            name='cash'
                            label='Cash Paid'
                            type='number'
                            placeholder='0'
                          />
                        </Grid> */}

                        {/* Payment Fields - Always show */}
                        <Grid size={{ xs: 12 }}>
                          <Typography variant='h6' className='mb-0 mt-1' color='primary'>
                            Payment Records
                          </Typography>
                        </Grid>

                        <FormikProvider formik={paymentFormik}>
                          <Grid size={{ xs: 12, md: 4 }}>
                            <CustomInput
                              name='date'
                              label='Payment Date'
                              type='date'
                              requiredField
                            />
                          </Grid>

                          <Grid size={{ xs: 12, md: 4 }}>
                            <CustomInput
                              name='amountPaid'
                              label='Payment Amount'
                              type='number'
                              placeholder='0'
                              requiredField
                            />
                          </Grid>

                          <Grid size={{ xs: 12, md: 4 }} className="flex items-end">
                            <Button
                              variant='contained'
                              color='primary'
                              onClick={() => paymentFormik.handleSubmit()}
                              // Enable negative amounts (returns). Disable only when amount is empty/invalid or mutation is pending.
                              disabled={(
                                paymentFormik.values.amountPaid === '' ||
                                paymentFormik.values.amountPaid === null ||
                                isNaN(Number(paymentFormik.values.amountPaid))
                              ) || addPaymentMutation.isPending}
                              className='mb-0 w-full'
                              size='medium'
                              startIcon={<i className='tabler-plus' />}
                            >
                              {addPaymentMutation.isPending ? 'Adding Payment...' : 'Add Payment'}
                            </Button>
                          </Grid>
                        </FormikProvider>

                        {/* Payment Records Section */}
                        {(formik.values.paymentDetails && formik.values.paymentDetails.length > 0) && (
                          <Grid size={{ xs: 12 }}>
                            <Box className='mt-2 p-4 rounded-lg border'>
                              <Typography variant='subtitle2' className='mb-3 font-medium text-gray-700' color='primary'>
                                Payment History
                              </Typography>
                              <div className='space-y-3 max-h-56 overflow-y-auto'>
                                {(formik.values.paymentDetails || []).map((payment, index) => (
                                  <div key={index} className='flex justify-between items-center p-3 rounded-md shadow-sm border border-gray-200'>
                                    <div className='flex items-center gap-6'>
                                      <div className='flex items-center gap-2'>
                                        <i className='tabler-calendar text-gray-500 text-sm' />
                                        <Typography variant='body2' className='text-gray-600'
                                        color='primary'>
                                          {payment?.date ? new Date(payment.date).toLocaleDateString() : 'N/A'}
                                        </Typography>
                                      </div>
                                      <div className='flex items-center gap-2'>
                                        <i className='text-green-600 text-sm' />
                                        <Typography variant='body2' className='font-semibold text-green-700'>₨
                                          {(payment?.amountPaid || 0).toLocaleString()}
                                        </Typography>
                                      </div>
                                    </div>
                                    <IconButton
                                      size='small'
                                      color='error'
                                      onClick={() => handleRemovePayment(index)}
                                      disabled={removePaymentMutation.isPending}
                                      className='hover:bg-red-50'
                                    >
                                      <i className='tabler-trash text-base' />
                                    </IconButton>
                                  </div>
                                ))}
                              </div>
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <Card variant='outlined' className='h-full'>
                        <CardContent>
                          <Typography variant='h6' className='mb-4'>Summary</Typography>

                          <div className='space-y-3'>
                            <div className='flex justify-between items-center'>
                              <Typography variant='body2'>Products:</Typography>
                              <Chip
                                label={formik.values.products.length}
                                size='small'
                                color={formik.values.products.length > 0 ? 'primary' : 'default'}
                              />
                            </div>

                            <Divider />

                            <div className='flex justify-between items-center'>
                              <Typography>Gross Total:</Typography>
                              <Typography className='font-medium'>₨{totals.subtotal.toLocaleString()}</Typography>
                            </div>

                            <div className='flex justify-between items-center text-sm text-gray-600'>
                              <Typography>- Total Discount:</Typography>
                              <Typography>₨{totals.totalDiscount.toLocaleString()}</Typography>
                            </div>

                            <Divider />

                            <div className='flex justify-between items-center'>
                              <Typography className='font-medium'>Grand Total:</Typography>
                              <Typography className='font-semibold text-primary'>₨{totals.grandTotal.toLocaleString()}</Typography>
                            </div>

            {(formik.values.cash > 0) && (
              <div className='flex justify-between items-center'>
                <Typography>Cash Paid:</Typography>
                <Typography>₨{(formik.values.cash || 0).toLocaleString()}</Typography>
              </div>
            )}

            {formik.values.paymentDetails && formik.values.paymentDetails.length > 0 && (
              <div className='flex justify-between items-center'>
                <Typography>Additional Payments:</Typography>
                <Typography>₨{(formik.values.paymentDetails || []).reduce((sum, payment) => sum + (payment.amountPaid || 0), 0).toLocaleString()}</Typography>
              </div>
            )}

            <div className='flex justify-between items-center'>
              <Typography className='font-medium'>Total Paid:</Typography>
              <Typography className='font-semibold text-success'>
                ₨{totals.totalPaid.toLocaleString()}
              </Typography>
            </div>
                              <Divider />

                            <div className='flex justify-between items-center'>
                              <Typography>Credit Amount:</Typography>
                              <Typography className={`font-medium ${totals.grandTotal - totals.totalPaid > 0 ? 'text-warning' : 'text-success'}`}>
                                ₨{(totals.grandTotal - totals.totalPaid).toLocaleString()}
                              </Typography>
                            </div>
                          </div>

                          <Divider sx={{ my: 4 }} />

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
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
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
