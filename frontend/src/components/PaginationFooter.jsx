import {Chip} from '@material-ui/core'
import { Pagination } from '@material-ui/lab';
import React from 'react';
import {makeStyles} from '@material-ui/core/styles';

const useStyles = makeStyles({
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    // flexGrow: 1,
    "& > .spacer-chip": {
      visibility: 'hidden'
      // margin: 'auto'
    }

  },
});

function PaginationFooter({total, offset, page_size, setOffset, ...props}) {
  const classes = useStyles();

  return (
    <div className={classes.pagination}>
      <Chip variant="outlined" label={`${total} records`} />
      <Pagination
        page={(offset / page_size) + 1}
        count={Math.round(total / page_size)}
        onChange={(_, page) => setOffset((page - 1) * page_size)}
        showFirstButton
        showLastButton
        size="large"
        color="primary"
        variant="outlined"
        {...props}
      />
      <Chip className='spacer-chip' variant="outlined" label={`${total} records`} />
    </div>
  );
}

export default PaginationFooter;