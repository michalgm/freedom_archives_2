import React from 'react';
import { Link } from 'react-router-dom';
import {
  Button
} from '@material-ui/core';

const CollisionLink = React.forwardRef((props, ref) => (
  <Link innerRef={ref} {...props} />
));

function ButtonLink(props) {
  return <Button component={CollisionLink} {...props} />
}

export default ButtonLink;
