import { Button, Grid2 } from "@mui/material";
import { createPortal } from "react-dom";
import { useFormManagerContext } from "src/components/form/BaseForm";

export const FormButton = ({ label, onClick, type, formName, deleteOptions = {}, ...props }) => {
  const {
    confirmDelete,
    loading: _loading,
    formState: { isValid, isSubmitted },
    submitForm,
  } = useFormManagerContext();
  let loading =
    (type == "delete" && _loading?.delete) || (type == "submit" && (_loading?.update || _loading?.create)) || false;
  const click = (e) => {
    logger.log("CLICK");
    if (type === "delete") {
      confirmDelete(deleteOptions);
      loading = _loading?.delete;
    } else if (type === "submit") {
      logger.log("CLICK", "submit", onClick, formName);
      e.preventDefault();
      loading = _loading?.update || _loading?.create;
      submitForm();
    }
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };
  return (
    <Button
      loading={loading}
      loadingPosition="start"
      variant="contained"
      size="medium"
      onClick={click}
      form={formName}
      disabled={type === "submit" && !isValid && isSubmitted}
      type={type === "submit" ? "submit" : "Button"}
      {...props}
    >
      {label}
    </Button>
  );
};

const ButtonsHeader = ({ buttons, buttonRef, formName }) => {
  if (!buttons.length || !buttonRef) {
    return null;
  }
  return createPortal(
    <Grid2 container className="buttons" spacing={1} justifyContent="flex-end">
      {buttons.map(({ ...props }) => (
        <Grid2 key={props.label}>
          <FormButton formName={formName} {...props} />
        </Grid2>
      ))}
    </Grid2>,
    buttonRef.current
  );
};
export default ButtonsHeader;
