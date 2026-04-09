import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { Link } from "react-router";

function Forbidden() {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="50vh"
      textAlign="center"
      gap={3}
    >
      <Paper elevation={3} sx={{ p: 8 }}>
        <Typography variant="h3" color="error" gutterBottom>
          403 - Forbidden
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          You don't have permission to access this page.
        </Typography>
        <Button component={Link} to="/admin/records" variant="contained">
          Go to Records
        </Button>
      </Paper>
    </Box>
  );
}

export default Forbidden;
