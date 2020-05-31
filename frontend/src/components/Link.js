import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Link as MUILink
} from '@material-ui/core';

const CollisionLink = React.forwardRef((props, ref) => (
  <RouterLink innerRef={ref} {...props} />
));

function Link(props) {
  if (props.to) {
    return <MUILink component={CollisionLink} {...props} />
  } else {
    return <MUILink {...props} />
  }
}

export default Link;
