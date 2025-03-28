import { Grid2 } from "@mui/material";
import React from "react";

function FieldRow({ children, ro = false, ...props }) {
  const fields = React.Children.toArray(children);
  const width = 12 / fields.length;
  return fields.map((element, index) => {
    // const label = (element.props.label || element.props.name).replace('_value', '')
    return (
      <Grid2 key={element.props.name || index} size={element.props.width || width} {...props}>
        {React.cloneElement(element, { ro })}
      </Grid2>
    );

    // if (label) {
    //   return [
    //     <Grid item key='label' xs={2}>
    //       <Typography variant="subtitle2">
    //         {startCase(label)}
    //       </Typography>
    //     </Grid>,
    //
    //     <Grid item key='value' xs={width}>
    //       {React.cloneElement(element, { ro })}
    //     </Grid>
    //   ];
    // }
    // return element;
  });
}

export default FieldRow;
