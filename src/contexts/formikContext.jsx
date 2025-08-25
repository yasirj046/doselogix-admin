'use client'

import { createContext } from 'react'

export const FormikContext = createContext(null)

function FormikProvider(props) {
  return <FormikContext.Provider value={props.formik}>{props.children}</FormikContext.Provider>
}

export default FormikProvider
