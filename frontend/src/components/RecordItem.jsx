import {
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText
} from '@material-ui/core';

import {Link} from 'react-router-dom';
import React from 'react'
import Thumbnail from '../components/Thumbnail'

export default function RecordItem({record: {title, record_id, primary_instance_thumbnail, primary_instance_media_type, collection: {collection_name} = {}}, link, dense, action, ...props}) {
  const list_item_props = link ? {component: Link, to: `/records/${record_id}`, button: true} : {}
  if (!record_id) {
    return (
      <ListItem {...list_item_props} dense={dense} {...props}>
        <ListItemText
          primary="--"
        />
      </ListItem>
    )
  }
  return (
    <ListItem {...list_item_props} dense={dense} {...props}>
      <ListItemAvatar style={{minWidth: dense ? 35 : null}}>
        <Thumbnail
          src={primary_instance_thumbnail ? `https://search.freedomarchives.org/${primary_instance_thumbnail}.jpg` : ''}
          alt={`${title} Thumbnail`}
          width={dense ? 20 : 40}
        />
      </ListItemAvatar>
      <ListItemText
        primary={title}
        secondary={`[${primary_instance_media_type || 'No Media'}] Collection: ${collection_name}`}
      />
      {
        action &&
        <ListItemSecondaryAction>
          {action()}
        </ListItemSecondaryAction>
      }
    </ListItem>
  )
}
