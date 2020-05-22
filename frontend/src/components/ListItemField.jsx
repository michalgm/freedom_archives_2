import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  DialogActions,
  Grid,
} from "@material-ui/core";
// import { createFilterOptions } from "@material-ui/lab";

import Form from "./Form";
import FieldRow from "./FieldRow";
import Field from "./Field";
import { list_items } from "../api";
import { useFormikContext } from "formik";

const ListItemField = ({ name, ...props }) => {
  const [open, toggleOpen] = React.useState(false);
  const [newValue, setNewValue] = React.useState("");

  // const filter = createFilterOptions();
  const type = name.replace(/s$/, "");

  const fetchItems = (type) => async (value) => {
    const { data } = await list_items.find({
      query: {
        type,
        $select: ["list_item_id", "item"],
        item: { $ilike: `%${value}%` },
      },
    });
    return data;
  };

  const onChange = (_, item) => {
    const lastItem = item[item.length - 1];
    if (lastItem && !lastItem.list_item_id) {
      toggleOpen(true);
      setNewValue(lastItem.item.replace(/^Add "(.+)"$/, "$1"));
    } else {
      return true;
    }
  };
  return (
    <>
      <Field
        name={name}
        type="select"
        getOptionLabel={(item) => item.item}
        loadOptions={async (value) => await fetchItems(type)(value)}
        getOptionSelected={(option, value) =>
          option.list_item_id === value.list_item_id
        }
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
        filterSelectedOptions
        onChange={onChange}
        filterOptions={(options, params) => {
          if (
            params.inputValue !== "" &&
            !options.find((o) => o.item === params.inputValue)
          ) {
            options.push({
              value: params.inputValue,
              item: `Add "${params.inputValue}"`,
            });
          }
          return options;
        }}
        {...props}
      />
      <NewListItemDialog
        handleClose={(...args) => {
          toggleOpen(false);
        }}
        initialValue={newValue}
        type={type}
        open={open}
      />
    </>
  );
};

export const NewListItemDialog = ({
  initialValue,
  handleClose,
  open,
  type,
  ...props
}) => {
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
    setFieldValue(name, [...values[name], result]);
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
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="form-dialog-title"
    >
      <Form
        initialValues={listItem}
        onSubmit={handleSubmit}
        ro={false}
        noUpdateCheck
        validate={validate}
        validateOnMount
      >
        <Grid item xs={12}>
          <DialogTitle id="form-dialog-title">Add a new {type}</DialogTitle>
        </Grid>
        <DialogContent>
          <FieldRow>
            <Field name={type} />
          </FieldRow>
        </DialogContent>
        <Grid item xs={12}>
          <DialogActions>
            <Button onClick={handleClose} color="primary">
              Cancel
            </Button>
            <Button disabled={!isValid} type="submit" color="primary">
              Add
            </Button>
          </DialogActions>
        </Grid>
      </Form>
    </Dialog>
  );
};

export default ListItemField;
