import { Alert, Box, Grid2, Paper, Stack } from "@mui/material";
import React, { useEffect } from "react";
import { useFormState } from "react-hook-form";
import ButtonsHeader from "src/components/form/ButtonsHeader";
import useFormManagerContext from "src/components/form/FormManagerContext";
import { getFieldLabel, parseError } from "src/components/form/schemaUtils";
import Show from "src/components/Show";
import { flattenErrors } from "src/utils";

export const Section = ({ header, elements, service, ...props }) => {
  if (!elements.length) return null;
  const justifyContent = elements.length === 1 ? "center" : "space-between";
  return (
    <Paper {...props} elevation={1}>
      <Grid2 size="grow" style={{ flex: "none" }}>
        <Grid2 container alignContent="center" alignItems="center" justifyContent={justifyContent} spacing={2}>
          {elements.map((item) => (
            <Grid2 key={item.key} flex="1 1 auto" style={{ textAlign: "center" }}>
              {item}
            </Grid2>
          ))}
        </Grid2>
        {header && service && <FormErrors service={service} />}
      </Grid2>
    </Paper>
  );
};

export const FormErrors = ({ service }) => {
  const { errors } = useFormState();
  const [hideErrors, setHideErrors] = React.useState(false);
  useEffect(() => {
    setHideErrors(false);
  }, [errors]);
  const errorsMap = flattenErrors(errors);
  const errorMessages = Object.entries(errorsMap).reduce((acc, [field, error]) => {
    const label = getFieldLabel(field, service);
    const message = parseError(field, label)({ message: error });
    acc.push(<li key={field}>{message}</li>);
    return acc;
  }, []);
  if (errorMessages.length === 0 || hideErrors) return null;

  return (
    <Alert severity="error" elevation={0} sx={{ mt: 1 }} onClose={() => setHideErrors(true)}>
      <ul>{errorMessages}</ul>
    </Alert>
  );
};

function ViewContainer({
  children,
  buttons,
  // embedded,
  noPaper = false,
  footerElements = [],
  headerElements = [],
  service,
  containerProps = {},
}) {
  const { isLoading } = useFormManagerContext();

  logger.log("VIEW CONTAINER RENDER");

  if (buttons) {
    headerElements.unshift(<ButtonsHeader key="buttons" buttons={buttons} />);
  }
  const Container = noPaper ? Box : Paper;
  return (
    <Stack direction="column" spacing={2} useFlexGap className="ScrollContainer">
      <Section elements={headerElements} header service={service} />
      <Container id="contents" className="FlexContainer" {...containerProps}>
        <Show when={!isLoading}>{children}</Show>
      </Container>
      <Section type="footer" elements={footerElements} />
    </Stack>
  );
}

export default ViewContainer;
