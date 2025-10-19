'use client'

// React Imports
import { useEffect } from 'react'
import { toast } from 'react-toastify'

// Next Imports
import { useParams } from 'next/navigation'

// MUI Imports
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import LoadingButton from '@mui/lab/LoadingButton'

// Third-party Imports
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useQueryClient } from '@tanstack/react-query'

// Component Imports
import FormikProvider from '@/contexts/formikContext'
import CustomTextField from '@core/components/mui/TextField'
import CustomInput from '@/components/custom-components/CustomInput'
import CustomSelect from '@/components/custom-components/CustomSelect'

// Service Imports
import { expenseService } from '@/services/expenseService'
import { lookupService } from '@/services/lookupService'

const AddExpenseDrawer = ({ open, stateChanger, oneExpense, setOneExpense }) => {
  // Hooks
  const { lang: locale } = useParams()
  const queryClient = useQueryClient()

  // API mutations
  const { mutate: createExpense, isPending: isCreatingExpense } = expenseService.createExpense()
  const { mutate: updateExpense, isPending: isUpdatingExpense } = expenseService.updateExpense()

  // Fetch expense categories
  const { data: expenseCategoriesData } = lookupService.getExpenseCategoriesLookup('expense-categories-lookup')

  const expenseCategories = expenseCategoriesData?.data?.result || []

  // Form validation schema
  const validationSchema = Yup.object().shape({
    date: Yup.date().required('Date is required'),
    expenseCategory: Yup.string().required('Expense category is required'),
    description: Yup.string().required('Description is required').max(500, 'Description cannot exceed 500 characters'),
    amount: Yup.number().required('Amount is required').min(0.01, 'Amount must be greater than 0').max(999999.99, 'Amount cannot exceed 999,999.99')
  })

  // Formik instance
  const formik = useFormik({
    initialValues: {
      date: oneExpense?.date ? new Date(oneExpense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      expenseCategory: oneExpense?.expenseCategory || '',
      description: oneExpense?.description || '',
      amount: oneExpense?.amount || ''
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => {
      const payload = {
        ...values,
        amount: parseFloat(values.amount)
      }

      if (oneExpense) {
        updateExpense(
          { id: oneExpense._id, data: payload },
          {
            onSuccess: () => {
              toast.success('Expense updated successfully')
              queryClient.invalidateQueries(['get-all-expenses'])
              handleClose()
            },
            onError: error => {
              toast.error(error.message || 'Error updating expense')
            }
          }
        )
      } else {
        createExpense(payload, {
          onSuccess: () => {
            toast.success('Expense created successfully')
            queryClient.invalidateQueries(['get-all-expenses'])
            handleClose()
          },
          onError: error => {
            toast.error(error.message || 'Error creating expense')
          }
        })
      }
    }
  })

  // Close drawer handler
  const handleClose = () => {
    formik.resetForm()
    setOneExpense(null)
    stateChanger()
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
    >
      <div className='flex items-center justify-between plb-5 pli-6'>
        <Typography variant='h5'>{oneExpense ? 'Edit Expense' : 'Add New Expense'}</Typography>
        <IconButton size='small' onClick={handleClose}>
          <i className='tabler-x text-2xl text-textPrimary' />
        </IconButton>
      </div>
      <Divider />
      <div>
        <FormikProvider formik={{ ...formik, isLoading: isCreatingExpense || isUpdatingExpense }}>
          <form onSubmit={formik.handleSubmit} className='flex flex-col gap-6 p-6'>
            <CustomInput
              fullWidth
              type='date'
              name='date'
              label='Date'
              requiredField
              InputLabelProps={{ shrink: true }}
            />

            <CustomSelect
              fullWidth
              name='expenseCategory'
              label='Expense Category'
              placeholder='Select Expense Category'
              options={expenseCategories}
              requiredField
              autocomplete={true}
            />

            <CustomInput
              fullWidth
              multiline
              rows={3}
              name='description'
              label='Description'
              placeholder='Enter expense description'
              requiredField
            />

            <CustomInput
              fullWidth
              type='number'
              name='amount'
              label='Amount'
              placeholder='0.00'
              requiredField
              inputProps={{ step: '0.01', min: '0' }}
            />

            <LoadingButton
              fullWidth
              type='submit'
              variant='contained'
              loading={isCreatingExpense || isUpdatingExpense}
            >
              {oneExpense ? 'Update' : 'Submit'}
            </LoadingButton>
          </form>
        </FormikProvider>
      </div>
    </Drawer>
  )
}

export default AddExpenseDrawer
