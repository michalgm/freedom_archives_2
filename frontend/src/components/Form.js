import React from 'react';
import ReactDOM from 'react-dom';
import { Formik, Form as FormikForm, useFormikContext } from 'formik';
import { Grid, Button } from '@material-ui/core';
import './Form.scss';

const FormButton = ({ label, onClick, ...props }) => {
  const { handleReset, handleSubmit } = useFormikContext();
  const click = e => {
    if (props.type === 'reset') {
      handleReset(e);
    } else if (props.type === 'submit') {
      e.preventDefault();
      handleSubmit(e);
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

const HandleChangeComponent = ({onChange}) => {
  const {values} = useFormikContext()
  React.useEffect(() => {
    onChange(values)
  }, [values, onChange])
  return null
}

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
  ...props
}) => {
  const rows = React.Children.toArray(children);

  const renderButtons = (buttons, handleReset) => {
    if (!buttons.length) {
      return null;
    }

    return (
      <Grid container className="buttons" spacing={1} justify="flex-end">
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
      onSubmit={values => {
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
        {onChange && <HandleChangeComponent onChange={onChange}/>}
        <Grid
          container
          style={{ textAlign: 'left' }}
          spacing={2}
          className={`${ro ? 'read-only' : ''}`}
        >
          {!buttonsBelow && !buttonRef && renderButtons(buttons)}
          {rows.map(row =>
            row.type && row.type.name === 'FieldRow'
              ? React.cloneElement(row, { ro })
              : row
          )}
          {buttonsBelow && !buttonRef && renderButtons(buttons)}
        </Grid>
        {buttonRef &&
          ReactDOM.createPortal(renderButtons(buttons), buttonRef.current)}
      </FormikForm>
    </Formik>
  );
};

export default Form;
