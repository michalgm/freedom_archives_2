import { useFormContext } from "react-hook-form";
import useDeepCompareEffect from "use-deep-compare-effect";

const AutoSubmit = ({ action }) => {
  const { watch } = useFormContext();

  const data = watch();

  useDeepCompareEffect(() => {
    action(data);
  }, [data, action]);

  return null;
};

export default AutoSubmit;
