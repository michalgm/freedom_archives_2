import { useConfirm } from "material-ui-confirm";
import { useEffect } from "react";
import { useBlocker } from "react-router";

export const FormStateHandler = ({ shouldBlockNavigation }) => {
  const blocker = useBlocker(shouldBlockNavigation);

  const confirm = useConfirm();

  useEffect(() => {
    const handleNav = async () => {
      const { confirmed } = await confirm({
        title: "You have unsaved changes. ",
        description: "Are you sure you want to leave this page? Changes you made will be lost if you navigate away.",
      });

      if (confirmed) blocker.proceed();
      else blocker.reset();
    };
    if (blocker.state === "blocked") {
      handleNav();
    }
    return blocker.reset;
  }, [blocker, confirm]);

  useEffect(() => {
    // ensure the blocker is reset at unmount
    return () => {
      if (blocker.state == "blocked") blocker.reset();
    };
  }, [blocker]);

  return null;
};
