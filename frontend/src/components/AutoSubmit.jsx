import { debounce } from "lodash-es";
import { useFormContext } from "react-hook-form";
import useDeepCompareEffect from "use-deep-compare-effect";

const AutoSubmit = ({ action, timeout = 300 }) => {
  const { watch } = useFormContext();

  const data = watch();

  useDeepCompareEffect(() => {
    debounce(action, timeout)(data);
  }, [data, action]);

  return null;
};

export default AutoSubmit;
