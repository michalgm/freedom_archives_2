import { Link as DOMLink, useNavigate } from 'react-router-dom';
import {
  Divider,
  Grid,
  Icon,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  Typography
} from '@mui/material';
import React, { useState } from 'react'

import Field from "../components/Field";
import Thumbnail from '../components/Thumbnail'
import { startCase } from 'lodash';
import { useFormikContext } from "formik";

export function RecordsList({ records, ...props }) {
  return <ItemsList type='record' items={records} {...props} />
}

export function CollectionsList({ collections, ...props }) {
  return <ItemsList type='collection' items={collections} {...props} />
}

export function EditableItem({ service, name }) {
  const { values, setFieldValue } = useFormikContext();
  const [edit, setEdit] = useState(false);
  const services = {
    records: {
      tag: RecordItem,
      itemName: 'record'
    },
    collections: {
      tag: CollectionItem,
      itemName: 'collection'
    },

  }

  if (edit) {
    return <Field
      name={name}
      type="select"
      searchType={`${service}`}
      size="small"
      label=" "
      autoFocus
      selectOnFocus
      excludeIds={[values.record_id]}
      onChange={(_, item) => {
        if (item) {
          setFieldValue(name, { ...item });
          setEdit(false)
        }
      }}
    />
  } else {
    const missingText = name === 'parent' ? 'Parent Record' : 'Collection'
    const { tag: ItemTag, itemName } = services[service]

    return (
      <List>
        <ItemTag {...{ [itemName]: values[name] }} link missingRecordText={`No ${missingText}`} action={() => (<IconButton onClick={() => { setEdit(true) }} size="large">
          <Icon>edit</Icon>
        </IconButton>)} />
      </List>
    );
  }
}

export function ItemsList({ items, type, emptyText, index, ...props }) {
  const ItemTag = type === 'record' ? RecordItem : CollectionItem;
  emptyText = emptyText || `No ${startCase(type)}s Found`
  return (<List>
    {items.length === 0 && (
      <Typography>
        {emptyText}
      </Typography>
    )}
    {
      items.map((item, index) => (
        <React.Fragment key={item[`${type}_id`]}>
          <ItemTag
            action={item.action}
            index={index}
            type={type}
            link
            {...{ [type]: item }}
            {...props}
          />
          <Divider component="li" />
        </React.Fragment>
      ))
    }
  </List>)
}

export default function RecordItem({ record: { title, record_id, primary_instance_thumbnail, primary_instance_format_text, collection: { collection_name, collection_id } = {}, description } = {}, description: showDescription, ...props }) {
  const details = [
    { type: 'Collection', label: collection_name, link: `/collections/${collection_id}` },
    { type: 'Format', label: primary_instance_format_text }
  ]
  return <Item id={record_id} thumbnail={primary_instance_thumbnail} details={details} title={title} description={showDescription && description} {...props} type='record' />
}

export function CollectionItem({ collection: { collection_name, collection_id, thumbnail, description, parent } = {}, description: showDescription, ...props }) {
  const details = parent && parent.collection_id ? [
    { type: 'Parent Collection', label: parent.collection_name, link: `/collections/${parent.collection_id}` },
  ] : []

  return <Item id={collection_id} thumbnail={thumbnail} title={collection_name} description={showDescription && description} details={details} {...props} type='collection' />
}

function RecordItemDetails({ details, dense }) {
  const navigate = useNavigate();
  const navigateTo = link => (e) => {
    e.preventDefault()
    navigate(link);
  }
  return (
    <Grid container alignItems="center" justifyContent="flex-start" spacing={2} style={{ marginTop: 0, marginBottom: 0 }}>
      {
        details.reduce((acc, { label, type, link }) => {
          if (label) {
            const item = (
              <Grid key={type} item style={{ paddingTop: 0, paddingBottom: 0 }}>
                <Typography color="textSecondary" variant="caption">
                  {type}:&nbsp;
                  <b> {label} </b>
                  {
                    link && !dense && <Icon onClick={navigateTo(link)} color="primary" style={{ fontSize: 'inherit' }} >launch</Icon>
                  }
                </Typography>
              </Grid>
            )
            return acc === null ? [item] : [acc, <Divider key="divider" orientation="vertical" sx={{ marginLeft: 2 }} flexItem />, item]
          } else {
            return acc
          }
        }, null)
      }
    </Grid>
  );
}

export function Item({ id, type, thumbnail, details = [], title, description, link, dense, action, missingRecordText = "None", index, onClick: onClickHandler, ...props }) {
  const list_item_props = link && id ? { component: DOMLink, to: `/${type}s/${id}`, button: true } : {}
  const onClick = onClickHandler ? (event) => {
    onClickHandler(index, event)
  } : null

  return (
    <ListItem {...list_item_props} alignItems="flex-start" dense={dense} onClick={onClick} {...props}>
      {id && <ListItemAvatar style={{ minWidth: dense ? 35 : null }}>
        <Thumbnail
          src={thumbnail ? `https://search.freedomarchives.org/${thumbnail}` : ''}
          alt={`${title} Thumbnail`}
          width={dense ? 20 : 40}
        />
      </ListItemAvatar>
      }
      <ListItemText
        disableTypography
        primary={
          id ? title : missingRecordText
        }
        secondary={
          <>
            <RecordItemDetails details={details} dense={dense} />
            {
              description && <Typography
                variant="body2"
                color="textSecondary"
                style={{ marginTop: 4.9, maxHeight: 100, overflowX: 'auto' }}
                dangerouslySetInnerHTML={{
                  __html: description,
                }}
              />
            }
          </>
        }
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
