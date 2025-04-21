import { Alert } from "@mui/material";
import React, { useEffect } from "react";
import { FormContainer } from "react-hook-form-mui";
import { getFieldLabel } from "src/components/form/schemaUtils";
import { useFormManager } from "src/hooks/useFormManager";
import { flattenErrors } from "src/utils";

import { FormManagerContext } from "./FormManagerContext";
import { FormStateHandler } from "./FormStateHandler";
import { parseError } from "./schemaUtils";

export const FormErrors = ({ errors, service }) => {
  const [hideErrors, setHideErrors] = React.useState(false);

  useEffect(() => {
    setHideErrors(false);
  }, [errors]);
  const errorsMap = flattenErrors(errors);
  const errorMessages = Object.entries(errorsMap).reduce((acc, [field, error]) => {
    const label = getFieldLabel(field, service);
    const message = parseError(field, label)({ message: error });
    acc.push(<li key={field}>{message}</li>);
    return acc;
  }, []);
  if (errorMessages.length === 0 || hideErrors) return null;

  return (
    <Alert severity="error" elevation={2} sx={{ marginBottom: 2 }} onClose={() => setHideErrors(true)}>
      <ul>{errorMessages}</ul>
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
        {/* <FormErrors errors={errors} service={formConfig?.service} /> */}
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
