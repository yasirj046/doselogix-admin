// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import InventoryProvider from '@views/my-pages/inventory/InventoryProvider'

const BatchDetailsLayout = ({ children }) => {
  return (
    <InventoryProvider>
      <Grid container spacing={6}>
        <Grid size={12}>
          {children}
        </Grid>
      </Grid>
    </InventoryProvider>
  )
}

export default BatchDetailsLayout
