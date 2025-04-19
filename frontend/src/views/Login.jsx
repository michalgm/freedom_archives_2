import { Box, Button, Grid2, Paper, Stack, Typography } from "@mui/material/";
import { FormContainer } from "react-hook-form-mui";
import { useLocation, useNavigate } from "react-router";
import { Field } from "src/components/form/Field";
import { useAppStore } from "src/stores";

import { authenticate } from "../api";

function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const hasError = useAppStore((state) => state.hasError);

  const login = async ({ username, password }) => {
    await authenticate(username.toLowerCase(), password);
    const { state } = location;
    if (state && state.referrer && state.referrer.pathname !== "/login") {
      navigate(state.referrer.pathname, {
        replace: true,
        state: state.referrer.state,
      });
    } else {
      navigate("/", { replace: true });
    }
  };

  return (
    <Grid2 container justifyContent="center">
      <Grid2 size={{ md: 7, lg: 5 }}>
        <Paper style={{ padding: "20px 28px" }}>
          <Typography variant="h4" align="center" gutterBottom sx={{ paddingTop: hasError ? "50px" : 0 }}>
            Log in
          </Typography>
          <FormContainer onSuccess={login} initialValues={{}}>
            <Stack spacing={3}>
              <Field name="username" placeholder="username" />
              <Field name="password" placeholder="password" type="password" />
              <Box>
                <Button type="submit" variant="contained" size="large">
                  Log In
                </Button>
              </Box>
            </Stack>
          </FormContainer>
        </Paper>
      </Grid2>
    </Grid2>
  );
}

export default Login;
