import { Grid, Paper, Typography } from '@mui/material/';
import {
  useNavigate,
  useLocation
} from 'react-router-dom'

import Field from '../components/Field';
import Form from '../components/Form';
import React from 'react';
import { authenticate } from '../api';

function Login() {
  const buttons = [{ label: 'Log In', type: 'submit', color: 'primary' }];
  const location = useLocation();
  const navigate = useNavigate();

  const login = async({ username, password }) => {
    await authenticate(username, password);
    const {state} = location;
    if (state && state.referrer && state.referrer.pathname !== '/login') {
      navigate(state.referrer.pathname, {replace: true, state: state.referrer.state})
    } else {
      navigate('/', {replace: true})
    }
  }

  return (
    <Grid container justifyContent="center">
      <Grid item md={7} lg={5}>
        <Paper style={{ padding: '20px 28px' }}>
          <Typography variant="h4" align="center" gutterBottom>
            Log in
          </Typography>
          <Form
            initialValues={{ username: 'greg', password: 'letmein' }}
            onSubmit={login}
            noUpdateCheck
            buttonsBelow
            buttons={buttons}
          >
            <Field name="username" placeholder="username" />
            <Field name="password" placeholder="password" type="password" />
          </Form>
        </Paper>
      </Grid>
    </Grid>
  );
}

export default Login;
