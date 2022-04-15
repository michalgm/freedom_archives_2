import {Chip} from '@mui/material'
import { Pagination } from '@mui/material';
import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import {startCase} from 'lodash';

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

function PaginationFooter({total, offset, page_size, type = 'record', setOffset, digitizedTotal, ...props}) {
  const classes = useStyles();

  return (
    <div className={classes.pagination}>
      <Chip variant="outlined" label={`${total} ${startCase(type)}s ${type === 'record' ? `(${digitizedTotal} digitized)` : '' }`} />
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
      <Chip className='spacer-chip' variant="outlined" label={`${total} ${startCase(type)}s`} />
    </div>
  );
}

export default PaginationFooter;