import { CssBaseline } from "@mui/material";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ConfirmProvider } from "material-ui-confirm";

import Router from "src/Routes";
import { theme } from "src/theme";
import "src/utils/logger";
import "./App.scss";

function App() {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <ConfirmProvider defaultOptions={{ confirmationButtonProps: { variant: "contained" } }}>
              <Router />
            </ConfirmProvider>
          </LocalizationProvider>
        </CssBaseline>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default App;
