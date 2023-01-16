import { Alert, Snackbar } from "@mui/material";

import React from "react";
import { useStateValue } from "../appContext";

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
  const {
    state: { notifications },
    dispatch,
  } = useStateValue();

  const hideNotification = (id, message) => {
    dispatch(
      "NOTIFICATIONS",
      notifications.filter(({ id: notification_id }) => notification_id !== id)
    );
  };

  return (
    <div className="notifications">
      {notifications.map(({ id, ...props }, index) => (
        <Notification
          key={id}
          index={index}
          onClose={(_, reason) => {
            if (!["clickaway", "escapeKeyDown"].includes(reason)) {
              hideNotification(id, props.message);
            }
          }}
          {...props}
        />
      ))}
    </div>
  );
}

export default Notifications;
