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
import { merge } from "lodash-es";
import { useMemo } from "react";
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
import { formatLabel } from "src/components/form/schemaUtils";
import { convertSvgToDataUrl } from "src/utils";

import Autocomplete from "../Autocomplete/Autocomplete";
import OldAutocomplete from "../Autocomplete/AutocompleteMessy";
import DateStringField from "../DateStringField";

import { EditableItem } from "./EditableItem";
import RichTextInput from "./RichTextInput";

const selectOptions = {
  day: Array.from({ length: 32 }, (v, k) => ({
    id: k || null,
    label: `${k || "??"}`,
  })),
  month: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ].map((label, index) => ({ id: index + 1 || null, label })),
  year: [
    { id: null, label: "??" },
    ...Array.from({ length: new Date().getFullYear() - 1900 }, (v, k) => ({
      id: k + 1900,
      label: k + 1900 + "",
    })),
  ],
  media_types: ["Audio", "Webpage", "Video", "PDF"].map((id) => ({
    id,
    label: id,
  })),
};

const transformOptions = (options) => {
  if (!options) return null;
  return options.map((option) => {
    if (typeof option === "string") {
      return { id: option, value: option, label: formatLabel(option) };
    }
    return option;
  });
};

const AutocompleteWrapper = ({
  name,
  value,
  onChange,
  textFieldProps,
  options,
  isRHF,
  field_type,
  itemType,
  label,
  searchParams: rawSearchParams,
  createParams: rawCreateParams,
  service: rawService,
  autocompleteProps = {},
  ...restProps
}) => {
  const service = field_type === "list_item" ? "list_items" : rawService;

  const searchParams = useMemo(() => {
    return field_type === "list_item" ? { ...rawSearchParams, type: itemType } : rawSearchParams;
  }, [field_type, rawSearchParams, itemType]);

  const createParams = useMemo(() => {
    return field_type === "list_item" ? { ...rawCreateParams, type: itemType } : rawCreateParams;
  }, [field_type, rawCreateParams, itemType]);

  return (
    <Autocomplete
      name={name}
      options={options}
      label={label}
      isRHF={isRHF}
      onChange={onChange}
      value={value}
      service={service}
      textFieldProps={textFieldProps}
      autocompleteProps={{ ...autocompleteProps }}
      searchParams={searchParams}
      createParams={createParams}
      {...restProps}
    />
  );
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
  size,
  error: _error,
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

  const options = useMemo(() => transformOptions(defaultOptions), [defaultOptions]);

  const textFieldProps = useMemo(() => {
    const textFieldProps = {
      name,
      margin: margin || "dense",
      helperText,
      variant: props.variant || "outlined",
      fullWidth: fullWidth,
      size: size || "small",
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
    name,
    margin,
    helperText,
    props.variant,
    fullWidth,
    size,
    color,
    tabIndex,
    defaultTextFieldProps,
    endAdornment,
    startAdornment,
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
    return (
      <AutocompleteWrapper
        {...{
          name,
          ro,
          tabIndex,
          value,
          onChange,
          isRHF,
          endAdornment,
          startAdornment,
        }}
        onChange={onChange}
        textFieldProps={textFieldProps}
        options={options}
        field_type={field_type}
        {...props}
      />
    );

    // const { itemType, searchParams: rawSearchParams = {}, createParams: rawCreateParams, label, ...restProps } = props;
    // const extraProps = { ...restProps };
    // const service = field_type === "list_item" ? "list_items" : props.service;
    // const searchParams = useMemo(() => {
    //   if (field_type === "list_item") {
    //     return { ...rawSearchParams, type: itemType };
    //   }
    //   return rawSearchParams;
    // }, [field_type, rawSearchParams, itemType]);

    // const createParams = useMemo(() => {
    //   if (field_type === "list_item") {
    //     return { ...rawCreateParams, type: itemType };
    //   }
    //   return rawCreateParams;
    // }, [field_type, rawCreateParams, itemType]);
    // if (field_type === "list_item") {
    //   extraProps.service = "list_items";
    //   extraProps.searchParams = { ...searchParams, type: itemType };
    //   extraProps.createParams = { ...createParams, type: itemType };
    // }
    // // if (field_type === "list_item") {
    // //   const { itemType } = props;
    // //   props.service = "list_items";
    // //   props.searchParams = {
    // //     ...(props.searchParams || {}),
    // //     type: itemType,
    // //   };
    // //   props.createParams = {
    // //     ...(props.createParams || {}),
    // //     type: itemType,
    // //   };
    // // }
    // return (
    //   <Autocomplete
    //     name={name}
    //     options={options}
    //     label={label}
    //     textFieldProps={textFieldProps}
    //     isRHF={isRHF}
    //     onChange={onChange}
    //     value={value}
    //     {...extraProps}
    //   />
    // );
  };

  const renderOldAutocomplete = () => {
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
      <OldAutocomplete
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
              <FormControlLabel key={option} control={<Checkbox name={`${name}_${option}`} />} label={option} />
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
        name={name}
        label={props.label}
        labelProps={{ color, sx: { userSelect: "none" } }}
        onChange={onChange}
        color={color}
        helperText={helperText}
        required={props.required}
        {...props}
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
    const { error: _e, labelProps: _lp, ...rest } = props;
    const switchInput = (
      <Component
        name={name}
        checked={value}
        onChange={onChange}
        color={color}
        {...rest}
        slotProps={{
          label: {
            sx: {
              userSelect: "none",
            },
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
        onChange={onChange}
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

  const renderSimpleSelect = () => {
    const { selectType, ...rest } = props;
    const options = selectOptions[selectType];
    if (!options) {
      logger.error(`Unable to find options for select type ${selectType}`);
      return null;
    }
    return (
      <BaseField
        value={value}
        name={name}
        options={options}
        label={props.label}
        // error={error}
        helperText={helperText}
        onChange={onChange}
        {...textFieldProps}
        {...rest}
        field_type="select"
      />
    );
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
    case "simpleSelect":
      return renderSimpleSelect();
    case "autocomplete_messy":
      return renderOldAutocomplete();
    case "togglebutton":
      return renderToggleButton();
    case "editableItem":
      return renderEditableItem();
    case "datestring":
      return renderDateString();
    case "textarea":
    default:
      return renderTextField();
  }
};
