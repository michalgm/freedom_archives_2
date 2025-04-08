import { Button } from "@mui/material";
import React from "react";
import { Link } from "react-router";

const CollisionLink = React.forwardRef(function CollisionLink(props, ref) {
  return <Link ref={ref} {...props} />;
});

function ButtonLink(props) {
  return <Button component={CollisionLink} {...props} />;
}

export default ButtonLink;
