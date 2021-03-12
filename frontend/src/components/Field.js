import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  Radio,
  TextField,
} from '@material-ui/core';
import {Field as FormikField, useFormikContext} from 'formik';

import { Alert } from '@material-ui/lab';
import {Autocomplete} from '@material-ui/lab';
import HTMLField from './HTMLField';
import React from 'react';
import SelectField from './SelectField';
import {startCase} from 'lodash';

const CustomComponent = ({
  type,
  ro,
  label,
  name,
  value,
  isMulti,
  autoSubmit,
  debounce,
  margin,
  ...props
}) => {
  const labelValue = label === " " ? null : (label || startCase(name)).replace('_value', '');
  const context = useFormikContext();

  const variant = props.variant || ro ? 'filled' : 'outlined'
  let field;

  if (type === 'select') {
    field = (
      <FormControl disabled={ro} margin="dense" fullWidth>
        <FormGroup>
          <SelectField
            fullWidth
            className="select-input"
            margin={margin || "dense"}
            disabled={ro}
            label={labelValue}
            {...{
              isMulti,
              defaultValue: value || (isMulti ? [] : ''),
              value: value || (isMulti ? [] : ''),
              name,
              setFieldValue: context.setFieldValue,
              ...props,
            }}
            variant={variant}
          />
        </FormGroup>
      </FormControl>
    );
  } else if (type === 'simpleSelect') {
    const {onChange, ...selectProps} = props;
    field = (
      <FormControl disabled={ro} margin="dense" fullWidth>
        <FormGroup>
          <Autocomplete
            fullWidth
            autoHighlight
            blurOnSelect
            className="select-input"
            margin={margin || "dense"}
            disabled={ro}
            label={labelValue}
            variant={variant}
            renderInput={(params) => (
              <TextField
                {...params}
                InputLabelProps={{shrink: true}}
                label={label}
                variant={props.variant || "outlined"}
                {...props.inputProps}
              />
            )}
            onChange={(event, option) => {
              context.setFieldValue(name, option);
              props.onChange && props.onChange(event, option);
            }}
            {...{
              defaultValue: value || '',
              value: value || '',
              name,
              ...selectProps
            }}
          />
        </FormGroup>
      </FormControl>
    )
  } else if (type === 'checkbox') {
    field = (
      <FormControl
        component="fieldset"
        disabled={ro}
        margin={margin || "dense"}
      >
        <FormGroup>
          <FormControlLabel
            control={<Checkbox {...{ name, value }} {...props} />}
            label={labelValue}
            variant={variant}
          />
        </FormGroup>
      </FormControl>
    );
  } else if (type === 'radio') {
    field = <Radio
      disabled={ro}
      {...{name, value: value || ''}}
      {...props}
    />
  } else if (type === 'html') {
    field = <HTMLField {...{name, value, setFieldValue: context.setFieldValue}} {...props} />;
  } else {
    field = (
      <TextField
        variant={variant}
        disabled={ro}
        margin={margin || "dense"}
        label={labelValue}
        InputLabelProps={{ shrink: true }}
        autoComplete="off"
        inputProps={{ style: { color: '#000' } }}
        fullWidth
        type={type || 'text'}
        {...{ name, value: value || '' }}
        {...props}
      />
    );
  }

  const renderError = () => {
    if (context && context.errors && context.errors[name]) {
      const error = context.errors[name];
      return <Alert severity="error">{error}</Alert>;
    }
  };
  return (
    <>
      {field}
      {renderError()}
    </>
  );
};

const Field = ({ raw, ...props }) => {
  if (raw) {
    return CustomComponent({ ro: true, ...props });
  }
  return <FormikField as={CustomComponent} {...props} />;
};

export default Field;
