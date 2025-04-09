import { ThemeProvider } from "@emotion/react";
import { Button } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useState } from "react";
import { AutocompleteElement, FormContainer } from "react-hook-form-mui";
import { theme } from "src/theme";
import { StateProvider } from "../appContext";
import { Field } from "./form/Field";
export default {
  title: "Components/Field",
  component: Field,
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <StateProvider>
            <FormContainer
              defaultValues={{
                textField: "Sample text",
                numberField: 42,
                multilineField: "This is a\nmultiline text field",
                checkboxField: true,
                radioField: "option1",
                dateField: dayjs(),
                dateStringField: "05/15/2023",
                selectField: "option2",
                htmlField: "<p>This is <strong>HTML</strong> content</p>",
                ItemSelect: { id: 2, label: "Option 2" },
                yearField: { id: 2022, label: "2022" },
                monthField: { id: 5, label: "May" },
                dayField: { id: 15, label: "15" },
                mediaTypeField: { id: "PDF", label: "PDF" },
                autocomplete: { id: "option1", label: "Option 1" },
              }}
              onSubmit={() => {}}
            >
              <Story />
              <Button type="submit">Submit</Button>
            </FormContainer>
          </StateProvider>
        </LocalizationProvider>
      </ThemeProvider>
    ),
  ],
  argTypes: {
    disabled: {
      control: "boolean",
      description: "Read-only mode",
      defaultValue: false,
    },
    highlightDirty: {
      control: "boolean",
      description: "Highlight updates",
      defaultValue: false,
    },
    fullWidth: {
      control: "boolean",
      description: "Whether the field should take full width",
      defaultValue: true,
    },
    variant: {
      control: "select",
      options: ["outlined", "filled", "standard"],
      description: "Material UI TextField variant",
      defaultValue: "outlined",
    },
    margin: {
      control: "select",
      options: ["none", "dense", "normal"],
      description: "Material UI margin variant",
      defaultValue: "dense",
    },
  },
};

// Basic Text Field
export const TextField = (args) => <Field name="textField" label="Text Field" {...args} />;

export const DiffField = (args) => <Field name="textField" label="Text Field" color="warning" {...args} />;

// Number Field
export const NumberField = (args) => <Field name="numberField" type="number" label="Number Field" {...args} />;

// Multiline Text Field
export const MultilineTextField = (args) => (
  <Field name="multilineField" label="Multiline Text Field" multiline rows={4} {...args} />
);

// Checkbox Field
export const CheckboxField = (args) => (
  <Field name="checkboxField" field_type="checkbox" label="Checkbox Field" {...args} />
);

// Radio Field
export const RadioField = (args) => (
  <Field
    name="radioField"
    field_type="radio"
    label="Radio Option 1"
    options={[
      { id: "option1", label: "Option 1" },
      { id: "option2", label: "Option 2" },
      { id: "option3", label: "Option 3" },
    ]}
    {...args}
  />
);

// Date Field
export const DateField = (args) => <Field name="dateField" field_type="date" label="Date Field" {...args} />;

// DateTime Field
export const DateTimeField = (args) => (
  <Field name="dateField" field_type="date-time" label="DateTime Field" {...args} />
);

// Date String Field
export const DateStringField = (args) => (
  <Field
    name="dateStringField"
    field_type="datestring"
    label="Date String Field"
    helperText="MM/DD/YYYY format - enter '00' for unknown day or month"
    {...args}
  />
);

// Select Field
export const SelectField = (args) => (
  <Field
    name="selectField"
    field_type="select"
    label="Select Field"
    options={[
      { id: "option1", label: "Option 1" },
      { id: "option2", label: "Option 2" },
      { id: "option3", label: "Option 3" },
    ]}
    {...args}
  />
);

// Simple Select Field
export const ItemSelect = (args) => (
  <Field
    name="ItemSelect"
    field_type="select"
    label="Author Select"
    searchType="list_items"
    searchParams={{ type: "authors" }}
    {...args}
  />
);

// Media Type Select Field
export const ListItemSelect = (args) => (
  <Field
    fetchAll
    field_type="list_item"
    itemType="quality"
    label="Quality"
    service="list_items"
    name="ListItemSelect"
    {...args}
  />
);

// HTML Field
export const RichTextField = (args) => (
  <Field name="richTextField" field_type="richtext" label="HTML Field" {...args} />
);

// Field with Error
export const FieldWithError = (args) => {
  const CustomField = (props) => {
    const context = {
      errors: { textField: "This field has an error" },
      setFieldValue: () => {},
    };

    return <Field error={true} required {...props} context={context} />;
  };

  return <CustomField name="textField" label="Field with Error" {...args} />;
};

// Field with Helper Text
export const FieldWithHelperText = (args) => (
  <Field
    name="textField"
    label="Field with Helper Text"
    helperText="This is some helpful information about the field"
    {...args}
  />
);

export const SwitchField = (args) => <Field name="switchField" field_type="switch" label="Switch Field" {...args} />;

// Read-only Field
export const ReadOnlyField = (args) => <Field name="textField" label="Read-only Field" ro={true} {...args} />;

const staticOptions = [
  { id: "option1", label: "Option 1" },
  { id: "option2", label: "Option 2" },
  { id: "option3", label: "Option 3" },
];
export const AutocompleteTest = (args) => {
  const [options, setOptions] = useState([staticOptions[0]]);
  // setTimeout(() => {
  //   setOptions(staticOptions);
  // }, 1000);
  return (
    <>
      <AutocompleteElement
        name="autocomplete"
        label="Autocomplete"
        // matchId
        // {...args}
        autocompleteProps={{
          onInputChange: (value, reason) => {
            if (reason === "input") {
              setTimeout(() => {
                setOptions(staticOptions);
              }, 3000);
            }
          },
        }}
        options={options}
      />

      <hr />
      <Field name="autocomplete" label="Autocomplete" field_type="autocomplete" searchType="test" {...args} />
    </>
  );
};

// All Field Types in One View
export const AllFieldTypes = (args) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
    <TextField {...args} />
    <NumberField {...args} />
    <MultilineTextField {...args} />
    <CheckboxField {...args} />
    <RadioField {...args} />
    <DateField {...args} />
    <DateTimeField {...args} />
    <DateStringField {...args} />
    {/* <SelectField {...args}/> */}
    <ItemSelect {...args} />
    <ListItemSelect {...args} />
    <RichTextField {...args} />
    <FieldWithError {...args} />
    <FieldWithHelperText {...args} />
    <SwitchField {...args} />
    <ReadOnlyField {...args} />
  </div>
);
