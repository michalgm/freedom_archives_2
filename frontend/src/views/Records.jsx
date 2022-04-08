import {
  Grid,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@mui/material';

import Manage from '../components/Manage';
import React from 'react';
import Thumbnail from '../components/Thumbnail'

const filter_types = {
  'day': { input: 'number', match: 'exact' },
  'description': { input: 'text', match: 'fuzzy' },
  'file_extension': { input: 'text', match: 'exact' },
  'location': { input: 'text', match: 'fuzzy' },
  'month': { input: 'number', match: 'exact' },
  'title': { input: 'text', match: 'fuzzy' },
  'vol_number': { input: 'text', match: 'fuzzy' },
  'year': { input: 'text', match: 'exact' },
  'authors': { input: 'listitem', match: 'listitem' },
  'subjects': { input: 'listitem', match: 'listitem' },
  'keywords': { input: 'listitem', match: 'listitem' },
  'producers': { input: 'listitem', match: 'listitem' },
  'programs': { input: 'listitem', match: 'listitem_id' },
  'publishers': { input: 'listitem', match: 'listitem_id' },
  'call_numbers': { input: 'text', match: 'contained', case: 'upper' },
  'formats': { input: 'listitem', match: 'contained' },
  'qualitys': { input: 'listitem', match: 'contained' },
  'generations': { input: 'listitem', match: 'contained' },
  'media_types': { input: 'text', match: 'contained' },
}

function Records() {
  const defaultFilter = {
    search: '',
    non_digitized: false,
    collection: {},
    hidden: false,
    needs_review: false,
    filters: []
  }

  const createQuery = filter => {
    const { search, non_digitized, hidden, needs_review, collection = {} } = filter
    const query = {
      has_digital: non_digitized ? undefined : true,
      is_hidden: hidden ? undefined : false,
      needs_review: needs_review ? needs_review : undefined,
      collection_id: collection ? collection.collection_id : undefined,
      $sort: { title: 1 },
      $select: [
        'record_id',
        'title',
        'collection',
        'has_digital',
        'description',
        'primary_instance_thumbnail',
        'primary_instance_format_text'
      ]
    }
    if (search) {
      const $ilike = `%${search.replace(/ /g, '%')}%`
      query.$or = [
        { keywords_text: { $ilike } },
        { producers_text: { $ilike } },
        { title: { $ilike } },
        { description: { $ilike } },
        { record_id: parseInt(search, 10) || undefined },
        { call_numbers: { $contains: [search.toUpperCase()] } }
      ]
    }
    return query;
  }

  const renderItem = (record) => {
    return <>
      <ListItemAvatar>
        <Thumbnail
          src={record.has_digital ? `https://search.freedomarchives.org/images/thumbnails/${record.record_id}.jpg` : ''}
          alt={`${record.title} Thumbnail`}
          width={40}
        />
      </ListItemAvatar>
      <ListItemText
        primary={
          <Grid container justifyContent="space-between" style={{ flexWrap: 'inherit' }}>
            <Grid item>
              {record.title}
            </Grid>
            <Grid item>
              <Typography variant="body2">
                ID:&nbsp;{record.record_id}
              </Typography>
            </Grid>
          </Grid>
        }
        secondaryTypographyProps={{ component: 'div' }}
        secondary={
          <>
            <Grid container justifyContent="space-between" style={{ flexWrap: 'inherit' }}>
              <Grid item>
                <Typography variant="subtitle2" gutterBottom>
                  Collection: {record.collection.collection_name}
                </Typography>
              </Grid>
              {record.call_number && <Grid item>
                <Typography variant="body2">
                  CN:&nbsp;{record.call_number}
                </Typography>
              </Grid>}
            </Grid>

            <Typography
              style={{ maxHeight: 100, overflowX: 'auto' }}
              variant="body2"
              dangerouslySetInnerHTML={{
                __html: record.description,
              }}
            ></Typography>
          </>
        }
      ></ListItemText>
    </>;
  }

  return <Manage
    renderItem={renderItem}
    defaultFilter={defaultFilter}
    createQuery={createQuery}
    filterTypes={filter_types}
    service='record'
  />
}

export default Records;
