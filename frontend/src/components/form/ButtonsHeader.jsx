import { Button } from "@mui/material";
import { useCallback, useState } from "react";
import useFormManagerContext from "src/components/form/FormManagerContext";

export const FormButton = ({ label, onClick, type, formName, deleteOptions = {}, ...props }) => {
  const [loading, setLoading] = useState(false);
  const context = useFormManagerContext();
  const {
    confirmDelete,
    formState: { isValid, isSubmitted },
    submitForm,
  } = context;

  const click = useCallback(
    async (e) => {
      setLoading(true);
      // logger.log("CLICK", "submit", onClick, formName);
      e.preventDefault();
      try {
        if (onClick) {
          await onClick();
        } else if (type === "delete") {
          await confirmDelete(deleteOptions);
        } else if (type === "submit") {
          await submitForm();
        }
      } finally {
        setLoading(false);
      }
    },
    [confirmDelete, onClick, submitForm, type, deleteOptions, setLoading]
  );

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

// const ButtonsHeader = ({ buttons, buttonRef, formName }) => {
//   if (!buttons.length || !buttonRef) {
//     return null;
//   }
//   return createPortal(
//     <Grid2 container className="buttons" spacing={1} justifyContent="flex-end">
//       {buttons.map(({ ...props }) => (
//         <Grid2 key={props.label}>
//           <FormButton formName={formName} {...props} />
//         </Grid2>
//       ))}
//     </Grid2>,
//     buttonRef.current
//   );
// };
// export default ButtonsHeader;
