import React from 'react';
import { Field as FormikField, useFormikContext } from 'formik';
import {
  TextField,
} from '@material-ui/core';
import { startCase } from 'lodash';
// import { MultipleSelect } from "react-select-material-ui";
import Async from 'react-select/async';
import { app } from '../api';

const fetchItems = type => async value => {
  const { data } = await app
    .service('list_items')
    .find({
      query: {
        type,
        $select: ['list_item_id', 'item'],
        item: { $ilike: `${value}%` }
      }
    });
  return data;
}

const CustomComponent = ({ type, ro, label, name, value, ...props }) => {
  const labelValue = (label || startCase(name)).replace('_value', '');
  const context = useFormikContext();

  if (type === 'select') {
    const { setFieldValue } = context;
    return <TextField
      fullWidth
      className='select-input'
      variant="outlined"
      margin='dense'
      InputLabelProps={{ shrink: true }}
      disabled={ro}

      label={labelValue}
      InputProps={{
        inputComponent: Async
      }}
      inputProps={
        {
          defaultValue: value,
          isDisabled: ro,
          name,
          value,
          ...props,
          onChange: (option) => setFieldValue(name, option)
        }
      }
    />
  }
  return <TextField
    variant={1 || ro ? 'outlined' : 'filled'}
    disabled={ro}
    margin='dense'
    label={labelValue}
    InputLabelProps={{ shrink: true }}
    inputProps={{ style: { color: '#000' } }}
    fullWidth
    {...{ name, value }}
    {...props}
  // onChange={(option) => setFieldValue(name, option)}

  />
};


const Field = ({ raw, ...props }) => {
  if (raw) {
    // console.log(props)
    // return <div>!!!{props.label} {props.value}</div>;
    return CustomComponent({ ro: true, ...props });
  }
  return (
    <FormikField as={CustomComponent} {...props} />
  );
};


export const ListItemField = ({ name, ...props }) => {
  return <Field
    name={name}
    type='select'
    getOptionLabel={item => item.item}
    getOptionValue={item => item.list_item_id}
    loadOptions={fetchItems(name.replace(/s$/, ''))}
    {...props}
  />
}

export default Field;
