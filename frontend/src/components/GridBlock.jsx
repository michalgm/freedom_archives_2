import { Grid, Paper, Typography } from '@mui/material/';

import React from 'react';

function GridBlock({ children = [], title = '', subtitle = '', width = 12, spacing }) {
  return (
    <Grid item xs={width}>
      <Paper>
        {(title || subtitle) &&
          <Grid container spacing={subtitle ? 4 : 0} alignItems='baseline'>
            {title && <Grid item>
              <Typography variant="h6">{title}</Typography>
            </Grid>}
            {subtitle && <Grid item>
              <Typography variant="subtitle1" color="text.secondary">{subtitle}</Typography>
            </Grid>}
          </Grid>
        }
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
