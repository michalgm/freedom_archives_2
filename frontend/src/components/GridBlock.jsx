import { Grid, Paper, Typography } from "@mui/material";

const emptyArray = [];

function GridBlock({ children = emptyArray, title = "", subtitle = "", width = 12, spacing, gutterBottom = false, ...props }) {
  return (
    <Grid size={width}>
      <Paper {...props}>
        {(title || subtitle) && (
          <Grid container spacing={subtitle ? 4 : 0} alignItems="baseline">
            {title && (
              <Grid>
                <Typography variant="h6" gutterBottom>
                  {title}
                </Typography>
              </Grid>
            )}
            {subtitle && (
              <Grid>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom={gutterBottom}>
                  {subtitle}
                </Typography>
              </Grid>
            )}
          </Grid>
        )}
        {spacing ? (
          <Grid container spacing={spacing}>
            {children}
          </Grid>
        ) : (
          children
        )}
      </Paper>
    </Grid>
  );
}

export default GridBlock;
