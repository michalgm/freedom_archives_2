import React from 'react';
import { Link } from 'react-router-dom';
import {
  Button
} from '@mui/material';

const CollisionLink = React.forwardRef((props, ref) => (
  <Link ref={ref} {...props} />
));

function ButtonLink(props) {
  return <Button component={CollisionLink} {...props} />
}

export default ButtonLink;
