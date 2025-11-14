'use client'

// React Imports
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

// MUI Imports
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import * as Yup from 'yup'
import { useFormik } from 'formik'
import { toast } from 'react-toastify'
import { useQueryClient } from '@tanstack/react-query'

// Component Imports
import FormikProvider from '@/contexts/formikContext'
import CustomInput from '@/components/custom-components/CustomInput'
import CustomSelect from '@/components/custom-components/CustomSelect'
import CustomButton from '@/components/custom-components/CustomButton'

// Service Imports
import { brandService } from '@/services/brandService'
import { productService } from '@/services/productService'
import { purchaseInvoiceService } from '@/services/purchaseInvoiceService'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

const AddPurchaseInvoicePage = () => {
  const router = useRouter()
  const params = useParams()
  const invoiceId = params?.invoiceId

  // States
  const [brands, setBrands] = useState([])
  const [products, setProducts] = useState([])
  const [selectedBrand, setSelectedBrand] = useState('')
  const [filteredProducts, setFilteredProducts] = useState([])
  const [editingProductIndex, setEditingProductIndex] = useState(null)
  const [priceCalculation, setPriceCalculation] = useState()
  const [isReturnMode, setIsReturnMode] = useState(false)

  const queryClient = useQueryClient()
  const isEditMode = !!invoiceId

  // API calls - Keep existing optimization
  const { data: fetchedOnePurchaseEntryData, isLoading: isLoadingPurchaseEntry } = purchaseInvoiceService.getOnePurchaseEntryDetails('get-one-purchase-entry', invoiceId)
  const { data: brandsData, isFetching: brandsLoading } = brandService.getAllBrands('get-all-brands')
  const { data: productsData, isFetching: productsLoading } = productService.getProductsByBrand('get-products-by-brand', selectedBrand)
  const { data: lastInvoiceData, isFetching: lastInvoiceLoading } = purchaseInvoiceService.getLastInvoiceByBrand('get-last-invoice-by-brand', selectedBrand)

  // Mutations
  const createPurchaseEntry = purchaseInvoiceService.createPurchaseEntry()
  const updatePurchaseEntry = purchaseInvoiceService.updatePurchaseEntry()
  const addPaymentToCredit = purchaseInvoiceService.addPaymentToCredit()
  const removePaymentFromCredit = purchaseInvoiceService.removePaymentFromCredit()

  // Set up mutation handlers
  useEffect(() => {
    if (createPurchaseEntry.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['get-all-purchase-entries'] })
      toast.success('Purchase entry created successfully!')
      router.push(getLocalizedUrl('/purchaseInvoice', params.lang))
    }
    if (createPurchaseEntry.isError) {
      console.error('Create purchase entry error:', createPurchaseEntry.error)
      toast.error(createPurchaseEntry.error?.response?.data?.message || 'Failed to create purchase entry')
    }
  }, [createPurchaseEntry.isSuccess, createPurchaseEntry.isError, createPurchaseEntry.error, queryClient, router, params.lang])

  useEffect(() => {
    if (updatePurchaseEntry.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['get-all-purchase-entries'] })
      toast.success('Purchase entry updated successfully!')
      router.push(getLocalizedUrl('/purchaseInvoice', params.lang))
    }
    if (updatePurchaseEntry.isError) {
      console.error('Update purchase entry error:', updatePurchaseEntry.error)
      toast.error(updatePurchaseEntry.error?.response?.data?.message || 'Failed to update purchase entry')
    }
  }, [updatePurchaseEntry.isSuccess, updatePurchaseEntry.isError, updatePurchaseEntry.error, queryClient, router, params.lang])

  // Validation Schema
  const productValidationSchema = Yup.object().shape({
    productId: Yup.string().required('Product is required'),
    batchNumber: Yup.string().required('Batch number is required').trim(),
    expiryDate: Yup.date().required('Expiry date is required'),
    cartons: Yup.number().min(0, 'Cartons must be positive').required('Cartons is required'),
    pieces: Yup.number().min(0, 'Pieces must be positive').required('Pieces is required'),
    bonus: Yup.number().min(0, 'Bonus must be positive'),
    netPrice: Yup.number().min(0, 'Net price must be positive').required('Net price is required'),
    discount: Yup.number().min(0, 'Discount must be positive'),
    discountType: Yup.string().oneOf(['percentage', 'flat'], 'Invalid discount type'),
    salePrice: Yup.number().min(0, 'Sale price must be positive').required('Sale price is required'),
    minSalePrice: Yup.number().min(0, 'Min sale price must be positive').required('Min sale price is required'),
    retailPrice: Yup.number().min(0, 'Retail price must be positive').required('Retail price is required'),
    invoicePrice: Yup.number().min(0, 'Invoice price must be positive').required('Invoice price is required'),
    returnQuantity: Yup.number().min(0, 'Return quantity must be positive'),
    returnDate: Yup.date().nullable()
  })

  // Main purchase entry formik
  const formik = useFormik({
    initialValues: {
      brandId: '',
      invoiceNumber: '',
      invoiceDate: '',
      date: new Date().toISOString().split('T')[0],
      grossTotal: 0,
      freight: 0,
      flatDiscount: 0,
      specialDiscount: 0,
      grandTotal: 0,
      creditAmount: 0,
      remarks: '',
      paymentDetails: [],
      newPaymentDate: new Date().toISOString().split('T')[0],
      newPaymentAmount: 0,
      products: []
    },
    validationSchema: Yup.object().shape({
      brandId: Yup.string().required('Brand is required'),
      invoiceNumber: Yup.string().required('Invoice number is required').trim(),
      invoiceDate: Yup.date().required('Invoice date is required'),
      date: Yup.date().required('Purchase date is required'),
      grossTotal: Yup.number().min(0, 'Gross total must be positive'),
      freight: Yup.number().min(0, 'Freight must be positive'),
      flatDiscount: Yup.number().min(0, 'Flat discount must be positive'),
      specialDiscount: Yup.number().min(0, 'Special discount must be positive'),
      grandTotal: Yup.number().min(0, 'Grand total must be positive'),
      creditAmount: Yup.number().min(-999999, 'Credit amount cannot be less than -999,999'),
      remarks: Yup.string().trim(),
      newPaymentDate: Yup.date(),
      newPaymentAmount: Yup.number().min(0, 'Payment amount must be positive'),
      products: Yup.array().of(
        Yup.object().shape({
          productId: Yup.string().required('Product is required'),
          batchNumber: Yup.string().required('Batch number is required').trim(),
          expiryDate: Yup.date().required('Expiry date is required'),
          cartons: Yup.number().min(0, 'Cartons must be positive').required('Cartons is required'),
          pieces: Yup.number().min(0, 'Pieces must be positive').required('Pieces is required'),
          bonus: Yup.number().min(0, 'Bonus must be positive'),
          netPrice: Yup.number().min(0, 'Net price must be positive').required('Net price is required'),
          discount: Yup.number().min(0, 'Discount must be positive'),
          discountType: Yup.string().oneOf(['percentage', 'flat'], 'Invalid discount type'),
          salePrice: Yup.number().min(0, 'Sale price must be positive').required('Sale price is required'),
          minSalePrice: Yup.number().min(0, 'Min sale price must be positive').required('Min sale price is required'),
          retailPrice: Yup.number().min(0, 'Retail price must be positive').required('Retail price is required'),
          invoicePrice: Yup.number().min(0, 'Invoice price must be positive').required('Invoice price is required'),
          returnQuantity: Yup.number().min(0, 'Return quantity must be positive'),
          returnDate: Yup.date().nullable()
        })
      ).min(1, 'At least one product is required')
    }),
    onSubmit: async (values) => {
      try {
        const calculatedProducts = values.products.map(product => {
          const selectedProduct = filteredProducts.find(p => p._id === product.productId)
          const cartonSize = selectedProduct?.cartonSize || 0
          const quantity = ((parseFloat(product.cartons) || 0) * parseFloat(cartonSize)) + (parseFloat(product.pieces) || 0)
          const returnQuantity = parseFloat(product.returnQuantity) || 0
          const effectiveQuantity = quantity - returnQuantity
          const grossAmount = effectiveQuantity * (parseFloat(product.netPrice) || 0)

          let discountAmount = 0
          if (product.discountType === 'percentage') {
            discountAmount = grossAmount * ((parseFloat(product.discount) || 0) / 100)
          } else {
            discountAmount = parseFloat(product.discount) || 0
          }

          const totalAmount = grossAmount - discountAmount
          const totalAvailablePieces = effectiveQuantity + (parseFloat(product.bonus) || 0)
          const effectiveCostPerPiece = totalAvailablePieces > 0 ? totalAmount / totalAvailablePieces : 0

          return {
            ...product,
            quantity,
            totalAmount,
            effectiveCostPerPiece,
            returnQuantity: returnQuantity || 0,
            returnDate: product.returnDate || null
          }
        })

        const calculatedValues = {
          ...values,
          products: calculatedProducts,
          grandTotal: Math.round(values.grossTotal + values.freight - values.flatDiscount - values.specialDiscount),
          creditAmount: Math.round(((values.paymentDetails || []).reduce((sum, payment) => sum + (payment.amountPaid || 0), 0)) -
                       (values.grossTotal + values.freight - values.flatDiscount - values.specialDiscount))
        }

        if (isEditMode) {
          updatePurchaseEntry.mutate({ id: invoiceId, purchaseData: calculatedValues })
        } else {
          createPurchaseEntry.mutate(calculatedValues)
        }
      } catch (err) {
        console.error('Form submission error:', err)
        toast.error('Failed to process the form. Please check all fields.')
      }
    }
  })

  // Product form formik
  const productFormik = useFormik({
    initialValues: {
      productId: '',
      batchNumber: '',
      expiryDate: '',
      cartons: 0,
      pieces: 0,
      bonus: 0,
      netPrice: 0,
      discount: 0,
      discountType: 'percentage',
      salePrice: 0,
      minSalePrice: 0,
      retailPrice: 0,
      invoicePrice: 0,
      cartonSize: 0,
      packingSize: 0,
      returnQuantity: 0,
      returnDate: ''
    },
    validationSchema: productValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        if (!formik.values.brandId) {
          toast.error('Please select a brand first')
          return
        }

        if (!values.productId) {
          toast.error('Please select a product')
          return
        }

        const existingProductIndex = formik.values.products.findIndex(
          (product, index) =>
            product.productId === values.productId &&
            product.batchNumber === values.batchNumber &&
            index !== editingProductIndex
        )

        if (existingProductIndex !== -1) {
          toast.error('Product with this batch number already exists')
          return
        }

        const products = [...formik.values.products]

        if (editingProductIndex !== null) {
          products[editingProductIndex] = { ...values }
          toast.success('Product updated successfully')
        } else {
          products.push({ ...values })
          toast.success('Product added successfully')
        }

        formik.setFieldValue('products', products)
        calculateTotals(products)

        resetForm()
        setEditingProductIndex(null)
      } catch (error) {
        console.error('Product form submission error:', error)
        toast.error('Failed to add/update product')
      }
    }
  })

  // Payment handling functions
  const handleAddPayment = () => {
    if (!formik.values.newPaymentAmount || formik.values.newPaymentAmount <= 0) {
      toast.error('Please enter a valid payment amount')
      return
    }

    if (!formik.values.newPaymentDate) {
      toast.error('Please select a payment date')
      return
    }

    const paymentData = {
      date: formik.values.newPaymentDate,
      amountPaid: formik.values.newPaymentAmount
    }

    const updatedPaymentDetails = [...formik.values.paymentDetails, paymentData]
    formik.setFieldValue('paymentDetails', updatedPaymentDetails)

    formik.setFieldValue('newPaymentAmount', 0)
    formik.setFieldValue('newPaymentDate', new Date().toISOString().split('T')[0])

    toast.success('Payment added successfully')
  }

  const handleRemovePayment = (index) => {
    const updatedPaymentDetails = formik.values.paymentDetails.filter((_, i) => i !== index)
    formik.setFieldValue('paymentDetails', updatedPaymentDetails)
    toast.success('Payment removed successfully')
  }

  // Handler for editing product
  const handleEditProduct = (index) => {
    const product = formik.values.products[index]
    const selectedProduct = filteredProducts.find(p => p._id === product.productId)

    let formattedExpiryDate = ''
    if (product.expiryDate) {
      const expiryDate = new Date(product.expiryDate)
      if (!isNaN(expiryDate.getTime())) {
        formattedExpiryDate = expiryDate.toISOString().split('T')[0]
      }
    }

    productFormik.setValues({
      ...product,
      expiryDate: formattedExpiryDate,
      cartonSize: selectedProduct?.cartonSize || 0,
      packingSize: selectedProduct?.packingSize || 0
    })

    setEditingProductIndex(index)
  }

  // Handler for canceling product edit
  const handleCancelProductEdit = () => {
    productFormik.resetForm()
    setEditingProductIndex(null)
  }

  // Function to remove product
  const removeProduct = (index) => {
    const products = formik.values.products.filter((_, i) => i !== index)
    formik.setFieldValue('products', products)
    calculateTotals(products)
  }

  // Function to calculate totals
  const calculateTotals = (products = formik.values.products) => {
    let grossTotal = 0

    products.forEach(product => {
      const selectedProduct = filteredProducts.find(p => p._id === product.productId)
      const cartonSize = parseFloat(product.cartonSize) || parseFloat(selectedProduct?.cartonSize) || 0
      const totalPieces = ((parseFloat(product.cartons) || 0) * cartonSize) + (parseFloat(product.pieces) || 0)
      const effectivePieces = totalPieces - (parseFloat(product.returnQuantity) || 0)
      const grossAmount = effectivePieces * (parseFloat(product.netPrice) || 0)
      let discountAmount = 0

      if (product.discountType === 'percentage') {
        discountAmount = grossAmount * ((parseFloat(product.discount) || 0) / 100)
      } else {
        discountAmount = parseFloat(product.discount) || 0
      }

      grossTotal += grossAmount - discountAmount
    })

    formik.setFieldValue('grossTotal', grossTotal)

    const grandTotal = grossTotal + (parseFloat(formik.values.freight) || 0) - (parseFloat(formik.values.flatDiscount) || 0) - (parseFloat(formik.values.specialDiscount) || 0)
    formik.setFieldValue('grandTotal', Math.round(grandTotal))

  const totalPaymentDetails = (formik.values.paymentDetails || []).reduce((sum, payment) => sum + (payment.amountPaid || 0), 0)
  const totalPaid = totalPaymentDetails
  const creditAmount = Math.round(totalPaid) - Math.round(grandTotal)
  formik.setFieldValue('creditAmount', Math.round(creditAmount))
  }

  // Effect to populate brands from API response
  useEffect(() => {
    if (brandsData?.data?.success) {
      const brandsList = brandsData.data.result.docs || brandsData.data.result || []
      setBrands(brandsList)
    } else {
      setBrands([])
    }
  }, [brandsData])

  // Effect to populate products from API response
  useEffect(() => {
    if (productsData?.data?.success) {
      const productsList = productsData.data.result.docs || productsData.data.result || []
      setProducts(productsList)
      setFilteredProducts(productsList)
    } else {
      setProducts([])
      setFilteredProducts([])
    }
  }, [productsData])

  // Effect to update selectedBrand when formik brandId changes
  useEffect(() => {
    if (formik.values.brandId && formik.values.brandId !== selectedBrand) {
      setSelectedBrand(formik.values.brandId)
      // Clear products when brand changes to prevent showing products from old brand
      setFilteredProducts([])
      // Clear selected product when brand changes
      productFormik.setFieldValue('productId', '')
      // Invalidate the products query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['get-products-by-brand'] })
    }
  }, [formik.values.brandId, selectedBrand, queryClient, productFormik])

  // Effect to recalculate totals when relevant fields change
  useEffect(() => {
    calculateTotals()
  }, [formik.values.freight, formik.values.flatDiscount, formik.values.specialDiscount, formik.values.paymentDetails])

  // Effect to handle edit mode data loading
  useEffect(() => {
    if (isEditMode && fetchedOnePurchaseEntryData?.data?.success) {
      const purchaseData = fetchedOnePurchaseEntryData.data.result

      const formattedProducts = (purchaseData.products || []).map(product => ({
        ...product,
        productId: product.productId?._id || product.productId,
        expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : '',
        returnQuantity: product.returnQuantity || 0,
        returnDate: product.returnDate ? new Date(product.returnDate).toISOString().split('T')[0] : '',
        cartonSize: product.cartonSize || 0,
        packingSize: product.packingSize || 0
      }))

      formik.setValues({
        brandId: purchaseData.brandId?._id || purchaseData.brandId || '',
        invoiceNumber: purchaseData.invoiceNumber || '',
        invoiceDate: purchaseData.invoiceDate ? new Date(purchaseData.invoiceDate).toISOString().split('T')[0] : '',
        date: purchaseData.date ? new Date(purchaseData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        grossTotal: purchaseData.grossTotal || 0,
        freight: purchaseData.freight || 0,
        flatDiscount: purchaseData.flatDiscount || 0,
        specialDiscount: purchaseData.specialDiscount || 0,
        grandTotal: purchaseData.grandTotal || 0,
        creditAmount: purchaseData.creditAmount || 0,
        remarks: purchaseData.remarks || '',
        paymentDetails: purchaseData.paymentDetails || [],
        newPaymentDate: new Date().toISOString().split('T')[0],
        newPaymentAmount: 0,
        products: formattedProducts
      })

      if (purchaseData.brandId?._id || purchaseData.brandId) {
        setSelectedBrand(purchaseData.brandId?._id || purchaseData.brandId)
      }

      const hasReturns = formattedProducts.some(product => product.returnQuantity > 0)
      setIsReturnMode(hasReturns)

      setTimeout(() => {
        if (formattedProducts.length > 0) {
          calculateTotals(formattedProducts)
        }
      }, 100)
    }
  }, [fetchedOnePurchaseEntryData, isEditMode])

  if (isEditMode && isLoadingPurchaseEntry) {
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
            onClick={() => router.push(getLocalizedUrl('/purchaseInvoice', params.lang))}
            sx={{ p: 2 }}
          >
            <i className="tabler-arrow-left" />
          </IconButton>
          <div>
            <Typography variant="h4">
              {isEditMode ? 'Edit Purchase Entry' : 'Add New Purchase Entry'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isEditMode ? 'Update the purchase entry details' : 'Create a new purchase entry for inventory management'}
            </Typography>
          </div>
        </Box>
      </Box>

      <FormikProvider formik={{ ...formik, isLoading: createPurchaseEntry.isPending || updatePurchaseEntry.isPending }}>
        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={6}>
            {/* Main Form */}
            <Grid size={{ xs: 12 }}>
              {/* Basic Information */}
              <Card sx={{ mb: 6 }}>
                <CardHeader title="Basic Information" />
                <CardContent>
                  <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <CustomSelect
                        name='brandId'
                        label='Brand'
                        placeholder='Select Brand'
                        options={brands.map(brand => ({ value: brand._id, label: brand.brandName }))}
                        requiredField
                        loading={brandsLoading}
                        autoComplete={true}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <CustomInput
                        name='invoiceNumber'
                        label='Invoice Number'
                        placeholder='INV-2024-001'
                        value={formik.values.invoiceNumber}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.invoiceNumber && Boolean(formik.errors.invoiceNumber)}
                        helperText={formik.touched.invoiceNumber && formik.errors.invoiceNumber}
                        requiredField
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <CustomInput
                        name='invoiceDate'
                        label='Invoice Date'
                        type='date'
                        value={formik.values.invoiceDate}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.invoiceDate && Boolean(formik.errors.invoiceDate)}
                        helperText={formik.touched.invoiceDate && formik.errors.invoiceDate}
                        requiredField
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <CustomInput
                        name='date'
                        label='Purchase Date'
                        type='date'
                        value={formik.values.date}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.date && Boolean(formik.errors.date)}
                        helperText={formik.touched.date && formik.errors.date}
                        requiredField
                      />
                    </Grid>

                    {/* Last Invoice Information */}
                    {selectedBrand && (
                      <>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <Box className="p-3 border rounded-lg">
                            <Typography variant="body2" className="text-gray-600 mb-1">
                              Last Invoice Number
                            </Typography>
                            <Typography variant="body1" className="font-medium">
                              {lastInvoiceLoading ? (
                                'Loading...'
                              ) : lastInvoiceData?.data?.success ? (
                                lastInvoiceData.data.result.lastInvoiceNumber || 'No Record'
                              ) : (
                                'No Record'
                              )}
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid size={{ xs: 12, md: 3 }}>
                          <Box className="p-3 border rounded-lg">
                            <Typography variant="body2" className="text-gray-600 mb-1">
                              Last Invoice Price
                            </Typography>
                            <Typography variant="body1" className="font-medium">
                              {lastInvoiceLoading ? (
                                'Loading...'
                              ) : lastInvoiceData?.data?.success && lastInvoiceData.data.result.lastInvoicePrice ? (
                                `₨${lastInvoiceData.data.result.lastInvoicePrice.toLocaleString()}`
                              ) : (
                                'No Record'
                              )}
                            </Typography>
                          </Box>
                        </Grid>
                      </>
                    )}

                    <Grid size={{ xs: 12 }}>
                      <CustomInput
                        name='remarks'
                        label='Remarks'
                        placeholder='Additional notes...'
                        value={formik.values.remarks}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.remarks && Boolean(formik.errors.remarks)}
                        helperText={formik.touched.remarks && formik.errors.remarks}
                        multiline
                        rows={2}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Products Section */}
              <Card sx={{ mb: 6 }}>
                <CardHeader title="Products" />
                <CardContent>
                  {/* Product Entry Form */}
                  <div className='mb-6 p-4 border rounded-lg product-form-section'>
                    {editingProductIndex !== null && (
                      <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <i className='tabler-edit text-blue-600' />
                            <Typography variant='body2' className='text-blue-800 font-medium'>
                              Editing Product #{editingProductIndex + 1}
                            </Typography>
                          </div>
                          <Button
                            size='small'
                            variant='outlined'
                            color='secondary'
                            onClick={handleCancelProductEdit}
                          >
                            Cancel Edit
                          </Button>
                        </div>
                      </div>
                    )}
                    <FormikProvider formik={productFormik}>
                      <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <CustomSelect
                            name='productId'
                            label='Product'
                            placeholder={productsLoading ? 'Loading products...' : 'Select Product'}
                            options={filteredProducts.map(prod => ({
                              value: prod._id,
                              label: `${prod.productName}`,
                              cartonSize: prod.cartonSize,
                              packingSize: prod.packingSize
                            }))}
                            requiredField
                            loading={productsLoading}
                            disabled={productsLoading || !selectedBrand}
                            autoComplete={true}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <CustomInput
                            name='batchNumber'
                            label='Batch Number'
                            placeholder='BATCH001'
                            value={productFormik.values.batchNumber}
                            onChange={productFormik.handleChange}
                            onBlur={productFormik.handleBlur}
                            error={productFormik.touched.batchNumber && Boolean(productFormik.errors.batchNumber)}
                            helperText={productFormik.touched.batchNumber && productFormik.errors.batchNumber}
                            requiredField
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <CustomInput
                            name='expiryDate'
                            label='Expiry Date'
                            type='date'
                            value={productFormik.values.expiryDate}
                            onChange={productFormik.handleChange}
                            onBlur={productFormik.handleBlur}
                            error={productFormik.touched.expiryDate && Boolean(productFormik.errors.expiryDate)}
                            helperText={productFormik.touched.expiryDate && productFormik.errors.expiryDate}
                            requiredField
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 3 }}>
                          <CustomInput
                            name='cartons'
                            label='Cartons'
                            type='number'
                            placeholder='0'
                            value={productFormik.values.cartons}
                            onChange={productFormik.handleChange}
                            onBlur={productFormik.handleBlur}
                            error={productFormik.touched.cartons && Boolean(productFormik.errors.cartons)}
                            helperText={productFormik.touched.cartons && productFormik.errors.cartons}
                            requiredField
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 3 }}>
                          <CustomInput
                            name='pieces'
                            label='Pieces'
                            type='number'
                            placeholder='0'
                            value={productFormik.values.pieces}
                            onChange={productFormik.handleChange}
                            onBlur={productFormik.handleBlur}
                            error={productFormik.touched.pieces && Boolean(productFormik.errors.pieces)}
                            helperText={productFormik.touched.pieces && productFormik.errors.pieces}
                            requiredField
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 3 }}>
                          <CustomInput
                            name='totalQuantity'
                            label='Total Quantity'
                            type='number'
                            placeholder='0'
                            disabled
                            value={(
                              (parseFloat(productFormik.values.cartons) || 0) *
                              parseFloat(filteredProducts.find(p => p._id === productFormik.values.productId)?.cartonSize || 0)
                            ) + (parseFloat(productFormik.values.pieces) || 0)}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 3 }}>
                          <CustomInput
                            name='bonus'
                            label='Bonus'
                            type='number'
                            placeholder='0'
                            value={productFormik.values.bonus}
                            onChange={productFormik.handleChange}
                            onBlur={productFormik.handleBlur}
                            error={productFormik.touched.bonus && Boolean(productFormik.errors.bonus)}
                            helperText={productFormik.touched.bonus && productFormik.errors.bonus}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 1.71 }}>
                          <CustomInput
                            name='netPrice'
                            label='Net Price'
                            type='number'
                            placeholder='0'
                            value={productFormik.values.netPrice}
                            onChange={productFormik.handleChange}
                            onBlur={productFormik.handleBlur}
                            error={productFormik.touched.netPrice && Boolean(productFormik.errors.netPrice)}
                            helperText={productFormik.touched.netPrice && productFormik.errors.netPrice}
                            requiredField
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 1.71 }}>
                          <CustomInput
                            name='salePrice'
                            label='Sale Price'
                            type='number'
                            placeholder='0'
                            value={productFormik.values.salePrice}
                            onChange={productFormik.handleChange}
                            onBlur={productFormik.handleBlur}
                            error={productFormik.touched.salePrice && Boolean(productFormik.errors.salePrice)}
                            helperText={productFormik.touched.salePrice && productFormik.errors.salePrice}
                            requiredField
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 1.71 }}>
                          <CustomInput
                            name='minSalePrice'
                            label='Min Sale Price'
                            type='number'
                            placeholder='0'
                            value={productFormik.values.minSalePrice}
                            onChange={productFormik.handleChange}
                            onBlur={productFormik.handleBlur}
                            error={productFormik.touched.minSalePrice && Boolean(productFormik.errors.minSalePrice)}
                            helperText={productFormik.touched.minSalePrice && productFormik.errors.minSalePrice}
                            requiredField
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 1.71 }}>
                          <CustomInput
                            name='retailPrice'
                            label='Retail Price'
                            type='number'
                            placeholder='0'
                            value={productFormik.values.retailPrice}
                            onChange={productFormik.handleChange}
                            onBlur={productFormik.handleBlur}
                            error={productFormik.touched.retailPrice && Boolean(productFormik.errors.retailPrice)}
                            helperText={productFormik.touched.retailPrice && productFormik.errors.retailPrice}
                            requiredField
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 1.71 }}>
                          <CustomInput
                            name='invoicePrice'
                            label='Invoice Price'
                            type='number'
                            placeholder='0'
                            value={productFormik.values.invoicePrice}
                            onChange={productFormik.handleChange}
                            onBlur={productFormik.handleBlur}
                            error={productFormik.touched.invoicePrice && Boolean(productFormik.errors.invoicePrice)}
                            helperText={productFormik.touched.invoicePrice && productFormik.errors.invoicePrice}
                            requiredField
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 1.71 }}>
                          <CustomInput
                            name='discount'
                            label='Discount'
                            type='number'
                            placeholder='0'
                            value={productFormik.values.discount}
                            onChange={productFormik.handleChange}
                            onBlur={productFormik.handleBlur}
                            error={productFormik.touched.discount && Boolean(productFormik.errors.discount)}
                            helperText={productFormik.touched.discount && productFormik.errors.discount}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 1.71 }}>
                          <CustomSelect
                            name='discountType'
                            label='Discount Type'
                            value={productFormik.values.discountType}
                            onChange={productFormik.handleChange}
                            onBlur={productFormik.handleBlur}
                            error={productFormik.touched.discountType && Boolean(productFormik.errors.discountType)}
                            helperText={productFormik.touched.discountType && productFormik.errors.discountType}
                            options={[
                              { value: 'percentage', label: 'Percentage' },
                              { value: 'flat', label: 'Flat Amount' }
                            ]}
                          />
                        </Grid>

                        <Grid size={{ xs: 12 }} className="flex justify-end mt-4">
                          <Button
                            variant='contained'
                            startIcon={<i className='tabler-plus' />}
                            onClick={() => productFormik.handleSubmit()}
                            disabled={!selectedBrand || productsLoading || !productFormik.isValid}
                          >
                            {editingProductIndex !== null ? 'Update Product' : 'Add Product'}
                          </Button>
                          {editingProductIndex !== null && (
                            <Button
                              variant='outlined'
                              color='secondary'
                              onClick={handleCancelProductEdit}
                              className='ml-2'
                            >
                              Cancel
                            </Button>
                          )}
                        </Grid>
                      </Grid>
                    </FormikProvider>
                  </div>

                  {/* Products Table */}
                  <div className='overflow-auto' style={{ maxHeight: '400px' }}>
                    {formik.values.products.length > 0 && isEditMode && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6">Added Products</Typography>
                        {isEditMode && (<FormControlLabel
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
                    )}
                    <table className='w-full border-collapse'>
                      <thead className='sticky top-0 shadow-sm'>
                        <tr>
                          <th className='p-3 text-left border-b'>Product</th>
                          <th className='p-3 text-left border-b'>Batch</th>
                          <th className='p-3 text-center border-b'>Expiry</th>
                          <th className='p-3 text-center border-b'>Cartons</th>
                          <th className='p-3 text-center border-b'>Pieces</th>
                          <th className='p-3 text-center border-b'>Quantity</th>
                          <th className='p-3 text-center border-b'>Bonus</th>
                          {isEditMode && (
                            <>
                              <th className='p-3 text-center border-b font-semibold' style={{ color: '#ed6c02' }}>Return Qty</th>
                              <th className='p-3 text-center border-b font-semibold' style={{ color: '#ed6c02' }}>Return Date</th>
                            </>
                          )}
                          <th className='p-3 text-center border-b'>Net Price</th>
                          <th className='p-3 text-center border-b'>Sale Price</th>
                          <th className='p-3 text-center border-b'>Min Sale</th>
                          <th className='p-3 text-center border-b'>Retail Price</th>
                          <th className='p-3 text-center border-b'>Invoice Price</th>
                          <th className='p-3 text-center border-b'>Discount</th>
                          <th className='p-3 text-center border-b'>Total</th>
                          <th className='p-3 text-center border-b'>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formik.values.products.length === 0 ? (
                          <tr>
                            <td colSpan={isEditMode ? 18 : 16} className='p-4 text-center text-gray-500'>
                              No products added yet
                            </td>
                          </tr>
                        ) : (
                          formik.values.products.map((product, index) => {
                            const selectedProduct = filteredProducts.find(p => p._id === product.productId)
                            const cartonSize = parseFloat(product.cartonSize) || parseFloat(selectedProduct?.cartonSize) || 0
                            const totalPieces = ((parseFloat(product.cartons) || 0) * cartonSize) + (parseFloat(product.pieces) || 0)
                            const effectivePieces = totalPieces - (parseFloat(product.returnQuantity) || 0)
                            const grossAmount = effectivePieces * (parseFloat(product.netPrice) || 0)
                            const discountAmount = product.discountType === 'percentage'
                              ? grossAmount * ((parseFloat(product.discount) || 0) / 100)
                              : parseFloat(product.discount) || 0
                            const total = grossAmount - discountAmount

                            return (
                              <tr key={index} className='hover:bg-blue-50'>
                                <td className='p-3 border-b'>{selectedProduct?.productName || 'N/A'}</td>
                                <td className='p-3 border-b'>
                                  <Chip
                                    label={product.batchNumber}
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                  />
                                </td>
                                <td className='p-3 border-b'>{new Date(product.expiryDate).toLocaleDateString()}</td>
                                <td className='p-3 text-center border-b'>{product.cartons}</td>
                                <td className='p-3 text-center border-b'>{product.pieces}</td>
                                <td className='p-3 text-center border-b font-medium text-blue-600'>
                                  {effectivePieces}
                                  {product.returnQuantity > 0 && (
                                    <span className='text-xs text-gray-500 ml-1'>
                                      ({totalPieces} - {product.returnQuantity})
                                    </span>
                                  )}
                                </td>
                                <td className='p-3 text-center border-b'>{product.bonus || 0}</td>
                                {isEditMode && (
                                  <>
                                    <td className='p-3 text-center border-b'>
                                      <TextField
                                        type="number"
                                        size="small"
                                        inputProps={{
                                          min: 0,
                                          max: totalPieces,
                                          style: { textAlign: 'center' }
                                        }}
                                        value={product.returnQuantity || 0}
                                        onChange={(e) => {
                                          const updatedProducts = [...formik.values.products]
                                          const maxReturnQty = totalPieces
                                          const returnQuantity = Math.min(Math.max(0, Number(e.target.value) || 0), maxReturnQty)
                                          updatedProducts[index] = {
                                            ...product,
                                            returnQuantity: returnQuantity
                                          }
                                          formik.setFieldValue('products', updatedProducts)
                                          calculateTotals(updatedProducts)
                                        }}
                                        disabled={!isReturnMode}
                                        sx={{ width: '100px' }}
                                      />
                                    </td>
                                    <td className='p-3 text-center border-b'>
                                      <TextField
                                        type="date"
                                        size="small"
                                        value={product.returnDate || ''}
                                        onChange={(e) => {
                                          const updatedProducts = [...formik.values.products]
                                          updatedProducts[index] = {
                                            ...product,
                                            returnDate: e.target.value
                                          }
                                          formik.setFieldValue('products', updatedProducts)
                                        }}
                                        disabled={!isReturnMode}
                                        sx={{ width: '150px' }}
                                        InputLabelProps={{
                                          shrink: true,
                                        }}
                                      />
                                    </td>
                                  </>
                                )}
                                <td className='p-3 text-center border-b'>₨{parseFloat(product.netPrice).toLocaleString()}</td>
                                <td className='p-3 text-center border-b'>₨{parseFloat(product.salePrice || 0).toLocaleString()}</td>
                                <td className='p-3 text-center border-b'>₨{parseFloat(product.minSalePrice || 0).toLocaleString()}</td>
                                <td className='p-3 text-center border-b'>₨{parseFloat(product.retailPrice || 0).toLocaleString()}</td>
                                <td className='p-3 text-center border-b'>₨{parseFloat(product.invoicePrice || 0).toLocaleString()}</td>
                                <td className='p-3 text-center border-b'>
                                  {product.discount > 0
                                    ? `${product.discount}${product.discountType === 'percentage' ? '%' : '₨'}`
                                    : '-'}
                                </td>
                                <td className='p-3 text-center border-b font-medium'>₨{total.toLocaleString()}</td>
                                <td className='p-3 text-center border-b'>
                                  <IconButton
                                    size='small'
                                    color='primary'
                                    onClick={() => handleEditProduct(index)}
                                  >
                                    <i className='tabler-edit text-lg' />
                                  </IconButton>
                                  <IconButton
                                    size='small'
                                    color='error'
                                    onClick={() => removeProduct(index)}
                                  >
                                    <i className='tabler-trash text-lg' />
                                  </IconButton>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Details */}
              <Card sx={{ mb: 6 }}>
                <CardHeader title="Financial Details" />
                <CardContent>
                  <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 8 }}>
                      <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <CustomInput
                            name='freight'
                            label='Freight'
                            type='number'
                            placeholder='0'
                            value={formik.values.freight}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.freight && Boolean(formik.errors.freight)}
                            helperText={formik.touched.freight && formik.errors.freight}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <CustomInput
                            name='flatDiscount'
                            label='Flat Discount'
                            type='number'
                            placeholder='0'
                            value={formik.values.flatDiscount}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.flatDiscount && Boolean(formik.errors.flatDiscount)}
                            helperText={formik.touched.flatDiscount && formik.errors.flatDiscount}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <CustomInput
                            name='specialDiscount'
                            label='Special Discount'
                            type='number'
                            placeholder='0'
                            value={formik.values.specialDiscount}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.specialDiscount && Boolean(formik.errors.specialDiscount)}
                            helperText={formik.touched.specialDiscount && formik.errors.specialDiscount}
                          />
                        </Grid>

                        {/* Payment Fields */}
                        {(
                          <>
                            <Grid size={{ xs: 12 }}>
                              <Typography variant='h6' className='mb-0 mt-1' color='primary'>
                                Payment Records
                              </Typography>
                            </Grid>

                            <Grid size={{ xs: 12, md: 4.5 }}>
                              <CustomInput
                                name='newPaymentDate'
                                label='Payment Date'
                                type='date'
                                value={formik.values.newPaymentDate}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                              />
                            </Grid>

                            <Grid size={{ xs: 12, md: 4.5 }}>
                              <CustomInput
                                name='newPaymentAmount'
                                label='Payment Amount'
                                type='number'
                                placeholder='0'
                                value={formik.values.newPaymentAmount}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                              />
                            </Grid>

                            <Grid size={{ xs: 12, md: 3 }} className="flex items-end">
                              <Button
                                variant='contained'
                                color='primary'
                                onClick={handleAddPayment}
                                disabled={!formik.values.newPaymentAmount || formik.values.newPaymentAmount <= 0 || addPaymentToCredit.isPending}
                                className='mb-0 w-full'
                                size='medium'
                                startIcon={<i className='tabler-plus' />}
                              >
                                {addPaymentToCredit.isPending ? 'Adding Payment...' : 'Add Payment'}
                              </Button>
                            </Grid>

                            {/* Payment Records Section */}
                            {(formik.values.paymentDetails && formik.values.paymentDetails.length > 0) && (
                              <Grid size={{ xs: 12 }}>
                                <Box className='mt-2 p-4 rounded-lg border'>
                                  <Typography variant='subtitle2' className='mb-3 font-medium text-gray-700'>
                                    Payment History
                                  </Typography>
                                  <div className='space-y-3'>
                                    {(formik.values.paymentDetails || []).map((payment, index) => (
                                      <div key={index} className='flex justify-between items-center p-3 bg-white rounded-md shadow-sm border border-gray-200'>
                                        <div className='flex items-center gap-6'>
                                          <div className='flex items-center gap-2'>
                                            <i className='tabler-calendar text-gray-500 text-sm' />
                                            <Typography variant='body2' className='text-gray-600'>
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
                                          disabled={removePaymentFromCredit.isPending}
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
                          </>
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
                              <Typography className='font-medium'>₨{formik.values.grossTotal.toLocaleString()}</Typography>
                            </div>

                            <div className='flex justify-between items-center text-sm text-gray-600'>
                              <Typography>+ Freight:</Typography>
                              <Typography>₨{formik.values.freight.toLocaleString()}</Typography>
                            </div>

                            <div className='flex justify-between items-center text-sm text-gray-600'>
                              <Typography>- Discounts:</Typography>
                              <Typography>₨{(formik.values.flatDiscount + formik.values.specialDiscount).toLocaleString()}</Typography>
                            </div>

                            <Divider />

                            <div className='flex justify-between items-center'>
                              <Typography className='font-medium'>Grand Total:</Typography>
                              <Typography className='font-semibold text-primary'>₨{formik.values.grandTotal.toLocaleString()}</Typography>
                            </div>

                            {formik.values.paymentDetails && formik.values.paymentDetails.length > 0 && (
                              <div className='flex justify-between items-center'>
                                <Typography>Additional Payments:</Typography>
                                <Typography>₨{(formik.values.paymentDetails || []).reduce((sum, payment) => sum + (payment.amountPaid || 0), 0).toLocaleString()}</Typography>
                              </div>
                            )}

                            <div className='flex justify-between items-center'>
                              <Typography className='font-medium'>Total Paid:</Typography>
                              <Typography className='font-semibold text-success'>
                                ₨{((formik.values.paymentDetails || []).reduce((sum, payment) => sum + (payment.amountPaid || 0), 0)).toLocaleString()}
                              </Typography>
                            </div>

                            <Divider />

                            <div className='flex justify-between items-center'>
                              <Typography>Credit Amount:</Typography>
                              <Typography className={`font-medium ${ ((formik.values.paymentDetails || []).reduce((sum, payment) => sum + (payment.amountPaid || 0), 0)) - formik.values.grandTotal > 0 ? 'text-success' : 'text-warning'}`}>
                                ₨{(((formik.values.paymentDetails || []).reduce((sum, payment) => sum + (payment.amountPaid || 0), 0)) - formik.values.grandTotal).toLocaleString()}
                              </Typography>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant='tonal'
                  color='error'
                  onClick={() => router.push(getLocalizedUrl('/purchaseInvoice', params.lang))}
                >
                  Cancel
                </Button>
                <CustomButton
                  onClick={() => formik.handleSubmit()}
                  variant='contained'
                  disabled={createPurchaseEntry.isPending || updatePurchaseEntry.isPending}
                  loading={createPurchaseEntry.isPending || updatePurchaseEntry.isPending}
                  className='min-w-[120px]'
                >
                  {isEditMode ? 'Update' : 'Create'}
                </CustomButton>
              </Box>
            </Grid>
          </Grid>
        </form>
      </FormikProvider>
    </Box>
  )
}

export default AddPurchaseInvoicePage
