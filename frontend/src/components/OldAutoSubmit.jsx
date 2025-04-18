import { useFormikContext } from "formik";
import { useEffect } from "react";

const AutoSubmit = () => {
  /*
    This component is used to automatically submit the form when the form is valid
    and has been changed(dirty).
   */
  const { isValid, values, dirty, submitForm } = useFormikContext();

  useEffect(() => {
    if (isValid && dirty) {
      submitForm();
    }
  }, [isValid, values, dirty, submitForm]);

  return null;
};

export default AutoSubmit;
