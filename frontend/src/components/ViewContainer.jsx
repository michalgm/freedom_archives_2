import {Box, Grid, Icon, Paper, Typography} from '@material-ui/core';
import React, {useEffect} from 'react';
import {collections, records} from '../api';

import ButtonLink from './ButtonLink'
import {startCase} from 'lodash';
import {useStateValue} from '../appContext'

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

function ViewContainer({children, item, buttonRef, neighborService, ...props}) {
  const {state: {search: {query}, search_index}, dispatch} = useStateValue();
  const [neighbors, setNeighbors] = React.useState({prev: null, next: null})

  useEffect(() => {
    const updateNeighbors = async (direction) => {
      if (neighborService) {
        const id = `${neighborService}_id`
        const neighborQuery = {
          ...query,
          $skip: Math.max(search_index - 1, 0),
          $limit: 3,
          $select: [id]
        }
        const {data} = await (neighborService === 'record' ? records : collections).find({query: neighborQuery});
        let neighbors = data.map((item) => item[id]);
        if (!search_index) {
          neighbors.unshift(null)
        }
        setNeighbors({prev: neighbors[0], next: neighbors[2]})
      }
    }
    updateNeighbors()
  }, [search_index, query, neighborService])

  const renderNeighborLink = (type) => {
    const offset = type === 'prev' ? -1 : 1
    if (neighborService) {
      return (
        <Grid item xs component={Box} textAlign={type === 'prev' ? 'left' : 'right'}>
          <ButtonLink
            disabled={!neighbors[type]}
            to={`/${neighborService}s/${neighbors[type]}`}
            onClick={() => dispatch('SEARCH_INDEX', search_index + offset)}
            startIcon={type === 'prev' && <Icon>arrow_backward</Icon>}
            endIcon={type !== 'prev' && <Icon>arrow_forward</Icon>}
          >
            {type}
          </ButtonLink>
        </Grid>
      )
    }
  }

  const renderSection = type => {
    const section = props[`${type}Elements`] || [];
    if (
      section.length ||
      (type === 'footer' && item) ||
      (type === 'header' && buttonRef)
    ) {
      return (
        <Grid item xs={12} style={{flex: 'none'}}>
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
                <>
                  {renderNeighborLink('prev')}
                  <Grid item xs>
                    {renderTime(item, 'created')}
                  </Grid>
                </>
              )}
              {section.map((item, index) => (
                <Grid
                  item
                  xs
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
                <>
                  <Grid item xs style={{textAlign: 'right'}}>
                    {renderTime(item, 'modified')}
                  </Grid>
                  {renderNeighborLink('next')}
                </>
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
      style={{height: 'calc(100vh - 58px)', flexWrap: 'nowrap'}}
    >
      {renderSection('header')}
      <Grid item xs={12} style={{overflowX: 'auto'}}>
        {children}
      </Grid>
      {renderSection('footer')}
    </Grid>
  );
}

export default ViewContainer;
