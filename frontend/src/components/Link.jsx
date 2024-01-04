import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Link as MUILink
} from '@mui/material';

const CollisionLink = React.forwardRef((props, ref) => (
  <RouterLink ref={ref} {...props} />
));

function Link(props) {
  if (props.to) {
    return <MUILink component={CollisionLink} {...props} underline="hover" />;
  } else {
    return <MUILink {...props} underline="hover" />;
  }
}

export default Link;
