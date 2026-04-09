import ExpandMore from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useFormContext } from "react-hook-form-mui";

const emptyArray = [];

const FormSection = ({ title, sectionActions = emptyArray, children, small = false, sticky = true }) => {
  const context = useFormContext();
  return (
    <Accordion key={title} size={12} defaultExpanded disableGutters>
      <AccordionSummary
        sx={(theme) => ({
          position: sticky ? "sticky" : undefined,
          top: sticky ? 46 : undefined,
          minHeight: small ? 0 : undefined,
          backgroundColor: "primary.light",
          color: "contrast.main",
          "&.Mui-expanded": {
            marginBottom: 1,
          },
          zIndex: 9,
          ...theme.applyStyles("dark", {
            backgroundColor: "grey.800", // remove the box shadow in dark mode
          }),
          ".MuiAccordionSummary-content": {
            margin: 0,
          },
        })}
        expandIcon={<ExpandMore sx={{ color: "contrast.main" }} />}
      >
        <Stack
          spacing={2}
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          width="100%"
          sx={{ pr: 2 }}
        >
          <Typography variant={small ? "body1" : "h5"} component="h3">
            {title}
          </Typography>
          {sectionActions.map((action) => (
            <Box key={action.label}>
              <Tooltip title={action.tooltip}>
                <Button
                  component="div"
                  variant="contained"
                  size="small"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    action.onClick(e, context);
                  }}
                >
                  {action.label}
                </Button>
              </Tooltip>
            </Box>
          ))}
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2} sx={{ m: 0 }} size={12}>
          {children}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default FormSection;
