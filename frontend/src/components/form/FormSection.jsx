import { ExpandMore } from '@mui/icons-material'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Grid2,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useFormContext } from 'react-hook-form-mui'

const FormSection = ({
  title,
  sectionActions = [],
  children,
  small = false,
  sticky = true,
}) => {
  const context = useFormContext()
  return (
    <Accordion key={title} size={12} defaultExpanded disableGutters>
      <AccordionSummary
        sx={(theme) => ({
          position: sticky ? 'sticky' : undefined,
          top: sticky ? 46 : undefined,
          minHeight: small ? 0 : undefined,
          backgroundColor: 'primary.light',
          color: 'contrast.main',
          '&.Mui-expanded': {
            marginBottom: 1,
          },
          zIndex: 9,
          ...theme.applyStyles('dark', {
            backgroundColor: 'grey.800', // remove the box shadow in dark mode
          }),
          '.MuiAccordionSummary-content': {
            margin: 0,
          },
        })}
        expandIcon={<ExpandMore sx={{ color: 'contrast.main' }} />}
      >
        <Stack
          spacing={2}
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          width="100%"
          sx={{ pr: 2 }}
        >
          <Typography variant={small ? 'body1' : 'h5'} component="h3">
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
                    e.preventDefault()
                    e.stopPropagation()
                    action.onClick(e, context)
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
        <Grid2 container spacing={2} sx={{ m: 0 }} size={12}>
          {children}
        </Grid2>
      </AccordionDetails>
    </Accordion>
  )
}

export default FormSection
