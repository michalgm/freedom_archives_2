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
import HTMLField from './HTMLField';
import React from 'react';
import SelectField from './SelectField';
import {startCase} from 'lodash';

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
  margin,
  ...props
}) => {
  const labelValue = (label || startCase(name)).replace('_value', '');
  const context = useFormikContext();
  const {setFieldValue} = context;

  const variant = props.variant || ro ? 'filled' : 'outlined'
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
              setFieldValue,
              ...props,
            }}
            variant={variant}
          />
        </FormGroup>
      </FormControl>
    );
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
    field = <HTMLField {...{ name, value, setFieldValue }} {...props} />;
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
