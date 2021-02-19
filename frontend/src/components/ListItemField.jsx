import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
} from '@material-ui/core';
import React, {useState} from 'react';

import Field from './Field';
import FieldRow from './FieldRow';
import Form from './Form';
import {createFilterOptions} from '@material-ui/lab'
import { list_items } from '../api';
import { useFormikContext } from 'formik';

const ListItemField = ({name, listType, isMulti, ...props}) => {
  const [open, toggleOpen] = React.useState(false);
  const [newValue, setNewValue] = React.useState('');
  
  const filter = createFilterOptions();
  const type = listType || name.replace(/s$/, '');
  
  const validateChange = (_, item) => {
    const lastItem = isMulti ? item && item[item.length - 1] : item;
    if (lastItem && !lastItem.list_item_id && lastItem.item) {
      toggleOpen(true);
      setNewValue(lastItem.item.replace(/^Add "(.+)"$/, '$1'));
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
        validateChange={validateChange}
        filterOptions={(options, params) => {
          const filtered = filter(options, params)
          if (
            params.inputValue !== '' &&
            !filtered.some(({item}) => item.toLowerCase() === params.inputValue.toLowerCase())
          ) {
            filtered.push({
              value: params.inputValue,
              item: `Add "${params.inputValue}"`,
            });
          }
          return filtered
        }}
        size="small"
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

  const handleSubmit = async updatedValues => {
    const item = updatedValues[type];
    const result = await list_items.create({
      item,
      type,
    });
    const name = `${type}s`;
    setFieldValue(name, [...values[name], result]);
    handleClose(result);
  };

  const validate = async values => {
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
        </Grid>
      </Form>
    </Dialog>
  );
};

export default ListItemField;
