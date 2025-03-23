import React from "react";

import { FormContainer } from "react-hook-form-mui";

import { useFormManager } from "../../hooks/useFormManager";

import { FormStateHandler } from "./FormStateHandler";

const BaseForm = ({ children, autoComplete = "off", formConfig, loadingElement }) => {
  const formManager = useFormManager(formConfig);
  const { formContext, onSave, blocker } = formManager;
  const { isLoading } = formContext.formState;
  // console.log({ isLoading });
  if (isLoading) {
    return loadingElement || null;
  }
  return (
    <FormContainer
      onSuccess={onSave}
      FormProps={{ autoComplete, name: formConfig?.modelType || "form" }}
      formContext={formContext}
    >
      <FormStateHandler blocker={blocker} />
      {typeof children === "function" ? children(formManager) : children}
    </FormContainer>
  );
};

// This is to force state refresh on id change
const BaseFormWrapper = (props) => {
  const key = `${props.formConfig?.modelType}-${props.formConfig?.id || "new"}`;
  return (
    <React.Fragment key={key}>
      <BaseForm {...props} />
    </React.Fragment>
  );
};

export { BaseFormWrapper as BaseForm };
