import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  Stack,
} from "@mui/material";
import { useState } from "react";
import { FormContainer } from "react-hook-form-mui";
import { FormErrors } from "src/components/form/BaseForm";
import ButtonsHeader from "src/components/form/ButtonsHeader";
import { Field } from "src/components/form/Field";
import { useAddNotification } from "src/stores";

import { users } from "../api";

function ChangePassword({ open, user: { user_id, username }, handleClose }) {
  const [showPassword, setShowPassword] = useState(false);
  const addNotification = useAddNotification();

  const savePassword = async ({ password1, password2 }) => {
    if (password1 && password2) {
      try {
        await users.patch(user_id, { password: password1 }, { noDispatchError: true });

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
        <IconButton tabIndex={-1} onClick={() => setShowPassword(!showPassword)}>
          {showPassword ? <VisibilityOff /> : <Visibility />}
        </IconButton>
      </InputAdornment>
    ),
  };
  const validatePasswords = ({ password1, password2 }) => {
    logger.log({ password1, password2 });
    const errors = {};
    if (password1 && password2) {
      if (password1 !== password2) {
        errors.password1 = { message: "Passwords do not match" };
      } else if (password1.length < 8) {
        errors.password1 = { message: "Password must be at least 8 characters" };
      } else if (password1 == username) {
        errors.password1 = { message: "Password cannot be the same as username" };
      } else if (password1.match(/^[A-z0-9]+$/)) {
        errors.password1 = { message: "Password must contain at least one special character" };
      }
    }
    logger.log(errors);
    return { values: { password1, password2 }, errors };
  };

  const buttons = [
    {
      label: "Cancel",
      onClick: handleClose,
      variant: "outlined",
    },
    { label: "Change password", type: "submit", color: "primary", onClick: savePassword },
  ];

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm">
        <DialogTitle>Change password for user &quot;{username}&quot;</DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
          <Box sx={{ textAlign: "left" }}>
            Passwords must:
            <List sx={{ listStyleType: "disc", listStylePosition: "inside" }} dense>
              <ListItem sx={{ display: "list-item" }}>Be at least 8 characters long</ListItem>
              <ListItem sx={{ display: "list-item" }}>Contain at least one special character</ListItem>
              <ListItem sx={{ display: "list-item" }}>Not be the same as your username</ListItem>
            </List>
          </Box>
          <FormContainer
            defaultValues={{ password1: "", password2: "" }}
            mode="onChange"
            resolver={validatePasswords}
            onSuccess={savePassword}
          >
            <FormErrors />
            <Stack spacing={2} direction="row" sx={{ my: 2 }}>
              <Field
                autoFocus
                name="password1"
                label="Password"
                type={showPassword ? "text" : "password"}
                InputProps={passwordInputProps}
                highlightDirty={false}
                fullWidth={false}
                width="auto"
              />
              <Field
                name="password2"
                label="Verify Password"
                type={showPassword ? "text" : "password"}
                InputProps={passwordInputProps}
                highlightDirty={false}
                fullWidth={false}
                width="auto"
              />
            </Stack>
            <ButtonsHeader buttons={buttons} useFormManager={false} />
          </FormContainer>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ChangePassword;
