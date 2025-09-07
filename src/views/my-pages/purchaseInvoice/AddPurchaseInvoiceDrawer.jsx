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

  const queryClient = useQueryClient()

  // API calls
  const { data: fetchedOnePurchaseEntryData } = purchaseInvoiceService.getOnePurchaseEntryDetails('get-one-purchase-entry', onePurchaseEntry)
  const { data: brandsData, isFetching: brandsLoading } = brandService.getAllBrands('get-all-brands')
  const { data: productsData, isFetching: productsLoading } = productService.getProductsByBrand('get-products-by-brand', selectedBrand)

  // Mutations
  const { mutate: createPurchaseEntry, isPending: isCreatingPurchaseEntry } = purchaseInvoiceService.createPurchaseEntry()
  const { mutate: updatePurchaseEntry, isPending: isUpdatingPurchaseEntry } = purchaseInvoiceService.updatePurchaseEntry()

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
    minSalePrice: Yup.number().min(0, 'Min sale price must be positive'),
    retailPrice: Yup.number().min(0, 'Retail price must be positive'),
    invoicePrice: Yup.number().min(0, 'Invoice price must be positive')
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
          minSalePrice: Yup.number().min(0, 'Min sale price must be positive'),
          retailPrice: Yup.number().min(0, 'Retail price must be positive'),
          invoicePrice: Yup.number().min(0, 'Invoice price must be positive')
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
          grandTotal: values.grossTotal + values.freight - values.flatDiscount - values.specialDiscount,
          creditAmount: (values.grossTotal + values.freight - values.flatDiscount - values.specialDiscount) - values.cashPaid
        }

        if (onePurchaseEntry) {
          updatePurchaseEntry({ id: onePurchaseEntry, purchaseData: calculatedValues }, {
            onSuccess: (response) => {
              if (response.data.success) {
                toast.success(response.data.message)
                queryClient.refetchQueries({ queryKey: ['get-all-purchase-entries'] })
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
      packingSize: 0
    },
    validationSchema: productValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      const products = [...formik.values.products]
      
      if (editingProductIndex !== null) {
        products[editingProductIndex] = { ...values }
      } else {
        products.push({ ...values })
      }

      formik.setFieldValue('products', products)
      calculateTotals(products)
      
      resetForm()
      setEditingProductIndex(null)
    }
  })

  // Handler for product selection
  const handleProductChange = (e) => {
    const { value } = e.target
    productFormik.setFieldValue('productId', value)
    
    // If product is selected, update cartonSize and packingSize
    const selectedProduct = filteredProducts.find(p => p._id === value)
    if (selectedProduct) {
      productFormik.setFieldValue('cartonSize', selectedProduct.cartonSize)
      productFormik.setFieldValue('packingSize', selectedProduct.packingSize)
    }
  }

  // Handler for editing product
  const handleEditProduct = (index) => {
    const product = formik.values.products[index]
    productFormik.setValues(product)
    setEditingProductIndex(index)
  }

  // Function to close modal
  function closeModal() {
    stateChanger()
    formik.resetForm()
    productFormik.resetForm()
    setOnePurchaseEntry(null)
    setOnePurchaseEntryData(null)
    setSelectedBrand('')
    setProducts([])
    setFilteredProducts([])
    setEditingProductIndex(null)
    
    // Reset touched state for all currentProduct fields
    const productFields = [
      'productId', 'batchNumber', 'expiryDate', 'cartons', 'pieces', 
      'bonus', 'netPrice', 'discount', 'discountType', 'salePrice', 
      'minSalePrice', 'retailPrice', 'invoicePrice', 'cartonSize', 'packingSize'
    ]
    productFields.forEach(key => {
      formik.setFieldTouched(`currentProduct.${key}`, false, false)
    })
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
      const cartonSize = selectedProduct?.cartonSize || 0
      
      // Calculate total pieces: (cartons * cartonSize) + pieces
      const totalPieces = ((parseFloat(product.cartons) || 0) * parseFloat(cartonSize)) + (parseFloat(product.pieces) || 0)
      const grossAmount = totalPieces * (parseFloat(product.netPrice) || 0)
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
    formik.setFieldValue('grandTotal', grandTotal)
    
    const creditAmount = grandTotal - (parseFloat(formik.values.cashPaid) || 0)
    formik.setFieldValue('creditAmount', creditAmount)
  }

  // Effect to recalculate totals when relevant fields change
  useEffect(() => {
    calculateTotals()
  }, [formik.values.freight, formik.values.flatDiscount, formik.values.specialDiscount, formik.values.cashPaid])

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
                  <div className='mb-6 p-4 border rounded-lg bg-gray-50'>
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <CustomSelect
                          name='productId'
                          label='Product'
                          placeholder={productsLoading ? 'Loading products...' : 'Select Product'}
                          options={filteredProducts.map(prod => ({ 
                            value: prod._id, 
                            label: `${prod.productName} (${prod.productCode})`,
                            cartonSize: prod.cartonSize,
                            packingSize: prod.packingSize
                          }))}
                          value={productFormik.values.productId}
                          requiredField
                          loading={productsLoading}
                          disabled={productsLoading || !selectedBrand}
                          autoComplete={true}
                          onChange={handleProductChange}
                          onBlur={productFormik.handleBlur}
                          error={productFormik.touched.productId && Boolean(productFormik.errors.productId)}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 3 }}>
                        <CustomInput
                          name='batchNumber'
                          label='Batch Number'
                          placeholder='BATCH001'
                          value={productFormik.values.batchNumber}
                          onChange={productFormik.handleChange}
                          onBlur={productFormik.handleBlur}
                          error={productFormik.touched.batchNumber && Boolean(productFormik.errors.batchNumber)}
                          requiredField
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 3 }}>
                        <CustomInput
                          name='expiryDate'
                          label='Expiry Date'
                          type='date'
                          requiredField
                          error={productFormik.touched.expiryDate && Boolean(productFormik.errors.expiryDate)}
                        />
                      </Grid>
                      
                      <Grid size={{ xs: 12, md: 3 }}>
                        <CustomInput
                          name='netPrice'
                          label='Net Price'
                          type='number'
                          placeholder='0'
                          requiredField
                          error={productFormik.touched.netPrice && Boolean(productFormik.errors.netPrice)}
                        />
                      </Grid>
                      
                      <Grid size={{ xs: 12, md: 2 }}>
                        <CustomInput
                          name='cartons'
                          label='Cartons'
                          type='number'
                          placeholder='0'
                          requiredField
                          error={productFormik.touched.cartons && Boolean(productFormik.errors.cartons)}
                        />
                      </Grid>
                      
                      <Grid size={{ xs: 12, md: 2 }}>
                        <CustomInput
                          name='pieces'
                          label='Pieces'
                          type='number'
                          placeholder='0'
                          requiredField
                          error={productFormik.touched.pieces && Boolean(productFormik.errors.pieces)}
                        />
                      </Grid>
                      
                      <Grid size={{ xs: 12, md: 2 }}>
                        <CustomInput
                          name='bonus'
                          label='Bonus'
                          type='number'
                          placeholder='0'
                        />
                      </Grid>
                      
                      <Grid size={{ xs: 12, md: 2 }}>
                        <CustomInput
                          name='discount'
                          label='Discount'
                          type='number'
                          placeholder='0'
                        />
                      </Grid>
                      
                      <Grid size={{ xs: 12, md: 2 }}>
                        <CustomSelect
                          name='discountType'
                          label='Discount Type'
                          options={[
                            { value: 'percentage', label: 'Percentage' },
                            { value: 'flat', label: 'Flat Amount' }
                          ]}
                        />
                      </Grid>
                      
                      <Grid size={{ xs: 12, md: 2 }}>
                        <CustomInput
                          name='salePrice'
                          label='Sale Price'
                          type='number'
                          placeholder='0'
                          requiredField
                          error={productFormik.touched.salePrice && Boolean(productFormik.errors.salePrice)}
                        />
                      </Grid>

                      <Grid size={{ xs: 12 }} className="flex justify-end mt-4">
                        <Button
                          variant='contained'
                          startIcon={<i className='tabler-plus' />}
                          onClick={productFormik.handleSubmit}
                          disabled={!selectedBrand || productsLoading}
                        >
                          {editingProductIndex !== null ? 'Update Product' : 'Add Product'}
                        </Button>
                      </Grid>
                    </Grid>
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
                          <th className='p-3 text-right border-b'>Net Price</th>
                          <th className='p-3 text-right border-b'>Discount</th>
                          <th className='p-3 text-right border-b'>Total</th>
                          <th className='p-3 text-center border-b'>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formik.values.products.length === 0 ? (
                          <tr>
                            <td colSpan={9} className='p-4 text-center text-gray-500'>
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
                                <td className='p-3 text-right border-b'>₨{parseFloat(product.netPrice).toLocaleString()}</td>
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
                            
                            <Divider />
                            
                            <div className='flex justify-between items-center'>
                              <Typography>Outstanding:</Typography>
                              <Typography className={`font-medium ${formik.values.creditAmount > 0 ? 'text-warning' : 'text-success'}`}>
                                ₨{formik.values.creditAmount.toLocaleString()}
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

      <DialogActions>
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
