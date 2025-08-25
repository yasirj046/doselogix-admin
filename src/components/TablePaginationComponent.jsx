// MUI Imports
import Pagination from '@mui/material/Pagination'
import Typography from '@mui/material/Typography'

const TablePaginationComponent = ({ table, totalItems, totalPages, currentPage, pageSize, onPageChange }) => {
  return (
    <div className='flex justify-between items-center flex-wrap pli-6 border-bs bs-auto plb-[12.5px] gap-2'>
      <Typography color='text.disabled'>
        {`Showing ${totalItems === 0 ? 0 : currentPage * pageSize + 1}
        to ${Math.min((currentPage + 1) * pageSize, totalItems)} of ${totalItems} entries`}
      </Typography>
      <Pagination
        shape='rounded'
        color='primary'
        variant='tonal'
        count={totalPages}
        page={currentPage + 1}
        onChange={(_, page) => {
          onPageChange(page - 1)
        }}
        showFirstButton
        showLastButton
      />
    </div>
  )
}

export default TablePaginationComponent
