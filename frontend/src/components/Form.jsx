import "./Form.scss";

import { Alert, AlertTitle, Button, Grid, Portal } from "@mui/material";
import { Formik, Form as FormikForm, useFormikContext } from "formik";
import React, { useState } from "react";

import ReactDOM from "react-dom";
import { useDebouncedCallback } from "use-debounce";

const FormButton = ({ label, onClick, ...props }) => {
  const { handleReset, handleSubmit, isValid } = useFormikContext();
  const click = (e) => {
    if (props.type === "reset") {
      handleReset(e);
    } else if (props.type === "submit") {
      e.preventDefault();
      handleSubmit(e);
    }
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };
  return (
    <Button variant="contained" size="medium" onClick={click} disabled={props.type === "submit" && !isValid} {...props}>
      {label}
    </Button>
  );
};

const HandleChangeComponent = ({ onChange, debounce = 0 }) => {
  const { values } = useFormikContext();
  const debouncedOnChange = useDebouncedCallback(onChange, debounce);
  React.useEffect(() => {
    debouncedOnChange(values);
  }, [values, debouncedOnChange]);
  return null;
};

const Errors = ({ errors }) => {
  const errors_list = Object.values(errors);
  if (!errors_list.length) {
    return;
  }
  return (
    <Alert severity="error" sx={{ mt: 1 }}>
      <AlertTitle variant="subtitle1">This form has errors</AlertTitle>
      <ul>
        {errors_list.map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
    </Alert>
  );
};

const Form = ({
  ro,
  children,
  onSubmit,
  initialValues,
  noUpdateCheck = false,
  buttons = [],
  buttonsBelow,
  buttonRef,
  onChange,
  debounce = 0,
  gridProps = {},
  ...props
}) => {
  const rows = React.Children.toArray(children);
  const [enableValidation, setEnableValidation] = useState(false);

  const renderButtons = (buttons) => {
    if (!buttons.length) {
      return null;
    }

    return (
      <Grid container className="buttons" spacing={1} justifyContent="flex-end">
        {buttons.map(({ ...props }, key) => (
          <Grid item key={key}>
            <FormButton {...props} />
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Formik
      enableReinitialize
      validateOnChange={enableValidation}
      validateOnBlur={enableValidation}
      onSubmit={(values) => {
        if (noUpdateCheck) {
          return onSubmit(values);
        }
        const updated = Object.keys(values).reduce((updated, key) => {
          if (values[key] !== initialValues[key]) {
            updated[key] = values[key];
          }
          return updated;
        }, {});
        // const updated = diff(initialValues, values);
        if (Object.keys(updated).length) {
          return onSubmit(updated);
        }
      }}
      initialValues={initialValues}
      {...props}
    >
      {({ errors }) => {
        if (Object.keys(errors).length > 0 && !enableValidation) {
          setEnableValidation(true);
        }
        return (
          <FormikForm className="form">
            {onChange && <HandleChangeComponent onChange={onChange} debounce={debounce} />}
            <Portal container={() => document.getElementById("form-errors")}>
              <Errors errors={errors} />
            </Portal>
            <Grid
              container
              style={{ textAlign: "left", height: "100%" }}
              spacing={2}
              className={`${ro ? "read-only" : ""}`}
              {...gridProps}
            >
              {!buttonsBelow && !buttonRef && renderButtons(buttons)}
              {rows.map((row) => (row.type && row.type.name === "FieldRow" ? React.cloneElement(row, { ro }) : row))}
              {buttonsBelow && !buttonRef && renderButtons(buttons)}
            </Grid>
            {buttonRef && ReactDOM.createPortal(renderButtons(buttons), buttonRef.current)}
          </FormikForm>
        );
      }}
    </Formik>
  );
};

export default Form;
