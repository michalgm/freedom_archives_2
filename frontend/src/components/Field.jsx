import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import { Field as FormikField, useFormikContext } from "formik";

import { DatePicker, DateTimePicker } from "@mui/x-date-pickers";
import { Autocomplete } from "formik-mui";
import { startCase } from "lodash-es";
import React from "react";
import DateStringField from "./DateStringField";
import SelectField from "./SelectField";
import { EditableItem } from "./form/EditableItem";

const selectOptions = {
  day: Array.from({ length: 32 }, (v, k) => ({
    id: k || null,
    label: `${k || "??"}`,
  })),
  month: ["??", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
    (label, index) => ({ id: index || null, label })
  ),
  year: [
    { id: null, label: "??" },
    ...Array.from({ length: new Date().getFullYear() - 1900 }, (v, k) => ({
      id: k + 1900,
      label: k + 1900 + "",
    })),
  ],
  media_types: ["Audio", "Webpage", "Video", "PDF"].map((id) => ({
    id,
    label: id,
  })),
};

export const formatLabel = (label) => {
  return startCase(label)
    .replace("_value", "")
    .replace(/\bid\b/i, "ID");
};

const FieldComponent = ({
  type,
  ro,
  label,
  name,
  value,
  isMulti,
  // autoSubmit,
  // debounce,
  margin,
  customOnChange,
  onChange: defaultOnChange,
  // raw,
  context,
  helperText = "",
  fullWidth = true,
  ...props
}) => {
  const labelValue = formatLabel(label ?? name);
  const { errors, setFieldValue } = context || {};
  const variant = props.variant || ro ? "filled" : "outlined";
  let field;
  delete props.raw;
  const error = Boolean(errors?.[name]);
  helperText += error ? errors[name] : "";
  // const style = {
  //   backgroundColor: "secondary.main",
  // };
  props.onChange = React.useCallback(
    async (event, option) => {
      const { value, checked } = event?.currentTarget ? event.currentTarget : { value: event };
      const results = customOnChange && (await customOnChange(event, option));
      if (results !== false) {
        const newValue =
          type === "checkbox"
            ? checked
            : option !== undefined && option?.validationError === undefined
              ? option
              : value;
        if (["checkbox", "radio"].includes(type)) {
          await defaultOnChange(event, option);
        } else {
          await setFieldValue(name, newValue);
        }
      }
      return results;
    },
    [name, setFieldValue, defaultOnChange, customOnChange, type]
  );

  if (type === "select") {
    field = (
      <FormControl disabled={ro} margin="dense" fullWidth={fullWidth}>
        <FormGroup>
          <SelectField
            fullWidth={fullWidth}
            className="select-input"
            margin={margin || "dense"}
            disabled={ro}
            label={labelValue}
            error={error}
            {...{
              isMulti,
              defaultValue: value || (isMulti ? [] : ""),
              value: value || (isMulti ? [] : ""),
              name,
              setFieldValue: setFieldValue,
              helperText,
              ...props,
            }}
            variant={variant}
          />
        </FormGroup>
      </FormControl>
    );
  } else if (type === "simpleSelect") {
    const { InputProps, selectType, inputProps, ...selectProps } = props;
    let { options } = props;
    if (!options) {
      options = selectOptions[selectType] || [];
    }
    if (options[0] && options[0].id !== undefined) {
      value = options.find((o) => o.id === value);
      selectProps.isOptionEqualToValue = (option, value) => {
        return option.id === value.id;
      };
      selectProps.onChange = (event, value) => props.onChange(event, value.id);
    }

    field = (
      <FormControl disabled={ro} margin="dense" fullWidth={fullWidth}>
        <FormGroup>
          <FormikField
            component={Autocomplete}
            fullWidth={fullWidth}
            autoHighlight
            className="select-input"
            margin={margin || "dense"}
            disabled={ro}
            label={labelValue}
            variant={variant}
            componentsProps={{ paper: { sx: { width: "max-content" } } }}
            options={options}
            renderInput={(params) => (
              <TextField
                {...{ helperText, error, ...params }}
                name={name}
                label={label}
                variant={props.variant || "outlined"}
                slotProps={{
                  input: {
                    ...params.InputProps,
                    ...(InputProps || {}),
                  },

                  htmlInput: { ...params.inputProps, ...(inputProps || {}) },
                  inputLabel: { ...params.InputLabelProps, shrink: true },
                }}
              />
            )}
            {...{
              defaultValue: value || null,
              value: value || null,
              name,
              ...selectProps,
            }}
          />
        </FormGroup>
      </FormControl>
    );
  } else if (type === "datestring") {
    field = (
      <DateStringField
        variant={variant}
        disabled={ro}
        margin={margin || "dense"}
        label={labelValue}
        value={value || ""}
        name={name}
        error={error}
        helperText={helperText}
        {...props}
      />
    );
  } else if (type === "checkbox") {
    field = (
      <FormControl component="fieldset" disabled={ro} margin={"dense"} error={error}>
        <FormGroup>
          <FormControlLabel
            control={<Checkbox {...{ name, value }} {...props} />}
            label={labelValue}
            variant={variant}
          />
        </FormGroup>
        <FormHelperText>{helperText}</FormHelperText>
      </FormControl>
    );
  } else if (type === "radio") {
    field = <Radio disabled={ro} {...{ name, value: value || "" }} {...props} />;
  } else if (type === "radiogroup") {
    const { options, ...radioProps } = props;
    field = (
      <FormControl margin="dense" disabled={ro} error={error}>
        <FormLabel>{labelValue}</FormLabel>
        <RadioGroup name={name} value={value || ""} row {...radioProps}>
          {options.map((option) => (
            <FormControlLabel key={option.value} control={<Radio />} {...option} />
          ))}
        </RadioGroup>
      </FormControl>
    );
  } else if (type === "date" || type === "datetime") {
    const Component = type === "date" ? DatePicker : DateTimePicker;
    const views = ["year", "month", "day"];
    if (type === "datetime") {
      views.push("hours", "minutes");
    }
    field = (
      <Component
        disabled={ro}
        label={labelValue}
        InputLabelProps={{ shrink: true }}
        value={value || null}
        name={name}
        error={error}
        views={views}
        helperText={helperText}
        {...props}
        onChange={(value) => props.onChange({ currentTarget: { value } })}
        slotProps={{
          textField: {
            fullWidth,
            color: "primary",
            margin: margin || "dense",
            clearable: true,
            variant: variant,
            InputProps: props.InputProps || {},

            // sx: props.sx || {},
          },
        }}
      />
    );
  } else if (type === "editableItem") {
    field = (
      <EditableItem
        name={name}
        value={value || ""}
        label={labelValue}
        error={error}
        helperText={helperText}
        {...props}
      />
    );
  } else {
    // if (type === "html") {
    //   FieldComponent = HTMLField;
    //   props.setFieldValue = setFieldValue;
    // }
    field = (
      <TextField
        variant={variant}
        disabled={ro}
        margin={margin || "dense"}
        label={labelValue}
        slotProps={{
          inputLabel: {
            shrink: true,
          },
        }}
        autoComplete="off"
        fullWidth={fullWidth}
        type={type || "text"}
        {...{
          error,
          name,
          helperText,
          value: value || "",
          minRows: !props.rows && props.multiline ? 2 : null,
        }}
        {...props}
      />
    );
  }

  return field;
};

const ContextField = (props) => {
  const context = useFormikContext();
  return <FormikField as={FieldComponent} context={context} {...props} />;
};

const Field = ({ raw, onChange: customOnChange, ...props }) => {
  if (raw) {
    return <FieldComponent ro raw {...props} />;
  }
  return <ContextField customOnChange={customOnChange} {...props} />;
};

export default Field;
