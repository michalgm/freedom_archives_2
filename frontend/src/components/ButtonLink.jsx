import { Button } from "@mui/material";
import { Link } from "react-router-dom";
import React from "react";

const CollisionLink = React.forwardRef(function CollisionLink(props, ref) {
  return <Link ref={ref} {...props} />;
});

function ButtonLink(props) {
  return <Button component={CollisionLink} {...props} />;
}

export default ButtonLink;
