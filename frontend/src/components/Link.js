import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Link as MUILink
} from '@material-ui/core';

const CollisionLink = React.forwardRef((props, ref) => (
  <RouterLink innerRef={ref} {...props} />
));

function Link(props) {
  return <MUILink component={CollisionLink} {...props} />
}

export default Link;
