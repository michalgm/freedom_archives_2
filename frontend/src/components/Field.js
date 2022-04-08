import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  Radio,
  TextField,
} from '@mui/material';
import { Field as FormikField, useFormikContext } from 'formik';

import { Alert } from '@mui/material';
import { Autocomplete } from 'formik-mui';
import HTMLField from './HTMLField';
import React from 'react';
import SelectField from './SelectField';
import { startCase } from 'lodash';

const FieldComponent = ({
  type,
  ro,
  label,
  name,
  value,
  isMulti,
  autoSubmit,
  debounce,
  margin,
  customOnChange,
  onChange: defaultOnChange,
  raw,
  context,
  ...props
}) => {
  const labelValue = label === " " ? null : (label || startCase(name)).replace('_value', '');

  const { errors, setFieldValue } = context || {};

  const variant = props.variant || ro ? 'filled' : 'outlined'
  let field;

  props.onChange = React.useCallback(async (event, option) => {
    const { value, checked } = event.currentTarget
    const results = customOnChange && await customOnChange(event, option)
    if (results !== false) {
      const newValue = type === 'checkbox' ? checked : (option || value)
      if (['checkbox', 'radio'].includes(type)) {
        await defaultOnChange(event, option)
      } else {
        await setFieldValue(name, newValue)
      }
    }
    return results
  }, [name, setFieldValue, defaultOnChange, customOnChange, type])

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
              setFieldValue: setFieldValue,
              ...props
            }}
            variant={variant}
          />
        </FormGroup>
      </FormControl>
    );
  } else if (type === 'simpleSelect') {
    const { InputProps, ...selectProps } = props;
    field = (
      <FormControl disabled={ro} margin="dense" fullWidth>
        <FormGroup>
          <FormikField
            component={Autocomplete}
            fullWidth
            autoHighlight
            className="select-input"
            margin={margin || "dense"}
            disabled={ro}
            label={labelValue}
            variant={variant}
            componentsProps={{ paper: { sx: { width: 'max-content' } } }}
            renderInput={(params) => (
              <TextField
                {...params}
                name={name}
                InputLabelProps={{ ...params.InputLabelProps, shrink: true }}
                label={label}
                variant={props.variant || "outlined"}
                InputProps={{ ...params.InputProps, ...(props.InputProps || {}) }}
              />
            )}
            {...{
              defaultValue: value || null,
              value: value || null,
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
      {...{ name, value: value || '' }}
      {...props}
    />

  } else {
    let FieldComponent = TextField
    if (type === 'html') {
      FieldComponent = HTMLField
    }

    field = (
      <FieldComponent
        variant={variant}
        disabled={ro}
        margin={margin || "dense"}
        label={labelValue}
        InputLabelProps={{ shrink: true }}
        autoComplete="off"
        fullWidth
        type={type || 'text'}
        {...{ name, value: value || '' }}
        {...props}
      />
    );
  }

  const renderError = () => {
    if (errors && errors[name]) {
      const error = errors[name];
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

const ContextField = (props) => {
  const context = useFormikContext()
  return <FormikField as={FieldComponent} context={context} {...props} />
}

const Field = ({ raw, onChange: customOnChange, ...props }) => {
  if (raw) {
    return <FieldComponent ro raw {...props} />;
  }
  return <ContextField customOnChange={customOnChange} {...props} />
};

export default Field;
