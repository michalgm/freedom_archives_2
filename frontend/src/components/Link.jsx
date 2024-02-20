import { Link as MUILink } from "@mui/material";
import React from "react";
import { Link as RouterLink } from "react-router-dom";

const CollisionLink = React.forwardRef(function CollisionLink(props, ref) {
  return <RouterLink ref={ref} {...props} />;
});

function Link(props) {
  if (props.to) {
    return <MUILink component={CollisionLink} {...props} underline="hover" />;
  } else {
    return <MUILink {...props} underline="hover" />;
  }
}

export default Link;
