import React from "react";
import { FormContainer } from "react-hook-form-mui";

type FormContainerProps = React.ComponentProps<typeof FormContainer>;

interface FormProps extends FormContainerProps {
  children: React.ReactNode;
}

const Form = ({ children, ...props }: FormProps) => {
  return (
    <FormContainer
      FormProps={{
        autoComplete: "off",
      }}
      {...props}
    >
      {children}
    </FormContainer>
  );
};

export default Form;
