import { Grid2, Paper, Typography } from "@mui/material/";
import { useLocation, useNavigate } from "react-router-dom";

import { authenticate } from "../api";
import Field from "../components/Field";
import Form from "../components/Form";

function Login() {
  const buttons = [{ label: "Log In", type: "submit", color: "primary" }];
  const location = useLocation();
  const navigate = useNavigate();

  const login = async ({ username, password }) => {
    await authenticate(username, password);
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
          <Typography variant="h4" align="center" gutterBottom>
            Log in
          </Typography>
          <Form initialValues={{}} onSubmit={login} noUpdateCheck buttonsBelow buttons={buttons}>
            <Field name="username" placeholder="username" />
            <Field name="password" placeholder="password" type="password" />
          </Form>
        </Paper>
      </Grid2>
    </Grid2>
  );
}

export default Login;
