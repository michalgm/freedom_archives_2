import { createTheme } from "@mui/material/styles";

const xSmallFontSize = "0.7rem";
const xSmallPadding = "2px 3px";
const xSmallMinHeight = "28px";
const xSmallGroupPadding = "6px";
const xSmallInputFontSize = "0.9rem";

const xSmallButtonStyles = {
  padding: xSmallPadding,
  fontSize: xSmallFontSize,
  lineHeight: 1.5,
  minHeight: xSmallMinHeight,
  minWidth: "56px",
  "& .MuiButton-startIcon, & .MuiButton-endIcon": {
    margin: 0,
  },
  "& svg": {
    fontSize: "1.2rem",
  },
};

const xSmallGroupButtonStyles = {
  ...xSmallButtonStyles,
  padding: xSmallGroupPadding,
  minWidth: 0,
};

const xSmallInputStyles = {
  "& .MuiInput-root.MuiInput-underline": {
    marginTop: 0,
  },
  "& .MuiInputBase-input": {
    fontSize: xSmallInputFontSize,
    padding: "6px 8px",
  },
  "& .MuiInputBase-input.MuiSelect-select, & .MuiInputBase-input.MuiAutocomplete-input": {
    padding: "2.5px 4px 2.5px 8px",
  },
  "& .MuiInputBase-adornedStart": { paddingLeft: "8px" },
  "& .MuiInputBase-inputAdornedStart": { paddingLeft: 0 },
  "& .MuiInputBase-adornedEnd": { paddingRight: "8px" },
  "& .MuiInputBase-inputAdornedEnd": { paddingRight: 0 },
  "& svg": {
    fontSize: "1.2rem",
  },
  "& .MuiFormControlLabel-label": {
    fontSize: xSmallInputFontSize,
  },
  "& .MuiInputLabel-root": {
    fontSize: xSmallInputFontSize,
    transform: "translate(10px, 7px) scale(1)",
    "&.MuiInputLabel-shrink": {
      transform: "translate(13px, -9px) scale(0.75)",
    },
  },
};

export const theme = createTheme({
  cssVariables: true,
  typography: {
    h1: { fontSize: "2.5rem" },
    h2: { fontSize: "2.2rem" },
    h3: { fontSize: "1.9rem" },
    h4: { fontSize: "1.6rem" },
    h5: { fontSize: "1.4rem" },
    h6: { fontSize: "1.2rem" },
  },
  components: {
    MuiFormControlLabel: {
      variants: [
        {
          props: { size: "x-small" },
          style: xSmallInputStyles,
        },
      ],
    },
    MuiCheckbox: {
      variants: [
        {
          props: { size: "x-small" },
          style: xSmallGroupButtonStyles,
        },
      ],
    },
    MuiButton: {
      defaultProps: {
        size: "small",
      },
      variants: [
        {
          props: { size: "x-small" },
          style: xSmallButtonStyles,
        },
      ],
    },
    MuiIconButton: {
      defaultProps: {
        size: "small",
      },
      variants: [
        {
          props: { size: "x-small" },
          style: xSmallGroupButtonStyles,
        },
      ],
    },
    MuiButtonGroup: {
      variants: [
        {
          props: { size: "x-small" },
          style: {
            "& .MuiButton-root": xSmallGroupButtonStyles,
          },
        },
      ],
    },
    MuiToggleButtonGroup: {
      variants: [
        {
          props: { size: "x-small" },
          style: {
            "& .MuiToggleButton-root": xSmallGroupButtonStyles,
          },
        },
      ],
    },
    MuiToggleButton: {
      variants: [
        {
          props: { size: "x-small" },
          style: xSmallButtonStyles,
        },
      ],
    },
    MuiInputBase: {
      variants: [
        {
          props: { size: "x-small" },
          style: xSmallInputStyles,
        },
      ],
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
      variants: [
        {
          props: { size: "x-small" },
          style: xSmallInputStyles,
        },
      ],
    },
    MuiAutocomplete: {
      variants: [
        {
          props: { size: "x-small" },
          style: {
            "& .MuiAutocomplete-inputRoot": {
              padding: "4px",
            },
            ...xSmallInputStyles,
          },
        },
      ],
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
      variants: [
        {
          props: { size: "x-small" },
          style: xSmallInputStyles,
        },
      ],
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
