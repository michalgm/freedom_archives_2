import React from 'react';
import { authenticate } from '../api';
import Field from '../components/Field';
import Form from '../components/Form';
import { Grid, Typography, Paper } from '@material-ui/core/';
function Login() {
  const buttons = [{ label: 'Log In', type: 'submit', color: 'primary' }];
  return (
    <Grid container justify="center">
      <Grid item md={7} lg={5}>
        <Paper style={{ padding: '20px 28px' }}>
          <Typography variant="h4" align="center" gutterBottom>
            Log in
          </Typography>
          <Form
            initialValues={{ username: 'greg', password: 'letmein' }}
            onSubmit={({ username, password }) => {
              authenticate(username, password);
            }}
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
