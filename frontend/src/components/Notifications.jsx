import { Alert, Snackbar } from "@mui/material";
import { useAppStore, useRemoveNotification } from "src/stores";
// import { useStateValue } from "../appContext";

function Notification({ severity = "success", index, message, onClose }) {
  return (
    <Snackbar
      open={true}
      autoHideDuration={severity === "error" ? null : 5000}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      onClose={onClose}
      disableWindowBlurListener={true}
      sx={{
        top: index * 70 + 84 + "px !important",
      }}
    >
      <Alert severity={severity} onClose={onClose}>
        {message}
      </Alert>
    </Snackbar>
  );
}

function Notifications() {
  const notifications = useAppStore((state) => state.notifications);
  const removeNotification = useRemoveNotification();

  return (
    <div className="notifications">
      {notifications.map(({ id, severity, message }, index) => (
        <Notification
          key={id}
          index={index}
          severity={severity}
          message={message}
          onClose={(_, reason) => {
            if (!["clickaway", "escapeKeyDown"].includes(reason)) {
              removeNotification(id);
            }
          }}
        />
      ))}
    </div>
  );
}

export default Notifications;
