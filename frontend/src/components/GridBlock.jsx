import {Grid, Paper, Typography} from '@mui/material/';

import React from 'react';

function GridBlock({children = [], title = '', width = 12, spacing}) {
  return (
    <Grid item xs={width}>
      <Paper>
        {title && <Typography variant="h6">{title}</Typography>}
        {spacing ?
          (<Grid container spacing={spacing}>
            {children}
          </Grid>) : children
        }
      </Paper>
    </Grid>
  );
}

export default GridBlock;
