import { useFormikContext } from "formik";
import { useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";

export default function AutoSave({ timeout = 300 }) {
  const formik = useFormikContext();
  const { submitForm, values, isValid, dirty, isSubmitting } = formik;
  const debouncedSubmitCaller = useDebouncedCallback((submitForm) => {
    submitForm();
  }, timeout);

  useEffect(() => {
    if (isValid && dirty && !isSubmitting) {
      debouncedSubmitCaller(submitForm);
    }
  }, [debouncedSubmitCaller, submitForm, isValid, dirty, isSubmitting, values]);

  return null;
}
