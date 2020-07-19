import React from 'react';
import { Field as FormikField, useFormikContext } from 'formik';
import {
  TextField,
  FormGroup,
  FormControl,
  FormControlLabel,
  Checkbox,
} from '@material-ui/core';
import { startCase } from 'lodash';
import { Alert } from '@material-ui/lab';
import SelectField from './SelectField';
// import { ConsoleTransportOptions } from 'winston/lib/winston/transports';

let submitTimeout;

const CustomComponent = ({
  type,
  ro,
  label,
  name,
  value,
  isMulti,
  autoSubmit,
  ...props
}) => {
  // console.log(props.onChange);
  const labelValue = (label || startCase(name)).replace('_value', '');
  const context = useFormikContext();
  let field;
  if (autoSubmit) {
    props.onChange = event => {
      context.handleChange(event);
      submitTimeout && clearTimeout(submitTimeout);
      submitTimeout = setTimeout(
        () => context.submitForm(event),
        autoSubmit === true ? 0 : autoSubmit
      );
    };
  }
  if (type === 'select') {
    const { setFieldValue } = context;
    field = (
      <SelectField
        fullWidth
        className="select-input"
        variant="outlined"
        margin="dense"
        disabled={ro}
        label={labelValue}
        {...{
          isMulti,
          defaultValue: value || (isMulti ? [] : ''),
          value: value || (isMulti ? [] : ''),
          name,
          setFieldValue,
          ...props,
        }}
      />
    );
  } else if (type === 'checkbox') {
    field = (
      <FormControl component="fieldset" disabled={ro}>
        <FormGroup>
          <FormControlLabel
            control={<Checkbox {...{ name, value }} {...props} />}
            label={labelValue}
          />
        </FormGroup>
      </FormControl>
    );
  } else {
    field = (
      <TextField
        variant={1 || ro ? 'outlined' : 'filled'}
        disabled={ro}
        margin="dense"
        label={labelValue}
        InputLabelProps={{ shrink: true }}
        autoComplete="off"
        inputProps={{ style: { color: '#000' } }}
        fullWidth
        {...{ name, value }}
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
