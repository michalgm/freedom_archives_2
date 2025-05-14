import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";

const AutoSubmit = ({ action, timeout = 300 }) => {
  const { watch } = useFormContext();

  const data = watch();

  const debouncedAction = useDebouncedCallback(action, timeout);

  useEffect(() => {
    debouncedAction(data);
  }, [data, debouncedAction]);

  useEffect(
    () => () => {
      debouncedAction.flush();
    },
    [debouncedAction]
  );

  return null;
};

export default AutoSubmit;
