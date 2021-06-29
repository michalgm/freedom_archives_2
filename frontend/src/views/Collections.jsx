import {
  Avatar,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@material-ui/core';

import { BrokenImage } from '@material-ui/icons';
import Manage from '../components/Manage';
import React from 'react';

const filter_types = {
  collection_name: {input: 'text', match: 'fuzzy'},
  call_number: {input: 'text', match: 'fuzzy'},
  description: {input: 'text', match: 'fuzzy'},
  summary: {input: 'text', match: 'fuzzy'},
  notes: {input: 'text', match: 'fuzzy'},
  publisher: {input: 'listitem', match: 'listitem_id'},
  'keywords': {input: 'listitem', match: 'listitem'},
  'subjects': {input: 'listitem', match: 'listitem'},
};

function Collections() {
  const defaultFilter = {
    hidden: false,
    filters: [],
    needs_review: '',
    search: ''
  }

  const createQuery = filter => {
    const {search, hidden, needs_review} = filter
    const query = {
      is_hidden: hidden ? undefined : false,
      needs_review: needs_review ? needs_review : undefined,
      $sort: { display_order: 1, collection_name: 1 },
      $select: [
        'collection_id',
        'collection_name',
        'description',
        'thumbnail',
        'parent'
      ]
    }
    if (search) {
      const $ilike = `%${search}%`
      query.$or = [
        {subjects_text: {$ilike}},
        {keywords_text: {$ilike}},
        {collection_name: {$ilike}},
        {description: {$ilike}},
        {collection_id: parseInt(search, 10) || undefined},
      ]
    }
    return query;
  }

  const renderItem = (collection) => {
    return (
      <>
      <ListItemAvatar>
        {collection.thumbnail ? (
          <img
            src={`https://search.freedomarchives.org/${collection.thumbnail}`}
            alt={`${collection.collection_name} Thumbnail`}
            width={40}
          />
        ) : (
          <Avatar>
            <BrokenImage />
          </Avatar>
        )}
      </ListItemAvatar>
      <ListItemText
        primary={collection.collection_name}
        secondaryTypographyProps={{ component: 'div' }}
        secondary={
          <>
            <Typography variant="subtitle2" gutterBottom>
              Parent Collection: {collection.parent.collection_name}
            </Typography>
            <Typography
              style={{ maxHeight: 100, overflowX: 'auto' }}
              variant="body2"
              dangerouslySetInnerHTML={{
                __html: collection.description,
              }}
            ></Typography>
          </>
        }
      ></ListItemText>
      </>
    )
  }

  return <Manage
    renderItem={renderItem}
    defaultFilter={defaultFilter}
    createQuery={createQuery}
    filterTypes={filter_types}
    service='collection'
  />
}

export default Collections;
