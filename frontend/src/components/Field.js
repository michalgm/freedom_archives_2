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

const selectOptions = {
  day: Array.from({ length: 32 }, (v, k) => ({ id: k || null, label: `${k || '??'}` })),
  month: ['??', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((label, index) => ({ id: index || null, label })),
  year: [{ id: null, label: '??' }, ...Array.from({ length: new Date().getFullYear() - 1900 }, (v, k) => ({ id: k + 1900, label: k + 1900 + "" }))],
  media_types: ['Audio', 'Webpage', 'Video', 'PDF'].map(id => ({ id, label: id })),

}

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
      const newValue = type === 'checkbox' ? checked : (option !== undefined ? option : value)
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
    let { InputProps, options, selectType, inputProps, ...selectProps } = props;

    if (!options) {
      options = selectOptions[selectType] || []
    }
    if (options[0] && options[0].id !== undefined) {
      value = options.find(o => o.id === value)
      selectProps.isOptionEqualToValue = (option, value) => {
        return option.id === value.id
      }
      selectProps.onChange = (event, value) => props.onChange(event, value.id)
    }

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
            options={options}
            renderInput={(params) => (
              <TextField
                {...params}
                name={name}
                InputLabelProps={{ ...params.InputLabelProps, shrink: true }}
                label={label}
                variant={props.variant || "outlined"}
                InputProps={{ ...params.InputProps, ...(InputProps || {}) }}
                inputProps={{ ...params.inputProps, ...(inputProps || {}) }}
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
