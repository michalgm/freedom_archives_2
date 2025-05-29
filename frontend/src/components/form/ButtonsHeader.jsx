import { Button, Grid2 } from "@mui/material";
import { useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import ButtonLink from "src/components/ButtonLink";
import useFormManagerContext from "src/components/form/FormManagerContext";

// Base FormButton component that accepts handlers from context wrappers

const STATICFORMCONTEXT = { formState: {} };
export const FormButton = ({
  label,
  onClick,
  type,
  formName,
  deleteOptions = {},
  icon,
  deleteHandler,
  saveHandler,
  formContext = STATICFORMCONTEXT,
  ...props
}) => {
  const [loading, setLoading] = useState(false);
  const { handleSubmit, formState: { isValid = true, isSubmitted = false } = {} } = formContext || {};

  const click = useCallback(
    async (e) => {
      setLoading(true);
      try {
        if (type === "submit") {
          e.preventDefault();
          if (saveHandler) {
            await saveHandler();
          } else {
            await handleSubmit(onClick)();
          }
        } else if (onClick) {
          await onClick();
        } else if (type === "delete" && deleteHandler) {
          await deleteHandler(deleteOptions);
        }
      } finally {
        setLoading(false);
      }
    },
    [type, onClick, deleteHandler, saveHandler, handleSubmit, deleteOptions]
  );

  if (type === "link") {
    return <ButtonLink {...props}>{label}</ButtonLink>;
  }

  return (
    <Button
      loading={loading}
      loadingPosition="start"
      variant="contained"
      size="medium"
      onClick={click}
      form={formName}
      startIcon={icon}
      // disabled={type === "submit" && !isValid && isSubmitted}
      type={type === "submit" ? "submit" : "button"}
      {...props}
    >
      {label}
    </Button>
  );
};

export const FormManagerButton = (props) => {
  const { confirmDelete, formContext, submitForm } = useFormManagerContext();
  return <FormButton {...props} saveHandler={submitForm} deleteHandler={confirmDelete} formContext={formContext} />;
};

export const ReactHookFormButton = (props) => {
  const formContext = useFormContext();
  return <FormButton {...props} formContext={formContext} />;
};

export function ButtonsHeader({ buttons, useFormManager = true, ...props }) {
  if (!buttons?.length) {
    return null;
  }

  const ButtonComponent = useFormManager ? FormManagerButton : ReactHookFormButton;
  return (
    <Grid2 container className="buttons" spacing={1} justifyContent="flex-end" {...props}>
      {buttons.map((props) => (
        <ButtonComponent key={props.label || props.id} {...props} />
      ))}
    </Grid2>
  );
}

export default ButtonsHeader;
