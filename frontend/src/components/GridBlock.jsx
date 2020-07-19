import React from 'react';
import { Grid, Paper, Typography } from '@material-ui/core/';

function GridBlock({ children = [], title = '', width = 12 }) {
  return (
    <Grid item xs={width}>
      <Paper>
        {title && <Typography variant="h6">{title}</Typography>}
        {children}
      </Paper>
    </Grid>
  );
}

export default GridBlock;
