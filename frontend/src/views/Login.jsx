import { Login } from "@mui/icons-material";
import { Grid2, Paper, Stack, Typography } from "@mui/material/";
import { useCallback } from "react";
import { FormContainer } from "react-hook-form-mui";
import { useLocation, useNavigate } from "react-router";
import ButtonsHeader from "src/components/form/ButtonsHeader";
import { Field } from "src/components/form/Field";
import { useAppStore } from "src/stores";

import { authenticate } from "../api";

function LoginForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const hasError = useAppStore((state) => state.hasError);

  const login = useCallback(
    async ({ username, password }) => {
      await authenticate(username.toLowerCase(), password);
      const { state } = location;
      if (
        state &&
        state.referrer &&
        state.referrer.pathname !== "/admin/login"
      ) {
        navigate(state.referrer.pathname, {
          replace: true,
          state: state.referrer.state,
        });
      } else {
        navigate("/admin/records", { replace: true });
      }
    },
    [location, navigate],
  );

  const buttons = [
    {
      label: "Log In",
      type: "submit",
      color: "primary",
      icon: <Login />,
      onClick: login,
    },
  ];
  return (
    <Grid2 container justifyContent="center">
      <Grid2 size={{ md: 7, lg: 5 }}>
        <Paper style={{ padding: "20px 28px" }}>
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{ paddingTop: hasError ? "50px" : 0 }}
          >
            Log in
          </Typography>
          <FormContainer onSuccess={login} initialValues={{}}>
            <Stack spacing={3}>
              <Field
                name="username"
                placeholder="username"
                highlightDirty={false}
                rules={{ required: "Username is required" }}
              />
              <Field
                name="password"
                placeholder="password"
                type="password"
                highlightDirty={false}
                rules={{ required: "Password is required" }}
              />
              <ButtonsHeader
                useFormManager={false}
                buttons={buttons}
                justifyContent="flex-start"
              />
            </Stack>
          </FormContainer>
        </Paper>
      </Grid2>
    </Grid2>
  );
}

export default LoginForm;
