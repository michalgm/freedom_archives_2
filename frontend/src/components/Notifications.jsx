import { Alert, Snackbar, Stack } from "@mui/material";
import { useAppStore, useRemoveNotification } from "src/stores";

function Notification({ severity = "success", message, onClose }) {
  return (
    <Snackbar
      open={true}
      autoHideDuration={severity === "error" ? null : 5000}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      onClose={onClose}
      disableWindowBlurListener={true}
      sx={{ position: "relative", top: "unset !important" }}
    >
      <Alert severity={severity} onClose={onClose} elevation={6} sx={{ pointerEvents: "auto" }}>
        {message}
      </Alert>
    </Snackbar>
  );
}

function Notifications() {
  const notifications = useAppStore((state) => state.notifications);
  const removeNotification = useRemoveNotification();

  return (
    <Stack
      className="notifications"
      direction="column"
      spacing={2}
      sx={{ position: "absolute", top: 8, zIndex: 10000, left: 24, right: 24, pointerEvents: "none" }}
    >
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
    </Stack>
  );
}

export default Notifications;
