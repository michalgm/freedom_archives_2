import {
  Divider,
  Grid,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  Typography
} from '@material-ui/core';

import {Link as DOMLInk} from 'react-router-dom';
import Link from '../components/Link'
import React from 'react'
import Thumbnail from '../components/Thumbnail'

function RecordItemDetails({details, dense}) {
  return <Grid container alignItems="center" justify="flex-start" spacing={2} style={{marginTop: 0, marginBottom: 0}}>
    {
      details.reduce((acc, {label, type, link}) => {
        if (label) {
          const item = (
            <Grid key={type} item style={{paddingTop: 0, paddingBottom: 0}}>
              <Typography color="textSecondary" variant="caption">
                {type}:&nbsp;
                {
                  (dense || !link) ?
                    <b> {label} </b>
                    : <Link to={link}>
                      <b> {label} </b>
                    </Link>
                }
              </Typography>
            </Grid>
          )
          return acc === null ? [item] : [acc, <Divider key="divider" orientation="vertical" flexItem />, item]
        } else {
          return acc
        }
      }, null)
    }
  </Grid>
}

export default function RecordItem({record: {title, record_id, primary_instance_thumbnail, primary_instance_media_type, primary_instance_format_text, collection: {collection_name, collection_id} = {}}, link, dense, action, missingRecordText = "None", ...props}) {
  const list_item_props = link && record_id ? {component: DOMLInk, to: `/records/${record_id}`, button: true} : {}
  const details = [
    {type: 'Collection', label: collection_name, link: `/collections/${collection_id}`},
    {type: 'Format', label: primary_instance_format_text}
  ]

  return (
    <ListItem {...list_item_props} dense={dense} {...props}>
      {record_id && <ListItemAvatar style={{minWidth: dense ? 35 : null}}>
        <Thumbnail
          src={primary_instance_thumbnail ? `https://search.freedomarchives.org/${primary_instance_thumbnail}` : ''}
          alt={`${title} Thumbnail`}
          width={dense ? 20 : 40}
        />
      </ListItemAvatar>
      }
      <ListItemText
        disableTypography
        primary={
          record_id ? title : missingRecordText
        }
        secondary={<RecordItemDetails details={details} dense={dense} />}
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
