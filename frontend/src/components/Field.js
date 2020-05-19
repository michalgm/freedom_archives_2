import React from "react";
import { Field as FormikField, useFormikContext } from "formik";
import { TextField } from "@material-ui/core";
import { startCase } from "lodash";
import { Autocomplete, Alert } from "@material-ui/lab";

const Select = ({
  type,
  isMulti,
  ro,
  defaultValue,
  label,
  name,
  onChange,
  onBlur,
  loadOptions,
  setFieldValue,
  ...props
}) => {
  // console.log(defaultValue);

  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [value, setValue] = React.useState(defaultValue);

  // console.log(value, defaultValue, props)
  const [options, setOptions] = React.useState([]);
  const loading = Boolean(open && inputValue);

  React.useEffect(() => {
    let active = true;
    // console.log(inputValue)

    if (!loading) {
      return undefined;
    }

    (async () => {
      const response = await loadOptions(inputValue);
      if (active) {
        setOptions(response);
      }
    })();

    return () => {
      active = false;
    };
  }, [inputValue]);

  React.useEffect(() => {
    if (!open) {
      setOptions([]);
    }
  }, [open]);

  React.useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  return (
    <Autocomplete
      loading={loading}
      multiple={isMulti}
      open={open}
      onOpen={() => {
        setOpen(true);
      }}
      onClose={() => {
        setOpen(false);
      }}
      options={options}
      renderInput={(params) => (
        <TextField {...params} label={label} variant="outlined" />
      )}
      onChange={(_, option) => {
        if (onChange && onChange(_, option)) {
          setFieldValue(name, option);
        }
      }}
      onInputChange={(_, option) => {
        setInputValue(option);
      }}
      value={value}
      inputValue={inputValue}
      {...props}
    />
  );
};

const CustomComponent = ({
  type,
  ro,
  label,
  name,
  value,
  isMulti,
  loadOptions,
  ...props
}) => {
  const labelValue = (label || startCase(name)).replace("_value", "");
  const context = useFormikContext();
  let field;
  if (type === "select") {
    const { setFieldValue } = context;
    field = (
      <Select
        fullWidth
        className="select-input"
        variant="outlined"
        margin="dense"
        disabled={ro}
        label={labelValue}
        {...{
          isMulti,
          defaultValue: value || (isMulti ? [] : ""),
          value: value || (isMulti ? [] : ""),
          name,
          loadOptions,
          setFieldValue,
          ...props,
        }}
      />
    );
  } else {
    field = (
      <TextField
        variant={1 || ro ? "outlined" : "filled"}
        disabled={ro}
        margin="dense"
        label={labelValue}
        InputLabelProps={{ shrink: true }}
        autoComplete="off"
        inputProps={{ style: { color: "#000" } }}
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
