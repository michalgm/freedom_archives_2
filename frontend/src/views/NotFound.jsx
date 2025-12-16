import { Box, Typography } from "@mui/material";

export default function NotFound() {
  return (
    <Box sx={{ p: 4, textAlign: "center" }}>
      <Typography component="h1" variant="h4" gutterBottom>404 - Not Found</Typography>
      <Typography variant="body1">The page you are looking for does not exist.</Typography>
    </Box>
  );
}
