import { Add, Delete, KeyboardArrowDown, KeyboardArrowUp, Restore } from "@mui/icons-material";
import {
  Box,
  Button,
  Divider,
  Grid2,
  Icon,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { startCase } from "lodash-es";
import React, { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Link, useNavigate } from "react-router";

import { Field } from "./form/Field";
import Thumbnail from "./Thumbnail";

export function RecordsList({ records, ...props }) {
  // logger.log(records, props);
  return <ItemsList type="record" items={records} {...props} />;
}

export function CollectionsList({ collections, ...props }) {
  return <ItemsList type="collection" items={collections} {...props} />;
}

export function ItemsList({ items = [], type, emptyText, itemAction, link = true, ...props }) {
  const ItemTag = type === "record" ? RecordItem : CollectionItem;
  emptyText = emptyText || `No ${startCase(type)}s Found`;
  // logger.log(items);
  return (
    <List>
      {items.length === 0 && <Typography sx={{ p: 2, textAlign: "center" }}>{emptyText}</Typography>}
      {items.map((item, index) => (
        <React.Fragment key={item.id || item[`${type}_id`]}>
          <ItemTag
            itemAction={itemAction ? () => itemAction(index, item) : undefined}
            index={index}
            type={type}
            link={link}
            action={item.action}
            {...{ [type]: item }}
            {...props}
          />
          <Divider component="li" />
        </React.Fragment>
      ))}
    </List>
  );
}

const icons = {
  Delete,
  KeyboardArrowUp,
  KeyboardArrowDown,
  Restore,
};

function EditableItemsListAction({ icon, size = "small", ...props }) {
  const IconTag = icons[icon];
  return (
    <IconButton size={size} {...props}>
      <IconTag fontSize="inherit" />
    </IconButton>
  );
}

export function EditableItemsListBase({
  name,
  emptyText,
  reorder = false,
  type = "record",
  add,
  fields,
  append,
  move,
  update,
}) {
  const [showAdd, setShowAdd] = useState(false);
  const { getValues } = useFormContext();

  const items = fields.map((item = {}, index) => {
    if (!item) {
      return null;
    }
    // logger.log(getValues(`${name}[${index}]`));
    const actions = [
      <EditableItemsListAction
        key="remove"
        onClick={() =>
          update(index, {
            ...item,
            delete: !item.delete,
          })
        }
        // disabled={index === 0}
        icon={item.delete ? "Restore" : "Delete"}
        size={reorder ? "small" : "large"}
      />,
    ];
    if (reorder) {
      actions.unshift(
        <EditableItemsListAction
          key="up"
          onClick={() => move(index, index - 1)}
          disabled={index === 0}
          icon="KeyboardArrowUp"
        />
      );
      actions.push(
        <EditableItemsListAction
          key="down"
          onClick={() => move(index, index + 1)}
          disabled={index === getValues(name).length - 1}
          icon="KeyboardArrowDown"
        />
      );
    }
    item.action = () => (
      <Grid2 container direction="column">
        {actions}
      </Grid2>
    );
    // logger.log(item);
    return item;
  });
  // logger.log("???", name, items);
  const addLabel = `Add ${name}`;

  const addField = showAdd ? (
    <Field
      name={`__new_${name}`}
      label={addLabel}
      field_type="select"
      service={`${type}s`}
      size="small"
      clearOnChange
      highlightDirty={false}
      managed
      excludeIds={[getValues(`${type}_id`), ...getValues(name).map((item) => item[`${type}_id`])]}
      onChange={(child) => {
        if (child) {
          append(child);
        }
      }}
      clearOnSelect
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Add />
          </InputAdornment>
        ),
      }}
    />
  ) : (
    <>
      <Button onClick={() => setShowAdd(true)} startIcon={<Add />}>
        {addLabel}
      </Button>{" "}
    </>
  );
  // logger.log("???", name, items, type);

  return (
    <>
      {add && addField}
      {type === "record" ? (
        <RecordsList records={items} emptyText={emptyText} />
      ) : (
        <CollectionsList collections={items} emptyText={emptyText} />
      )}
    </>
  );
}
export function EditableItemsList({ name, emptyText, reorder = false, type = "record", add }) {
  const { fields, append, move, prepend, update } = useFieldArray({
    name, // unique name for your Field Array
  });
  return <EditableItemsListBase {...{ name, emptyText, reorder, type, add, fields, append, move, prepend, update }} />;
  // logger.log(fields, name);
}

function RecordItemDetails({ details, dense }) {
  const navigate = useNavigate();
  const navigateTo = (link) => (e) => {
    e.preventDefault();
    navigate(link);
  };
  const items = details.reduce((acc, { label, type, link }) => {
    if (label) {
      const item = (
        <Grid2 key={type} style={{ paddingTop: 0, paddingBottom: 0 }}>
          <Typography color="textSecondary" variant="caption">
            {type}:&nbsp;
            <b> {label} </b>
            {link && !dense && (
              <Icon onClick={navigateTo(link)} color="primary" style={{ fontSize: "inherit" }}>
                launch
              </Icon>
            )}
          </Typography>
        </Grid2>
      );
      // return acc === null ? [item] : [acc, item]
      return [...acc, item];
    } else {
      return acc;
    }
  }, []);

  return (
    <Stack direction="row" divider={<Divider orientation="vertical" flexItem />} spacing={1}>
      {items}
    </Stack>
  );
}

export function Item({
  id,
  type,
  item,
  details = [],
  title,
  description,
  link,
  dense,
  action,
  missingRecordText = "None",
  index,
  onClick: onClickHandler,
  ...props
}) {
  const list_item_props = {
    sx: {
      display: "flex",
      // px: 1,
      // py: 0,
      ".MuiListItemText-root": {
        // margin: 0,
      },
    },
  };
  let Container = Box;

  if ((link && id) || onClickHandler) {
    if (link && id) {
      list_item_props.component = Link;
      list_item_props.to = `/${type}s/${id}`;
    }
    if (onClickHandler) {
      list_item_props.onClick = (e) => onClickHandler(index, e);
    }
    list_item_props.alignItems = "flex-start";
    list_item_props.dense = dense;
    Container = ListItemButton;
  } else {
    list_item_props.sx = { display: "flex", px: 2, py: 1 };
  }
  if (action) {
    props.secondaryAction = action();
  }

  return (
    <ListItem {...props} dense={dense} disablePadding alignItems="flex-start">
      <Container {...list_item_props}>
        <ListItemAvatar style={{ minWidth: dense ? 35 : null }}>
          <Thumbnail item={item} width={dense ? 20 : 40} />
        </ListItemAvatar>
        <ListItemText
          disableTypography
          primary={id ? title : missingRecordText}
          secondary={
            <>
              <RecordItemDetails details={details} dense={dense} />
              {description && (
                <Typography
                  variant="body2"
                  color="textSecondary"
                  style={{
                    marginTop: 4.9,
                    maxHeight: 100,
                    // overflowX: "auto"
                    overflow: "hidden",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: description,
                  }}
                />
              )}
            </>
          }
        />
      </Container>

      {/* {action && <ListItemSecondaryAction>{action()}</ListItemSecondaryAction>} */}
    </ListItem>
  );
}

export default function RecordItem({ record = {}, description: showDescription, itemAction, ...props }) {
  const {
    title,
    record_id,
    primary_instance_format_text,
    collection: { collection_name, collection_id } = {},
    description,
  } = record || {};
  const details = [
    {
      type: "Collection",
      label: collection_name,
      link: `/collections/${collection_id}`,
    },
    { type: "Format", label: primary_instance_format_text },
  ];
  if (itemAction) {
    props.onClick = () => itemAction(record);
  }
  return (
    <Item
      item={record}
      id={record_id}
      details={details}
      title={title}
      description={showDescription && description}
      {...props}
      type="record"
    />
  );
}

export function CollectionItem({ collection = {}, description: showDescription, itemAction, ...props }) {
  const { collection_name, collection_id, summary, parent } = collection;
  const details =
    parent && parent.collection_id
      ? [
          {
            type: "Parent Collection",
            label: parent.collection_name,
            link: `/collections/${parent.collection_id}`,
          },
        ]
      : [];
  if (itemAction) {
    props.onClick = () => itemAction(collection);
  }
  return (
    <Item
      id={collection_id}
      item={collection}
      title={collection_name}
      description={showDescription && summary}
      details={details}
      {...props}
      type="collection"
    />
  );
}
