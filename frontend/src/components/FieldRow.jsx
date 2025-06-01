import { Grid2 } from "@mui/material";
import React from "react";

function FieldRow({ children, ro = false, ...props }) {
  const fields = React.Children.toArray(children);
  const width = 12 / fields.length;
  return fields.map((element, index) => {
    return (
      <Grid2 key={element.props.name || index} size={element.props.width || width} {...props}>
        {element}
        {/* {React.cloneElement(element, { ro })} */}
      </Grid2>
    );
  });
}

export default FieldRow;
