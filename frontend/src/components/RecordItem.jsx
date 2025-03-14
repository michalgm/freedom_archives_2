import { Add, Delete, KeyboardArrowDown, KeyboardArrowUp, Restore } from "@mui/icons-material";
import {
  Box,
  Divider,
  FormControl,
  Grid2,
  Icon,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { FieldArray, useFormikContext } from "formik";
import React, { useState } from "react";
import { Link as DOMLink, useNavigate } from "react-router-dom";

import { startCase } from "lodash-es";
import Field from "../components/Field";
import Thumbnail from "../components/Thumbnail";

export function RecordsList({ records, ...props }) {
  return <ItemsList type="record" items={records} {...props} />;
}

export function CollectionsList({ collections, ...props }) {
  return <ItemsList type="collection" items={collections} {...props} />;
}

export function EditableItem({ service, name, link = true, label }) {
  const { values, setFieldValue } = useFormikContext();
  const [edit, setEdit] = useState(false);
  const services = {
    records: {
      tag: RecordItem,
      itemName: "record",
    },
    collections: {
      tag: CollectionItem,
      itemName: "collection",
    },
  };
  if (!service) {
    return;
  }
  label = label ?? name;
  if (edit) {
    return (
      <Field
        name={name}
        type="select"
        searchType={`${service}`}
        size="small"
        label={label}
        autoFocus
        selectOnFocus
        excludeIds={[values.record_id]}
        onChange={async (_, item) => {
          if (item) {
            await setFieldValue(name, { ...item });
            await setEdit(false);
          }
        }}
      />
    );
  } else {
    const { tag: ItemTag, itemName } = services[service];
    const missingText = name === "parent" ? `Parent ${startCase(itemName)}` : "Collection";

    return (
      <FormControl variant="outlined" fullWidth size="small" margin="dense">
        <InputLabel sx={{ backgroundColor: "#fff" }} shrink>
          {startCase(label)}
        </InputLabel>
        <List
          sx={{
            width: "100%",
            border: "1px solid",
            borderRadius: 1,
            borderColor: "grey.400",
          }}
        >
          <ItemTag
            {...{ [itemName]: values[name] }}
            link={link}
            missingRecordText={`No ${missingText}`}
            action={() => (
              <IconButton
                onClick={() => {
                  setEdit(true);
                }}
                size="large"
              >
                <Icon>edit</Icon>
              </IconButton>
            )}
          />
        </List>
      </FormControl>
    );
  }
}

export function ItemsList({ items, type, emptyText, itemAction, link = true, ...props }) {
  const ItemTag = type === "record" ? RecordItem : CollectionItem;
  emptyText = emptyText || `No ${startCase(type)}s Found`;
  return (
    <List>
      {items.length === 0 && <Typography>{emptyText}</Typography>}
      {items.map((item, index) => (
        <React.Fragment key={item[`${type}_id`]}>
          <ItemTag
            itemAction={() => itemAction(index, item)}
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

export function EditableItemsList({ name, emptyText, reorder = false, type = "record", add }) {
  const [showAdd, setShowAdd] = useState(false);

  const { values, setFieldValue } = useFormikContext();
  return (
    <FieldArray
      name={name}
      render={({ push, move }) => {
        const items = values[name].map((item = {}, index) => {
          if (!item) {
            return null;
          }
          const actions = [
            <EditableItemsListAction
              key="remove"
              onClick={() => setFieldValue(`${name}[${index}].delete`, !item.delete)}
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
                disabled={index === values[name].length - 1}
                icon="KeyboardArrowDown"
              />
            );
          }
          item.action = () => (
            <Grid2 container direction="column">
              {actions}
            </Grid2>
          );
          return item;
        });

        const addLabel = `Add ${name}`;

        const addField = showAdd ? (
          <Field
            name={`__new_${name}`}
            label={addLabel}
            type="select"
            searchType={`${type}s`}
            size="small"
            clearOnChange
            managed
            excludeIds={[values[`${type}_id`], ...values[name].map((item) => item[`${type}_id`])]}
            onChange={(_, child) => {
              if (child) {
                push(child);
              }
            }}
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
            <IconButton onClick={() => setShowAdd(true)}>
              <Add />
            </IconButton>{" "}
            {addLabel}
          </>
        );
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
      }}
    />
  );
}

export default function RecordItem({ record = {}, description: showDescription, itemAction, ...props }) {
  const {
    title,
    record_id,
    primary_instance_thumbnail,
    primary_instance_format_text,
    collection: { collection_name, collection_id } = {},
    description,
  } = record;
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
      id={record_id}
      thumbnail={primary_instance_thumbnail}
      details={details}
      title={title}
      description={showDescription && description}
      {...props}
      type="record"
    />
  );
}

export function CollectionItem({ collection = {}, description: showDescription, itemAction, ...props }) {
  const { collection_name, collection_id, thumbnail, description, parent } = collection;
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
      thumbnail={thumbnail}
      title={collection_name}
      description={showDescription && description}
      details={details}
      {...props}
      type="collection"
    />
  );
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
  thumbnail,
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
      list_item_props.component = DOMLink;
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

  const thumbnail_source =
    type === "collection" ? `https://search.freedomarchives.org/${thumbnail}` : `/images/thumbnails/${id}.jpg`; // FIXME

  return (
    <ListItem {...props} dense={dense} disablePadding alignItems="flex-start">
      <Container {...list_item_props}>
        <ListItemAvatar style={{ minWidth: dense ? 35 : null }}>
          <Thumbnail src={thumbnail_source} alt={`${title} Thumbnail`} width={dense ? 20 : 40} />
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
