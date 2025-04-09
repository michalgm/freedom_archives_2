import { Grid2, Paper, Typography } from "@mui/material/";

function GridBlock({ children = [], title = "", subtitle = "", width = 12, spacing, gutterBottom = false, ...props }) {
  return (
    <Grid2 size={width}>
      <Paper {...props}>
        {(title || subtitle) && (
          <Grid2 container spacing={subtitle ? 4 : 0} alignItems="baseline">
            {title && (
              <Grid2>
                <Typography variant="h6" gutterBottom>
                  {title}
                </Typography>
              </Grid2>
            )}
            {subtitle && (
              <Grid2>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom={gutterBottom}>
                  {subtitle}
                </Typography>
              </Grid2>
            )}
          </Grid2>
        )}
        {spacing ? (
          <Grid2 container spacing={spacing}>
            {children}
          </Grid2>
        ) : (
          children
        )}
      </Paper>
    </Grid2>
  );
}

export default GridBlock;
