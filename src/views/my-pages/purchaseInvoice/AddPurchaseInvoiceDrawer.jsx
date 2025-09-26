import { useEffect, useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'

// Third-party Imports
import * as Yup from 'yup'
import { useFormik } from 'formik'
import { toast } from 'react-toastify'
import { useQueryClient } from '@tanstack/react-query'

// Component Imports
import FormikProvider from '../../../contexts/formikContext'
import CustomInput from '@/components/custom-components/CustomInput'
import CustomSelect from '@/components/custom-components/CustomSelect'
import CustomButton from '@/components/custom-components/CustomButton'

// Service Imports
import { brandService } from '@/services/brandService'
import { productService } from '@/services/productService'
import { purchaseInvoiceService } from '@/services/purchaseInvoiceService'

const AddPurchaseInvoiceDrawer = props => {
  // Props
  const { open, stateChanger, onePurchaseEntry, setOnePurchaseEntry } = props

  // States
  const [brands, setBrands] = useState([])
  const [products, setProducts] = useState([])
  const [selectedBrand, setSelectedBrand] = useState('')
  const [onePurchaseEntryData, setOnePurchaseEntryData] = useState(null)
  const [filteredProducts, setFilteredProducts] = useState([])
  const [editingProductIndex, setEditingProductIndex] = useState(null)
  const [priceCalculation, setPriceCalculation] = useState()

  const queryClient = useQueryClient()

  // API calls
  const { data: fetchedOnePurchaseEntryData } = purchaseInvoiceService.getOnePurchaseEntryDetails('get-one-purchase-entry', onePurchaseEntry)
  const { data: brandsData, isFetching: brandsLoading } = brandService.getAllBrands('get-all-brands')
  const { data: productsData, isFetching: productsLoading } = productService.getProductsByBrand('get-products-by-brand', selectedBrand)
  const { data: lastInvoiceData, isFetching: lastInvoiceLoading } = purchaseInvoiceService.getLastInvoiceByBrand('get-last-invoice-by-brand', selectedBrand)

  // Mutations
  const { mutate: createPurchaseEntry, isPending: isCreatingPurchaseEntry } = purchaseInvoiceService.createPurchaseEntry()
  const { mutate: updatePurchaseEntry, isPending: isUpdatingPurchaseEntry } = purchaseInvoiceService.updatePurchaseEntry()
  const { mutate: addPaymentToCredit, isPending: isAddingPayment } = purchaseInvoiceService.addPaymentToCredit()
  const { mutate: removePaymentFromCredit, isPending: isRemovingPayment } = purchaseInvoiceService.removePaymentFromCredit()

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
    invoicePrice: Yup.number().min(0, 'Invoice price must be positive').required('Invoice price is required')
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
      cashPaid: 0,
      creditAmount: 0,
      remarks: '',
      paymentDetails: [],
      // New payment fields
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
      cashPaid: Yup.number().min(0, 'Cash paid must be positive'),
      creditAmount: Yup.number().min(0, 'Credit amount must be positive'),
      remarks: Yup.string().trim(),
      // New payment validation
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
          invoicePrice: Yup.number().min(0, 'Invoice price must be positive').required('Invoice price is required')
        })
      ).min(1, 'At least one product is required')
    }),
    onSubmit: async (values) => {
      try {
        // Calculate totals and additional required fields before submission
        const calculatedProducts = values.products.map(product => {
          const selectedProduct = filteredProducts.find(p => p._id === product.productId)
          const cartonSize = selectedProduct?.cartonSize || 0

          // Calculate total quantity in pieces
          const quantity = ((parseFloat(product.cartons) || 0) * parseFloat(cartonSize)) + (parseFloat(product.pieces) || 0)

          // Calculate total amount before discount
          const grossAmount = quantity * (parseFloat(product.netPrice) || 0)

          // Calculate discount amount
          let discountAmount = 0
          if (product.discountType === 'percentage') {
            discountAmount = grossAmount * ((parseFloat(product.discount) || 0) / 100)
          } else {
            discountAmount = parseFloat(product.discount) || 0
          }

          // Calculate total amount after discount
          const totalAmount = grossAmount - discountAmount

          // Calculate effective cost per piece
          const effectiveCostPerPiece = quantity > 0 ? totalAmount / quantity : 0

          return {
            ...product,
            quantity,
            totalAmount,
            effectiveCostPerPiece
          }
        })

        const calculatedValues = {
          ...values,
          products: calculatedProducts,
          grandTotal: Math.round(values.grossTotal + values.freight - values.flatDiscount - values.specialDiscount),
          creditAmount: Math.round((values.grossTotal + values.freight - values.flatDiscount - values.specialDiscount) -
                       ((values.cashPaid || 0) + (values.paymentDetails || []).reduce((sum, payment) => sum + (payment.amountPaid || 0), 0)))
        }

        if (onePurchaseEntry) {
          updatePurchaseEntry({ id: onePurchaseEntry, purchaseData: calculatedValues }, {
            onSuccess: (response) => {
              if (response.data.success) {
                toast.success(response.data.message)
                // Invalidate both the main list and the specific purchase entry query
                queryClient.refetchQueries({ queryKey: ['get-all-purchase-entries'] })
                queryClient.invalidateQueries({ queryKey: ['get-one-purchase-entry', onePurchaseEntry] })
                closeModal()
              } else {
                toast.error(response.data.message || 'Failed to update purchase entry')
              }
            },
            onError: (error) => {
              console.error('Update purchase entry error:', error)
              toast.error(error.message || 'Failed to update purchase entry')
            }
          })
        } else {
          createPurchaseEntry(calculatedValues, {
            onSuccess: (response) => {
              if (response.data.success) {
                toast.success(response.data.message)
                queryClient.refetchQueries({ queryKey: ['get-all-purchase-entries'] })
                closeModal()
              } else {
                toast.error(response.data.message || 'Failed to create purchase entry')
              }
            },
            onError: (error) => {
              console.error('Create purchase entry error:', error)
              toast.error(error.message || 'Failed to create purchase entry')
            }
          })
        }
      } catch (err) {
        console.error('Form submission error:', err)
        toast.error('Failed to process the form. Please check all fields.')
      }
    }
  })

  // Product form formik - Enhanced with better integration
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
      packingSize: 0
    },
    validationSchema: productValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        // Validate that brand is selected
        if (!formik.values.brandId) {
          toast.error('Please select a brand first')
          return
        }

        // Validate product selection
        if (!values.productId) {
          toast.error('Please select a product')
          return
        }

        // Check for duplicate products with same batch number
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

    // Always update local state only - don't save to backend immediately
    const updatedPaymentDetails = [...formik.values.paymentDetails, paymentData]
    formik.setFieldValue('paymentDetails', updatedPaymentDetails)

    // Reset payment fields
    formik.setFieldValue('newPaymentAmount', 0)
    formik.setFieldValue('newPaymentDate', new Date().toISOString().split('T')[0])

    toast.success('Payment added successfully')
  }

  const handleRemovePayment = (index) => {
    // Always update local state only - don't save to backend immediately
    const updatedPaymentDetails = formik.values.paymentDetails.filter((_, i) => i !== index)
    formik.setFieldValue('paymentDetails', updatedPaymentDetails)
    toast.success('Payment removed successfully')
  }

  // Handler for editing product - Enhanced with better state management
  const handleEditProduct = (index) => {
    const product = formik.values.products[index]

    // Find the selected product to get additional info
    const selectedProduct = filteredProducts.find(p => p._id === product.productId)

    // Format expiry date for date input (YYYY-MM-DD format)
    let formattedExpiryDate = ''
    if (product.expiryDate) {
      const expiryDate = new Date(product.expiryDate)
      if (!isNaN(expiryDate.getTime())) {
        formattedExpiryDate = expiryDate.toISOString().split('T')[0]
      }
    }

    // Set all product form values including carton and packing sizes
    productFormik.setValues({
      ...product,
      expiryDate: formattedExpiryDate,
      cartonSize: selectedProduct?.cartonSize || 0,
      packingSize: selectedProduct?.packingSize || 0
    })

    setEditingProductIndex(index)

    // Scroll to product form for better UX
    setTimeout(() => {
      const productForm = document.querySelector('.product-form-section')
      if (productForm) {
        productForm.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }

  // Handler for canceling product edit
  const handleCancelProductEdit = () => {
    productFormik.resetForm()
    setEditingProductIndex(null)
  }

  // Function to close modal - Enhanced with better cleanup
  function closeModal() {
    // Reset all form states
    formik.resetForm()
    productFormik.resetForm()

    // Reset component states
    setOnePurchaseEntry(null)
    setOnePurchaseEntryData(null)
    setSelectedBrand('')
    setProducts([])
    setFilteredProducts([])
    setEditingProductIndex(null)

    // Close the modal
    stateChanger()
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
      // Find the selected product from filteredProducts to get cartonSize and packingSize
      const selectedProduct = filteredProducts.find(p => p._id === product.productId)

      // Calculate total pieces: (cartons * cartonSize) + pieces
      const totalPieces = ((parseFloat(product.cartons) || 0) * parseFloat(product.cartonSize)) + (parseFloat(product.pieces) || 0)


      const grossAmount = totalPieces * (parseFloat(product.netPrice) || 0)
      let discountAmount = 0

      if (product.discountType === 'percentage') {
        discountAmount = grossAmount * ((parseFloat(product.discount) || 0) / 100)
      } else {
        discountAmount = parseFloat(product.discount) || 0
      }

      grossTotal += grossAmount - discountAmount
      console.log("gross amount", grossTotal);


    })


    formik.setFieldValue('grossTotal', grossTotal)


    const grandTotal = grossTotal + (parseFloat(formik.values.freight) || 0) - (parseFloat(formik.values.flatDiscount) || 0) - (parseFloat(formik.values.specialDiscount) || 0)
    formik.setFieldValue('grandTotal', Math.round(grandTotal))

    // Calculate total paid: cash paid + sum of all payment details
    const totalPaymentDetails = (formik.values.paymentDetails || []).reduce((sum, payment) => sum + (payment.amountPaid || 0), 0)
    const totalPaid = (parseFloat(formik.values.cashPaid) || 0) + totalPaymentDetails
    const creditAmount = Math.round(grandTotal) - totalPaid
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

  // Debug effect for brands state
  useEffect(() => {
    const mappedOptions = brands.map(brand => ({ value: brand._id, label: brand.brandName }))
  }, [brands])

  // Effect to update selectedBrand when formik brandId changes
  useEffect(() => {
    if (formik.values.brandId && formik.values.brandId !== selectedBrand) {
      setSelectedBrand(formik.values.brandId)
    }
  }, [formik.values.brandId, selectedBrand])

  // Effect to recalculate totals when relevant fields change
  useEffect(() => {
    calculateTotals()
  }, [formik.values.freight, formik.values.flatDiscount, formik.values.specialDiscount, formik.values.cashPaid, formik.values.paymentDetails])

  // Effect to force refresh purchase entry data when modal opens for editing
  useEffect(() => {
    if (open && onePurchaseEntry) {
      // Force refetch the specific purchase entry to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['get-one-purchase-entry', onePurchaseEntry] })
    }
  }, [open, onePurchaseEntry, queryClient])

  // Effect to handle edit mode data loading
  useEffect(() => {
    if (onePurchaseEntry && fetchedOnePurchaseEntryData?.data?.success) {
      const purchaseData = fetchedOnePurchaseEntryData.data.result

      // Format products data with proper date formatting
      const formattedProducts = (purchaseData.products || []).map(product => ({
        ...product,
        expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : ''
      }))

      // Populate main form with purchase entry data
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
        cashPaid: purchaseData.cashPaid || 0,
        creditAmount: purchaseData.creditAmount || 0,
        remarks: purchaseData.remarks || '',
        paymentDetails: purchaseData.paymentDetails || [],
        // Initialize new payment fields
        newPaymentDate: new Date().toISOString().split('T')[0],
        newPaymentAmount: 0,
        products: formattedProducts
      })

      // Set selected brand for product filtering
      if (purchaseData.brandId?._id || purchaseData.brandId) {
        setSelectedBrand(purchaseData.brandId?._id || purchaseData.brandId)
      }

      setOnePurchaseEntryData(purchaseData)
    }
  }, [fetchedOnePurchaseEntryData, onePurchaseEntry])

  // Effect to handle product selection changes
  useEffect(() => {
    const productId = productFormik.values.productId
    if (productId && filteredProducts.length > 0) {
      const selectedProduct = filteredProducts.find(p => p._id === productId)
      if (selectedProduct) {
        productFormik.setFieldValue('cartonSize', selectedProduct.cartonSize)
        productFormik.setFieldValue('packingSize', selectedProduct.packingSize)

        // Optionally auto-fill some pricing fields if available
        if (selectedProduct.defaultSalePrice) {
          productFormik.setFieldValue('salePrice', selectedProduct.defaultSalePrice)
        }
      }
    }
  }, [productFormik.values.productId, filteredProducts])

  return (
    <Dialog
      open={open}
      onClose={closeModal}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { height: '95vh', maxWidth: '1400px' }
      }}
    >
      <DialogTitle>
        <div className='flex items-center justify-between'>
          <Typography variant='h5'>
            {onePurchaseEntry ? 'Edit Purchase Entry' : 'Add New Purchase Entry'}
          </Typography>
          <IconButton size='small' onClick={closeModal}>
          <i className='tabler-x text-2xl text-textPrimary' />
        </IconButton>
      </div>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <div className='p-6 overflow-y-auto'>
          <FormikProvider formik={{ ...formik, isLoading: isCreatingPurchaseEntry || isUpdatingPurchaseEntry }}>
            <form className='flex flex-col gap-6' onSubmit={(e) => {
              e.preventDefault()
              if (e.key === 'Enter' && !e.shiftKey) {
                productFormik.handleSubmit()
              }
            }}>
              {/* Basic Information */}
              <Card>
                <CardHeader title="Basic Information" />
                <CardContent>
                  <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <CustomSelect
                        name='brandId'
                        label='Brand'
                        placeholder='Select Brand'
                        options={brands.map(brand => {
                          return { value: brand._id, label: brand.brandName }
                        })}
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
                        requiredField
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <CustomInput
                        name='invoiceDate'
                        label='Invoice Date'
                        type='date'
                        requiredField
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <CustomInput
                        name='date'
                        label='Purchase Date'
                        type='date'
                        requiredField
                      />
                    </Grid>

                    {/* Last Invoice Information */}
                    {selectedBrand && (
                      <>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <Box className="p-3 border rounded-lg bg-gray-50">
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
                          <Box className="p-3 border rounded-lg bg-gray-50">
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
                        multiline
                        rows={2}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Products Section */}
              <Card>
                <CardHeader title="Products" />
                <CardContent>
                  {/* Product Entry Form */}
                  <div className='mb-6 p-4 border rounded-lg bg-gray-50 product-form-section'>
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
                            requiredField
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <CustomInput
                            name='expiryDate'
                            label='Expiry Date'
                            type='date'
                            requiredField
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 2.4 }}>
                          <CustomInput
                            name='cartons'
                            label='Cartons'
                            type='number'
                            placeholder='0'
                            requiredField
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 2.4 }}>
                          <CustomInput
                            name='pieces'
                            label='Pieces'
                            type='number'
                            placeholder='0'
                            requiredField
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 2.4 }}>
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

                        <Grid size={{ xs: 12, md: 2.4 }}>
                          <CustomInput
                            name='bonus'
                            label='Bonus'
                            type='number'
                            placeholder='0'
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 2.4 }}>
                          <CustomInput
                            name='discount'
                            label='Discount'
                            type='number'
                            placeholder='0'
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 2.4 }}>
                          <CustomSelect
                            name='discountType'
                            label='Discount Type'
                            options={[
                              { value: 'percentage', label: 'Percentage' },
                              { value: 'flat', label: 'Flat Amount' }
                            ]}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 2.4 }}>
                          <CustomInput
                            name='netPrice'
                            label='Net Price'
                            type='number'
                            placeholder='0'
                            requiredField
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 2.4 }}>
                          <CustomInput
                            name='salePrice'
                            label='Sale Price'
                            type='number'
                            placeholder='0'
                            requiredField
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 2.4 }}>
                          <CustomInput
                            name='minSalePrice'
                            label='Min Sale Price'
                            type='number'
                            placeholder='0'
                            requiredField
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 2.4 }}>
                          <CustomInput
                            name='retailPrice'
                            label='Retail Price'
                            type='number'
                            placeholder='0'
                            requiredField
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 2.4 }}>
                          <CustomInput
                            name='invoicePrice'
                            label='Invoice Price'
                            type='number'
                            placeholder='0'
                            requiredField
                          />
                        </Grid>

                        <Grid size={{ xs: 12 }} className="flex justify-end mt-4">
                          <Button
                            variant='contained'
                            startIcon={<i className='tabler-plus' />}
                            onClick={() => {
                              // Validate product form before submission
                              productFormik.handleSubmit()
                            }}
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
                    <table className='w-full border-collapse'>
                      <thead className='sticky top-0 bg-white shadow-sm'>
                        <tr>
                          <th className='p-3 text-left border-b'>Product</th>
                          <th className='p-3 text-left border-b'>Batch</th>
                          <th className='p-3 text-left border-b'>Expiry</th>
                          <th className='p-3 text-right border-b'>Cartons</th>
                          <th className='p-3 text-right border-b'>Pieces</th>
                          <th className='p-3 text-right border-b'>Quantity</th>
                          <th className='p-3 text-right border-b'>Bonus</th>
                          <th className='p-3 text-right border-b'>Net Price</th>
                          <th className='p-3 text-right border-b'>Sale Price</th>
                          <th className='p-3 text-right border-b'>Min Sale</th>
                          {/* <th className='p-3 text-right border-b'>Retail</th>
                          <th className='p-3 text-right border-b'>Invoice</th>
                          <th className='p-3 text-right border-b'>Discount</th> */}
                          <th className='p-3 text-right border-b'>Total</th>
                          <th className='p-3 text-center border-b'>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formik.values.products.length === 0 ? (
                          <tr>
                            <td colSpan={14} className='p-4 text-center text-gray-500'>
                              No products added yet
                            </td>
                          </tr>
                        ) : (
                          formik.values.products.map((product, index) => {
                            const selectedProduct = filteredProducts.find(p => p._id === product.productId)
                            const totalPieces = ((parseFloat(product.cartons) || 0) * parseFloat(selectedProduct?.cartonSize || 0)) + (parseFloat(product.pieces) || 0)
                            const grossAmount = totalPieces * (parseFloat(product.netPrice) || 0)
                            const discountAmount = product.discountType === 'percentage'
                              ? grossAmount * ((parseFloat(product.discount) || 0) / 100)
                              : parseFloat(product.discount) || 0
                            const total = grossAmount - discountAmount

                            return (
                              <tr key={index} className='hover:bg-gray-50'>
                                <td className='p-3 border-b'>{selectedProduct?.productName || 'N/A'}</td>
                                <td className='p-3 border-b'>{product.batchNumber}</td>
                                <td className='p-3 border-b'>{new Date(product.expiryDate).toLocaleDateString()}</td>
                                <td className='p-3 text-right border-b'>{product.cartons}</td>
                                <td className='p-3 text-right border-b'>{product.pieces}</td>
                                <td className='p-3 text-right border-b font-medium text-blue-600'>{totalPieces}</td>
                                <td className='p-3 text-right border-b'>{product.bonus || 0}</td>
                                <td className='p-3 text-right border-b'>₨{parseFloat(product.netPrice).toLocaleString()}</td>
                                <td className='p-3 text-right border-b'>₨{parseFloat(product.salePrice || 0).toLocaleString()}</td>
                                <td className='p-3 text-right border-b'>₨{parseFloat(product.minSalePrice || 0).toLocaleString()}</td>
                                <td className='p-3 text-right border-b'>₨{parseFloat(product.retailPrice || 0).toLocaleString()}</td>
                                <td className='p-3 text-right border-b'>₨{parseFloat(product.invoicePrice || 0).toLocaleString()}</td>
                                <td className='p-3 text-right border-b'>
                                  {product.discount > 0
                                    ? `${product.discount}${product.discountType === 'percentage' ? '%' : '₨'}`
                                    : '-'}
                                </td>
                                <td className='p-3 text-right border-b font-medium'>₨{total.toLocaleString()}</td>
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
              <Card>
                <CardHeader title="Financial Details" />
                <CardContent>
                  <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 8 }}>
                      <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <CustomInput
                            name='freight'
                            label='Freight'
                            type='number'
                            placeholder='0'
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                          <CustomInput
                            name='flatDiscount'
                            label='Flat Discount'
                            type='number'
                            placeholder='0'
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                          <CustomInput
                            name='specialDiscount'
                            label='Special Discount'
                            type='number'
                            placeholder='0'
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                          <CustomInput
                            name='cashPaid'
                            label='Cash Paid'
                            type='number'
                            placeholder='0'
                          />
                        </Grid>

                        {/* Payment Fields - Only show when editing */}
                        {onePurchaseEntry && (
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
                              />
                            </Grid>

                            <Grid size={{ xs: 12, md: 4.5 }}>
                              <CustomInput
                                name='newPaymentAmount'
                                label='Payment Amount'
                                type='number'
                                placeholder='0'
                              />
                            </Grid>

                            <Grid size={{ xs: 12, md: 3 }} className="flex items-end">
                              <Button
                                variant='contained'
                                color='primary'
                                onClick={handleAddPayment}
                                disabled={!formik.values.newPaymentAmount || formik.values.newPaymentAmount <= 0 || isAddingPayment}
                                className='mb-0 w-full'
                                size='medium'
                                startIcon={<i className='tabler-plus' />}
                              >
                                {isAddingPayment ? 'Adding Payment...' : 'Add Payment'}
                              </Button>
                            </Grid>

                            {/* Payment Records Section */}
                            {(formik.values.paymentDetails && formik.values.paymentDetails.length > 0) && (
                              <Grid size={{ xs: 12 }}>
                                <Box className='mt-2 p-4 bg-gray-50 rounded-lg border'>
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
                                          disabled={isRemovingPayment}
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

                            <div className='flex justify-between items-center'>
                              <Typography>Cash Paid:</Typography>
                              <Typography>₨{formik.values.cashPaid.toLocaleString()}</Typography>
                            </div>

                            {onePurchaseEntry && formik.values.paymentDetails && formik.values.paymentDetails.length > 0 && (
                              <div className='flex justify-between items-center'>
                                <Typography>Additional Payments:</Typography>
                                <Typography>₨{(formik.values.paymentDetails || []).reduce((sum, payment) => sum + (payment.amountPaid || 0), 0).toLocaleString()}</Typography>
                              </div>
                            )}

                            <div className='flex justify-between items-center'>
                              <Typography className='font-medium'>Total Paid:</Typography>
                              <Typography className='font-semibold text-success'>
                                ₨{((formik.values.cashPaid || 0) + (formik.values.paymentDetails || []).reduce((sum, payment) => sum + (payment.amountPaid || 0), 0)).toLocaleString()}
                              </Typography>
                            </div>

                            <Divider />

                            <div className='flex justify-between items-center'>
                              <Typography>Credit Amount:</Typography>
                              <Typography className={`font-medium ${ formik.values.grandTotal - ((formik.values.cashPaid || 0) + (formik.values.paymentDetails || []).reduce((sum, payment) => sum + (payment.amountPaid || 0), 0)) > 0 ? 'text-warning' : 'text-success'}`}>
                                ₨{(formik.values.grandTotal - ((formik.values.cashPaid || 0) + (formik.values.paymentDetails || []).reduce((sum, payment) => sum + (payment.amountPaid || 0), 0))).toLocaleString()}
                              </Typography>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </form>
          </FormikProvider>
        </div>
      </DialogContent>

      <DialogActions style={{ borderTop: '22px solid white', height: 64, display: 'flex', alignItems: 'center' }}>
        <Button variant='tonal' color='error' onClick={closeModal}>
          Cancel
        </Button>
        <CustomButton
          onClick={() => formik.handleSubmit()}
          variant='contained'
          disabled={isCreatingPurchaseEntry || isUpdatingPurchaseEntry}
          loading={isCreatingPurchaseEntry || isUpdatingPurchaseEntry}
          className='min-w-[120px]'
        >
          {onePurchaseEntry ? 'Update' : 'Create'}
        </CustomButton>
      </DialogActions>
    </Dialog>
  )
}

export default AddPurchaseInvoiceDrawer
