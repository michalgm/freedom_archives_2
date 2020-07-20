import React from 'react';
import { Grid } from '@material-ui/core';

function Footer({ item }) {
  return (
    <Grid container>
      <Grid item xs={6}>
        Created at{' '}
        {item.date_created
          ? new Date(item.date_created).toLocaleString()
          : '???'}{' '}
        by {item.creator_name || 'Unknown'}
      </Grid>
      <Grid item xs={6}>
        Updated at {new Date(item.date_modified).toLocaleString()} by{' '}
        {item.contributor_name}
      </Grid>
    </Grid>
  );
}

export default Footer;
