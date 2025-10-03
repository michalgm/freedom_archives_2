import { isEqual } from "lodash-es";
import { useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";

const AutoSubmit = ({ action, timeout = 300 }) => {
  const { watch } = useFormContext();

  const data = watch();
  const debouncedAction = useDebouncedCallback(action, timeout);
  const lastDataRef = useRef(data);

  useEffect(() => {
    const dataChanged = !isEqual(data, lastDataRef.current);

    if (dataChanged) {
      debouncedAction(data);
      lastDataRef.current = data;
    }
  }, [data, debouncedAction]);

  useEffect(
    () => () => {
      debouncedAction.flush();
    },
    [debouncedAction],
  );

  return null;
};

export default AutoSubmit;
