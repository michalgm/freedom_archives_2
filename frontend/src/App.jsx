import { CssBaseline } from "@mui/material";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ConfirmProvider } from "material-ui-confirm";

import Router from "src/Routes";
import { theme } from "src/theme";
import "src/utils/logger";
import "./App.scss";
import { StateProvider } from "./appContext";

function App() {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <StateProvider>
              <ConfirmProvider defaultOptions={{ confirmationButtonProps: { variant: "contained" } }}>
                <Router>
                  <h1>HEY!</h1>
                </Router>
              </ConfirmProvider>
            </StateProvider>
          </LocalizationProvider>
        </CssBaseline>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default App;
