import { Alert, AlertTitle, Box } from "@mui/material";
import React, { useEffect } from "react";
import { FormContainer, useFormContext } from "react-hook-form-mui";
import { getFieldLabel } from "src/components/form/schemaUtils";
import { useFormManager } from "src/hooks/useFormManager";
import { flattenErrors } from "src/utils";

import { FormManagerContext } from "./FormManagerContext";
import { FormStateHandler } from "./FormStateHandler";
import { parseError } from "./schemaUtils";

export const FormErrors = ({ service, embedded = false }) => {
  const {
    formState: { errors },
  } = useFormContext();
  const [hideErrors, setHideErrors] = React.useState(false);

  useEffect(() => {
    setHideErrors(false);
  }, [errors]);
  const errorsMap = flattenErrors(errors);
  const errorCount = Object.entries(errorsMap).length;
  const errorMessages = Object.entries(errorsMap).reduce((acc, [field, error]) => {
    const label = getFieldLabel(field, service, true);
    const message = parseError(field, label)({ message: error });
    acc.push(<li key={field}>{message}</li>);
    return acc;
  }, []);
  if (errorMessages.length === 0 || hideErrors) return null;
  const props = embedded ? { elevation: 0, sx: { marginTop: 1 } } : { elevation: 2, sx: { marginBottom: 2 } };
  return (
    <Alert severity="error" {...props} onClose={() => setHideErrors(true)}>
      <AlertTitle sx={{ textAlign: "left" }}>
        {errorCount} error{errorCount > 1 ? "s" : ""} prevented this {service?.replace(/s$/, "")} from being saved
      </AlertTitle>
      <Box sx={{ textAlign: "left" }}>
        <ul style={{ margin: 0 }}>{errorMessages}</ul>
      </Box>
    </Alert>
  );
};

const BaseForm = ({ children, autoComplete = "off", formConfig, formID, ...props }) => {
  const formManager = useFormManager(formConfig);
  const { formContext, submitForm, shouldBlockNavigation } = formManager;
  const { errors } = formContext.formState;
  logger.log("BASE FORM RENDER", errors, formContext.getValues());

  const name = formID || formConfig?.service || "form";

  return (
    <FormManagerContext.Provider
      value={{
        formContext: formManager.formContext,
        formState: formManager.formState,
        loading: formManager.loading,
        onSave: formManager.submitForm,
        confirmDelete: formManager.confirmDelete,
        service: formManager.service,
        submitForm: formManager.submitForm,
        isLoading: formManager.isLoading,
      }}
    >
      <FormContainer
        onSuccess={submitForm}
        FormProps={{
          style: { height: "100%" },
          autoComplete,
          name,
          onKeyDown: (e) => {
            if (e.key === "Enter" && !["TEXTAREA"].includes(e.target.tagName)) {
              e.preventDefault();
            }
          },
          id: name,
          ...props,
        }}
        formContext={formContext}
      >
        <FormStateHandler shouldBlockNavigation={shouldBlockNavigation} />
        {typeof children === "function" ? children(formManager) : children}
      </FormContainer>
    </FormManagerContext.Provider>
  );
};

// This is to force state refresh on id change
const BaseFormWrapper = (props) => {
  const key = `${props.formConfig?.service}-${props.formConfig?.id || "new"}`;
  return (
    <React.Fragment key={key}>
      <BaseForm {...props} />
    </React.Fragment>
  );
};

export { BaseFormWrapper as BaseForm };
