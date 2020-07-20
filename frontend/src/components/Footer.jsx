import React from 'react';
import { Grid, Paper } from '@material-ui/core';
import { startCase } from 'lodash';
function Footer({ item }) {
  const renderTime = type => {
    return (
      <div>
        {startCase(type)} at{' '}
        {item[`date_${type}`]
          ? new Date(item[`date_${type}`]).toLocaleString()
          : '???'}{' '}
        by{' '}
        {item[`${type === 'created' ? 'creator' : 'contributor'}_name`] ||
          'Unknown'}
      </div>
    );
  };

  return (
    <Grid item xs={12}>
      <Paper>
        <Grid
          container
          alignContent="center"
          alignItems="center"
          justify="space-between"
        >
          {renderTime('created')}
          {renderTime('modified')}
        </Grid>
      </Paper>
    </Grid>
  );
}

export default Footer;
