import React from 'react';
import { useStateValue } from '../appContext'
import { Alert, AlertTitle } from '@mui/material';

function Errors() {
  const { state: { error }, dispatch } = useStateValue();

  const clearError = () => {
    dispatch('ERROR', { error: '' })
  }

  return error &&
    <Alert severity="error" onClose={() => clearError()}>
      <AlertTitle>Error</AlertTitle>
      {error}
    </Alert>

}

export default Errors;
