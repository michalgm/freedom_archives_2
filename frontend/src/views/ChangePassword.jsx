import {} from "formik-mui";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
} from "@mui/material";
import React, { useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";

import Field from "../components/Field";
import FieldRow from "../components/FieldRow";
import Form from "../components/Form";
import { useAddNotification } from "../appContext";
import { users } from "../api";

function ChangePassword({ open, user: { user_id, username }, handleClose }) {
  const [showPassword, setShowPassword] = useState(false);
  const addNotification = useAddNotification();

  const savePassword = async ({ password1, password2 }) => {
    if (password1 && password2) {
      try {
        await users.patch(
          user_id,
          { password: password1 },
          { noDispatchError: true }
        );

        addNotification({
          id: "change_passsword",
          message: `Password changed for user "${username}"`,
        });
        handleClose();
      } catch (err) {
        addNotification({
          severity: "error",
          id: "change_passsword",
          message: `Error changing password for user "${username}": ${err.message}`,
        });
      }
    }
  };

  const passwordInputProps = {
    endAdornment: (
      <InputAdornment position="end">
        <IconButton
          tabIndex={-1}
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <VisibilityOff /> : <Visibility />}
        </IconButton>
      </InputAdornment>
    ),
  };
  const validatePasswords = ({ password1, password2 }) => {
    const errors = {};
    if (password1 && password2) {
      if (password1 !== password2) {
        errors.password2 = "Passwords do not match";
      } else if (password2.length < 8) {
        errors.password2 = "Password must be at least 8 characters";
      } else if (password2.match(/^[A-z0-9]+$/)) {
        errors.password2 =
          "Password must contain at least one special character";
      }
    }

    return errors;
  };

  const buttons = [
    { label: "Change password", type: "submit", color: "primary" },
    {
      label: "Cancel",
      onClick: handleClose,
      variant: "outlined",
    },
  ];

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm">
        <DialogTitle>
          Change password for user &quot;{username}&quot;
        </DialogTitle>
        <DialogContent sx={{ overflowY: "visible", textAlign: "center" }}>
          <Form
            initialValues={{ password1: "", password2: "" }}
            validateOnChange
            validate={validatePasswords}
            gridProps={{
              justifyContent: "center",
            }}
            onSubmit={savePassword}
            buttons={buttons}
            buttonsBelow
          >
            <FieldRow sx={{ textAlign: "center" }}>
              <Field
                autoFocus
                name="password1"
                label="Password"
                type={showPassword ? "text" : "password"}
                InputProps={passwordInputProps}
                fullWidth={false}
                width="auto"
              />
            </FieldRow>
            <FieldRow sx={{ marginBottom: 4, textAlign: "center" }}>
              <Field
                name="password2"
                label="Verify Password"
                type={showPassword ? "text" : "password"}
                InputProps={passwordInputProps}
                fullWidth={false}
                width="auto"
              />
            </FieldRow>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ChangePassword;
