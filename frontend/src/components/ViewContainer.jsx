import { Box, Grid2, Paper, Stack } from "@mui/material";
import { FormErrors } from "src/components/form/BaseForm";
import ButtonsHeader from "src/components/form/ButtonsHeader";
import useFormManagerContext from "src/components/form/FormManagerContext";
import Show from "src/components/Show";

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
        {header && service && <FormErrors service={service} embedded />}
      </Grid2>
    </Paper>
  );
};

function ViewContainer({
  children,
  buttons,
  embedded,
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
    <Stack direction="column" spacing={embedded ? 1 : 2} useFlexGap className="ScrollContainer">
      <Section elements={headerElements} header service={service} />
      <Container id="contents" className="FlexContainer" {...containerProps}>
        <Show when={!isLoading}>{children}</Show>
      </Container>
      <Section type="footer" elements={footerElements} />
    </Stack>
  );
}

export default ViewContainer;
