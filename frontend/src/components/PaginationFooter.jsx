import React from 'react';
import { Pagination } from '@material-ui/lab';

function PaginationFooter({total, offset, page_size, setOffset}) {

  return (
    <Pagination
      page={(offset / page_size) + 1}
      count={Math.round(total / page_size)}
      onChange={(_, page) => setOffset((page - 1) * page_size)}
      showFirstButton
      showLastButton
      size="large"
      color="primary"
      variant="outlined"
    />
  );
}

export default PaginationFooter;