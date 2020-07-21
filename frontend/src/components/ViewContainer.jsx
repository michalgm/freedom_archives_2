import React from 'react';
import { Grid, Paper, Typography } from '@material-ui/core';
import { startCase } from 'lodash';

const renderTime = (item, type) => {
  return (
    <Typography variant="caption">
      {startCase(type)} at{' '}
      {item[`date_${type}`]
        ? new Date(item[`date_${type}`]).toLocaleString()
        : '???'}{' '}
      by{' '}
      {item[`${type === 'created' ? 'creator' : 'contributor'}_name`] ||
        'Unknown'}
    </Typography>
  );
};

function ViewContainer({ children, item, buttonRef, ...props }) {
  const renderSection = type => {
    const section = props[`${type}Elements`] || [];
    if (
      section.length ||
      (type === 'footer' && item) ||
      (type === 'header' && buttonRef)
    ) {
      return (
        <Grid item xs={12} style={{ flex: 'none' }}>
          <Paper>
            <Grid
              container
              alignContent="center"
              alignItems="center"
              justify={section.length === 1 ? 'center' : 'space-between'}
              spacing={2}
              // direction="column"
            >
              {type === 'footer' && item && (
                <Grid item xs>
                  {renderTime(item, 'created')}
                </Grid>
              )}
              {section.map((item, index) => (
                <Grid
                  item
                  // xs
                  key={`${type}-${index}`}
                  // style={{ textAlign: 'center' }}
                >
                  {item}
                </Grid>
              ))}
              {type === 'header' && buttonRef && (
                <Grid item xs ref={buttonRef}></Grid>
              )}
              {type === 'footer' && item && (
                <Grid item xs style={{ textAlign: 'right' }}>
                  {renderTime(item, 'modified')}
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>
      );
    }
  };

  return (
    <Grid
      container
      direction="column"
      spacing={4}
      style={{ height: 'calc(100vh - 58px)', flexWrap: 'nowrap' }}
    >
      {renderSection('header')}
      <Grid item xs={12} style={{ overflowX: 'auto' }}>
        {children}
      </Grid>
      {renderSection('footer')}
    </Grid>
  );
}

// ViewContainer.propTypes = {};

export default ViewContainer;
