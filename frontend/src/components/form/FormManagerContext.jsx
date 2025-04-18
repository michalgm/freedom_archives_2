import { createContext, useContext } from "react";
export const FormManagerContext = createContext(null);

const useFormManagerContext = () => {
  const context = useContext(FormManagerContext);
  if (!context) {
    // logger.error("useFormManagerContext must be used within a BaseForm");
    return {};
  }
  return context;
};

export default useFormManagerContext;
