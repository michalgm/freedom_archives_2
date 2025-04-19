import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid2 } from "@mui/material";
import { createFilterOptions } from "@mui/material/useAutocomplete";
import { useFormikContext } from "formik";
import React, { useState } from "react";

import { list_items } from "../api";

import Field from "./Field";
import FieldRow from "./FieldRow";
import Form from "./Form";

const ListItemField = ({ name, disableNew, listType, isMulti, ...props }) => {
  const [open, toggleOpen] = React.useState(false);
  const [newValue, setNewValue] = React.useState("");

  const filter = createFilterOptions({ trim: true });
  const type = listType || name.replace(/s$/, "");

  const validateChange = (_, item) => {
    const lastItem = isMulti ? item && item[item.length - 1] : item;
    if (lastItem && lastItem.list_item_id === "new" && lastItem.item) {
      toggleOpen(true);
      setNewValue(lastItem.item.replace(/^Add "(.+)"$/, "$1"));
      return false;
    } else {
      return true;
    }
  };

  return (
    <>
      <Field
        name={name}
        type="select"
        isMulti={isMulti || false}
        searchType="list_items"
        searchParams={{ type }}
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
        onChange={(event, option) => {
          props.onChange && props.onChange(event, option);
          return validateChange(event, option);
        }}
        filterOptions={(options, params) => {
          const filtered = filter(options, params);
          if (
            !disableNew &&
            options.length &&
            params.inputValue !== "" &&
            !filtered.some(({ item }) => item.toLowerCase() === params.inputValue.toLowerCase())
          ) {
            filtered.push({
              value: params.inputValue,
              item: `Add "${params.inputValue}"`,
              list_item_id: `new`,
            });
          }
          return filtered;
        }}
        size="small"
        {...props}
      />
      <NewListItemDialog
        handleClose={() => {
          toggleOpen(false);
        }}
        initialValue={newValue}
        type={type}
        open={open}
      />
    </>
  );
};

export const NewListItemDialog = ({ initialValue, handleClose, open, type }) => {
  const [listItem, setListItem] = useState({});
  const { values, isValid, setFieldValue } = useFormikContext();
  React.useEffect(() => {
    setListItem({ [type]: initialValue });
  }, [initialValue, type]);

  const handleSubmit = async (updatedValues) => {
    const item = updatedValues[type];
    const result = await list_items.create({
      item,
      type,
    });
    const name = `${type}s`;
    await setFieldValue(name, [...values[name], result]);
    handleClose(result);
  };

  const validate = async (values) => {
    const item = values[type];

    const { data } = await list_items.find({
      query: {
        item,
        type,
      },
    });
    if (data.length) {
      return {
        [type]: `A ${type} called "${item}" already exists`,
      };
    }
    return {};
  };

  return (
    <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
      <Form
        initialValues={listItem}
        onSubmit={handleSubmit}
        ro={false}
        noUpdateCheck
        validate={validate}
        validateOnMount
      >
        <Grid2 size={12}>
          <DialogTitle id="form-dialog-title">Add a new {type}</DialogTitle>
          <DialogContent>
            <FieldRow>
              <Field name={type} />
            </FieldRow>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary">
              Cancel
            </Button>
            <Button disabled={!isValid} type="submit" color="primary">
              Add
            </Button>
          </DialogActions>
        </Grid2>
      </Form>
    </Dialog>
  );
};

export default ListItemField;
