import React from "react";
import { Formik, Form as FormikForm, useFormikContext } from "formik";
import { Grid, Button } from "@material-ui/core";
import "./Form.scss";

const FormButton = ({ label, onClick, ...props }) => {
  const { handleReset } = useFormikContext();
  const click = (e) => {
    if (props.type === "reset") {
      handleReset(e);
    }
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };
  return (
    <Button variant="contained" size="medium" onClick={click} {...props}>
      {label}
    </Button>
  );
};

const Form = ({
  ro,
  children,
  onSubmit,
  initialValues,
  noUpdateCheck = false,
  buttons = [],
  ...props
}) => {
  const rows = React.Children.toArray(children);

  const renderButtons = (buttons, handleReset) => {
    if (!buttons.length) {
      return null;
    }

    return (
      <Grid item className="buttons" xs={12}>
        {buttons.map(({ ...props }, key) => (
          <FormButton key={key} {...props} />
        ))}
      </Grid>
    );
  };

  return (
    <Formik
      enableReinitialize
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
      <FormikForm className="form">
        <Grid container style={{ textAlign: "left" }} spacing={2} className={`${ro ? 'read-only' : ''}`}>
          {renderButtons(buttons)}
          {rows.map((row) =>
            row.type && row.type.name === "FieldRow"
              ? React.cloneElement(row, { ro })
              : row
          )}
        </Grid>
      </FormikForm>
    </Formik>
  );
};

export default Form;
