import React from 'react';
import { authenticate } from './api'
import { Formik, Form, Field } from 'formik';

function Login() {
  return (
    <Formik
      initialValues={{ username: 'greg', password: 'letmein' }}
      onSubmit={({ username, password }) => {
        authenticate(username, password)
      }}
    >
      {() =>
        (
          <Form>
            <Field name='username' placeholder="username" />
            <Field name='password' placeholder="password" type="password" />
            <button type="submit">Log In</button>
          </Form>
        )
      }
    </Formik>
  )
}

export default Login;
