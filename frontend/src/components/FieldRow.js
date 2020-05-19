import React from "react";
import { Grid, Typography } from "@material-ui/core";

function FieldRow({ children, ro = false }) {
  const fields = React.Children.toArray(children);
  const width = 12 / fields.length;
  return fields.map((element, index) => {
    // const label = (element.props.label || element.props.name).replace('_value', '')
    return (
      <Grid item key={element.props.name || index} xs={width}>
        {React.cloneElement(element, { ro })}
      </Grid>
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
