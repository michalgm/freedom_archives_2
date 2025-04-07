import { useMemo } from "react";

import { Check } from "@mui/icons-material";
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Grid2,
  InputAdornment,
  Radio,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { Box } from "@mui/system";
import { DatePicker, DateTimePicker } from "@mui/x-date-pickers";
import { capitalize, merge } from "lodash-es";
import {
  CheckboxButtonGroup,
  CheckboxElement,
  Controller,
  RadioButtonGroup,
  SwitchElement,
  TextFieldElement,
  ToggleButtonGroupElement,
} from "react-hook-form-mui";
import { DatePickerElement, DateTimePickerElement } from "react-hook-form-mui/date-pickers";

import { renderToStaticMarkup } from "react-dom/server";
import Autocomplete from "../Autocomplete/Autocomplete";

import DateStringField from "../DateStringField";
import { EditableItem } from "./EditableItem";
import RichTextInput from "./RichTextInput";

export const convertSvgToDataUrl = (Icon, color = "white") => {
  return `url('data:image/svg+xml,${renderToStaticMarkup(<Icon style={{ fill: color }} />).replace(
    "<svg ",
    '<svg xmlns="http://www.w3.org/2000/svg" '
  )}')`;
};

const selectOptions = {
  media_types: ["Audio", "Webpage", "Video", "PDF"].map((id) => ({
    id,
    label: id,
  })),
};
export const formatLabel = (label, name) => {
  if (label?.trim() === "") {
    return null;
  } else if (label) {
    return label;
  }

  const index = name.lastIndexOf(".");
  return name
    .slice(index + 1)
    .replace(/_/g, " ")
    .replace(/\w+/g, (word) => {
      return ["and"].includes(word) ? word : capitalize(word);
    })
    .replace(/\b(bipoc|id\/pfn)\b/gi, (s) => s.toUpperCase());
};

const transformOptions = (options) => {
  if (!options) return null;
  return options.map((option) => {
    if (typeof option === "string") {
      return { value: option, label: formatLabel(option) };
    }
    return option;
  });
};

export const BaseField = ({
  name,
  ro,
  field_type = "text",
  tabIndex,
  fullWidth = true,
  helperText = "",
  options: defaultOptions,
  value,
  onChange,
  isRHF,
  control,
  color,
  endAdornment,
  startAdornment,
  margin,
  textFieldProps: defaultTextFieldProps,
  ...props
}) => {
  // const { setValue, getValues } = useFormContext()

  props.label = formatLabel(props.label, name);
  props.disabled = Boolean(props.disabled || ro) ? true : undefined; //FIXME;
  const disabled = Boolean(props.disabled);

  const variant = props.variant || disabled ? "filled" : "outlined";

  if (!isRHF) {
    props.onChange = onChange;
    props.value = value;
  }

  const textFieldProps = useMemo(() => {
    const textFieldProps = {
      name,
      margin: margin || "dense",
      helperText,
      variant: props.variant || "outlined",
      fullWidth: fullWidth,
      size: "small",
      color,
      tabIndex: tabIndex || undefined,
      ...defaultTextFieldProps,
    };
    if (endAdornment) {
      textFieldProps.InputProps = merge(textFieldProps.InputProps || {}, {
        endAdornment: <InputAdornment position="end">{endAdornment}</InputAdornment>,
      });
    }
    if (startAdornment) {
      textFieldProps.InputProps = merge(textFieldProps.InputProps || {}, {
        startAdornment: <InputAdornment position="start">{startAdornment}</InputAdornment>,
      });
    }
    return textFieldProps;
  }, [
    color,
    defaultTextFieldProps,
    fullWidth,
    helperText,
    name,
    tabIndex,
    endAdornment,
    startAdornment,
    margin,
    props.variant,
  ]);

  const renderDatePicker = () => {
    const Component = isRHF
      ? field_type === "date-time"
        ? DateTimePickerElement
        : DatePickerElement
      : field_type === "date-time"
        ? DateTimePicker
        : DatePicker;
    delete props.disabled;
    return (
      <Component
        {...props}
        label={props.label}
        name={name}
        onChange={onChange}
        inputProps={textFieldProps}
        timeSteps={{ minutes: 1 }}
        slotProps={{
          field: { clearable: true },
        }}
        {...(disabled ? { disabled } : {})}
      />
    );
  };

  const renderAutocomplete = () => {
    const options = transformOptions(defaultOptions);

    if (field_type === "list_item") {
      const { itemType } = props;
      props.service = "list_items";
      props.searchParams = {
        ...(props.searchParams || {}),
        type: itemType,
      };
      props.createParams = {
        ...(props.createParams || {}),
        type: itemType,
      };
    }
    return (
      <Autocomplete
        name={name}
        options={options}
        label={props.label}
        textFieldProps={textFieldProps}
        isRHF={isRHF}
        onChange={onChange}
        value={value}
        {...props}
      />
    );
  };

  const renderRichTextField = () => {
    const textFieldOptions = {
      ...textFieldProps,
      multiline: true,
      minRows: props.minRows || 3,
      content: value,
      onChange,
      ...props,
    };
    if (isRHF) {
      return (
        <Controller
          key={name}
          name={name}
          control={control}
          rules={{
            required: props.required && "This field is required",
          }}
          render={({ field, formState }) => (
            <RichTextInput
              {...textFieldOptions}
              content={field.value}
              onChange={field.onChange}
              error={formState.errors[name]}
            />
          )}
        />
      );
    }
    return <RichTextInput {...textFieldOptions} />;
  };

  const renderTextField = () => {
    const Component = isRHF ? TextFieldElement : TextField;

    const textFieldOptions = field_type === "textarea" ? { multiline: true, minRows: props.minRows || 3 } : {};
    return <Component {...textFieldProps} {...textFieldOptions} {...props} onChange={onChange} />;
  };

  const renderRadioGroup = () => {
    const options = transformOptions(defaultOptions);
    return (
      <RadioButtonGroup
        name={name}
        {...props}
        onChange={onChange}
        options={options}
        labelProps={{
          className: "radio-label",
          sx: {
            userSelect: "none",
          },
        }}
      ></RadioButtonGroup>
    );
  };

  const renderRadio = () => {
    return (
      <Controller
        key={name}
        name={name}
        control={control}
        render={({ field, formState }) => (
          <Radio
            {...props}
            {...field}
            checked={field.value === value}
            onChange={onChange}
            error={formState.errors[name]}
            value={value}
          ></Radio>
        )}
      />
    );
  };

  const renderCheckboxGroup = () => {
    if (isRHF) {
      return (
        <Box
          sx={{
            ".MuiFormControl-root": {
              width: "100%",
            },
            ".MuiFormGroup-root": {
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              width: "100%",
              justifyItems: "stretch",
            },
          }}
        >
          <CheckboxButtonGroup
            variant="outlined"
            color="primary"
            name={name}
            label={props.label}
            options={transformOptions(defaultOptions)}
            {...props}
          />
        </Box>
      );
    }
    return (
      <Grid2 container spacing={2}>
        <FormControl sx={{ m: 3 }} component="fieldset" variant="standard" onChange={onChange} color={color}>
          <FormLabel component="legend">{props.label}</FormLabel>
          <FormGroup>
            {defaultOptions.map((option) => (
              <Grid2 key={option} size={6}>
                <FormControlLabel control={<Checkbox name={`${name}_${option}`} />} label={option} />
              </Grid2>
            ))}
          </FormGroup>
          <FormHelperText>{helperText}</FormHelperText>
        </FormControl>
      </Grid2>
    );
  };

  const renderCheckbox = () => {
    const Component = isRHF ? CheckboxElement : Checkbox;
    return (
      <Component
        name={`${name}`}
        label={props.label}
        labelProps={{ color, sx: { userSelect: "none" } }}
        onChange={onChange}
        color={color}
        helperText={helperText}
        required={props.required}
      />
    );
    // return <FormGroup>
    //   <FormControlLabel
    //     control={
    //     }
    //     label={props.label}
    //   />
    // </FormGroup>
  };

  const checkBoxImageUrl = convertSvgToDataUrl(Check);

  const renderSwitch = () => {
    const Component = isRHF ? SwitchElement : Switch;
    const switchInput = (
      <Component
        name={name}
        checked={value}
        onChange={onChange}
        color={color}
        {...props}
        labelProps={{
          sx: {
            userSelect: "none",
          },
        }}
        sx={{
          userSelect: "none",
          "& .MuiSwitch-thumb": {
            position: "relative",
            "&:before": {
              content: '""',
              position: "absolute",
              width: "16px",
              height: "16px",
              left: 2,
              top: 2,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              backgroundImage: checkBoxImageUrl,
              opacity: 0,
              transition: "opacity 200ms",
            },
          },
          "& .Mui-checked .MuiSwitch-thumb": {
            "&:before": {
              opacity: 1,
            },
          },
          ...props.sx,
        }}
      />
    );
    if (isRHF) {
      return switchInput;
    }
    return (
      <FormControlLabel
        control={switchInput}
        label={props.label}
        disabled={props.disabled}
        required={props.required}
        labelPlacement={props.labelPlacement}
      />
    );
  };

  const renderToggleButton = () => {
    const options = transformOptions(defaultOptions);
    if (isRHF) {
      return <ToggleButtonGroupElement name={name} value={value} onChange={onChange} options={options} {...props} />;
    }
    return (
      <ToggleButtonGroup name={name} value={value} onChange={onChange} {...props}>
        {options.map((option) => (
          <ToggleButton key={option.value} value={option.value}>
            {option.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );
  };

  const renderEditableItem = () => {
    return (
      <EditableItem
        name={name}
        value={value || ""}
        label={props.label}
        // error={error}
        helperText={helperText}
        {...textFieldProps}
        {...props}
      />
    );
  };

  const renderDateString = () => {
    return (
      <DateStringField
        variant={variant}
        disabled={disabled}
        label={props.label}
        value={value}
        name={name}
        // error={error}
        helperText={helperText}
        onChange={onChange}
        {...textFieldProps}
        {...props}
      />
    );
  };

  const renderMediaType = () => {
    const options = selectOptions["media_type"];
    return <BaseField options={options} {...props} field_type="select" />;
  };

  switch (field_type) {
    case "checkbox":
      return renderCheckbox();
    case "checkbox_group":
      return renderCheckboxGroup();
    case "radio":
      return renderRadio();
    case "radio_group":
      return renderRadioGroup();
    case "switch":
      return renderSwitch();
    case "date-time":
    case "date":
      return renderDatePicker();
    case "richtext":
    case "html":
      return renderRichTextField();
    case "list_item":
    case "select":
    case "autocomplete":
      return renderAutocomplete();
    case "togglebutton":
      return renderToggleButton();
    case "editableItem":
      return renderEditableItem();
    case "datestring":
      return renderDateString();
    case "media_type":
      return renderMediaType();
    case "textarea":
    default:
      return renderTextField();
  }
};
