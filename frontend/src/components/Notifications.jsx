import { Alert, Snackbar, Stack } from "@mui/material";
import { useAppStore, useRemoveNotification } from "src/stores";

function Notification({ severity = "success", embedded, message, onClose }) {
  return (
    <Snackbar
      open={true}
      autoHideDuration={severity === "error" ? null : 5000}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      onClose={onClose}
      disableWindowBlurListener={true}
      sx={{ position: "relative", top: "unset !important" }}
    >
      <Alert
        severity={severity}
        onClose={onClose}
        elevation={embedded ? 0 : 6}
        sx={{ pointerEvents: "auto", flexGrow: embedded ? 1 : undefined }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}

function Notifications({ embedded = false }) {
  const notifications = useAppStore((state) => state.notifications);
  const removeNotification = useRemoveNotification();
  const sx = embedded
    ? { mb: 2, mt: 0 }
    : {
      position: "absolute",
      top: 8,
      zIndex: 10000000,
      left: 24,
      right: 24,
      pointerEvents: "none",
    };
  return (
    <Stack className="notifications" direction="column" spacing={2} sx={sx}>
      {notifications.map(({ id, severity, message }, index) => (
        <Notification
          key={id}
          index={index}
          severity={severity}
          message={message}
          embedded={embedded}
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
