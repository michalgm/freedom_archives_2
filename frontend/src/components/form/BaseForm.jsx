import React, { useEffect } from "react";

import { FormContainer } from "react-hook-form-mui";

import { useFormManager } from "src/hooks/useFormManager";

import { Alert } from "@mui/material";
import { getFieldLabel } from "src/components/form/schemaUtils";
import { flattenErrors } from "src/utils";
import { FormManagerContext } from "./FormManagerContext";
import { FormStateHandler } from "./FormStateHandler";
import { parseError } from "./schemaUtils";
// return { formContext: { formState: {}, getValues: () => {} } };

const FormErrors = ({ errors, service }) => {
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

const BaseForm = ({ children, autoComplete = "off", formConfig, loadingElement, formID, ...props }) => {
  const formManager = useFormManager(formConfig);
  const { formContext, onSave, shouldBlockNavigation } = formManager;
  const { isLoading, errors } = formContext.formState;
  logger.log("BASE FORM RENDER", errors, formContext.getValues());
  // const memoizedFormManager = useMemo(() => {
  //   return {

  //   };
  // }, [formManager.formContext, formManager.loading, formManager.service, formManager.onSave]);
  // logger.log({ isLoading });
  if (isLoading) {
    logger.log("FORM LOADING...");
    return loadingElement || null;
  }
  const name = formID || formConfig?.service || "form";
  // logger.log("!!!!!", memoizedFormManager);
  return (
    <FormManagerContext.Provider
      value={{
        formContext: formManager.formContext,
        formState: formManager.formState,
        loading: formManager.loading,
        onSave: formManager.onSave,
        confirmDelete: formManager.confirmDelete,
        service: formManager.service,
        submitForm: formManager.submitForm,
      }}
    >
      <FormContainer
        onSuccess={onSave}
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
        <FormErrors errors={errors} service={formConfig?.service} />
        {typeof children === "function" ? children(formManager) : children}
      </FormContainer>
    </FormManagerContext.Provider>
  );
};

// This is to force state refresh on id change
const BaseFormWrapper = (props) => {
  const key = `${props.formConfig?.service}-${props.formConfig?.id || "new"}`;
  logger.log("BASE FORM WRAPPER RENDER");
  return (
    <React.Fragment key={key}>
      <BaseForm {...props} />
    </React.Fragment>
  );
};

export { BaseFormWrapper as BaseForm };
