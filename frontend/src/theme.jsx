import { createTheme } from "@mui/material";

export const theme = createTheme({
  typography: {
    h1: { fontSize: "2.5rem" },
    h2: { fontSize: "2.2rem" },
    h3: { fontSize: "1.9rem" },
    h4: { fontSize: "1.6rem" },
    h5: { fontSize: "1.4rem" },
    h6: { fontSize: "1.2rem" },
  },
  components: {
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          padding: "10px",
        },
      },
      defaultProps: {},
    },
    MuiFormControl: {
      // variants: [
      //   {
      //     props: { size: "x-small" },
      //     style: xSmallInputStyles,
      //   },
      // ],
      styleOverrides: {
        root: {
          "& .MuiFormLabel-colorSuccess": {
            color: "var(--mui-palette-success-main)", // Success color for default state
          },
          "&:has(.MuiCheckbox-colorSuccess).MuiFormControl-root": {
            width: "100%",
            outline: "1px solid var(--mui-palette-success-main)",
            borderRadius: "2px",
            backgroundColor: "rgba(var(--mui-palette-success-lightChannel) / 0.1) !important",
          },
          "& .MuiCheckbox-colorSuccess": {
            color: "var(--mui-palette-success-main)", // Success color for default state
          },
          "& .MuiInputBase-colorSuccess": {
            "&": {
              backgroundColor: "rgba(var(--mui-palette-success-lightChannel) / 0.1) !important",
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--mui-palette-success-main)", // Success color for default state
            },
          },
          "& .MuiFormLabel-colorWarning": {
            color: "var(--mui-palette-warning-main)", // Success color for default state
          },
          "&:has(.MuiCheckbox-colorWarning).MuiFormControl-root": {
            width: "100%",
            outline: "1px solid var(--mui-palette-warning-main)",
            borderRadius: "2px",
            backgroundColor: "rgba(var(--mui-palette-warning-lightChannel) / 0.1) !important",
          },
          "& .MuiCheckbox-colorWarning": {
            color: "var(--mui-palette-warning-main)", // Success color for default state
          },
          "& .MuiInputBase-colorWarning": {
            "&": {
              backgroundColor: "rgba(var(--mui-palette-warning-lightChannel) / 0.1) !important",
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--mui-palette-warning-main)", // Success color for default state
            },
          },
        },
      },
    },
  },
});
