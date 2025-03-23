import { FormContainer } from "react-hook-form-mui";
// import { SnackBarProvider } from "../utils/SnackBar";

import { Field } from "../form/Field";
import Autocomplete from "./Autocomplete";
export default {
  title: "Components/Autocomplete",
  component: Field,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <FormContainer
        defaultValues={{
          textField: "Sample text",
          numberField: 42,
          multilineField: "This is a\nmultiline text field",
          checkboxField: true,
          radioField: "option1",
          // dateField: dayjs(),
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
      </FormContainer>
    ),
  ],
};

export const MultiListItem = {
  args: {
    field_type: "autocomplete",
    name: "demo-autocomplete",
    label: "Authors",
    service: "list_items",
    multiple: true,
  },
};

export const MultiListItemWithCreate = {
  args: {
    name: "authors",
    multiple: true,
    field_type: "autocomplete",
    service: "list_items",
    searchParams: { type: "author" },
    create: true,
  },
};

export const ListItem = {
  args: {
    field_type: "autocomplete",
    name: "demo-autocomplete",
    label: "Authors",
    service: "list_items",
  },
};
export const ListItemWithCreate = {
  args: {
    field_type: "autocomplete",
    name: "demo-autocomplete",
    label: "Authors",
    service: "list_items",
    create: true,
  },
};

// Basic static options example
export const WithStaticOptions = {
  args: {
    field_type: "autocomplete",
    name: "demo-autocomplete",
    label: "Authors",
    options: [
      { id: 1, label: "Option 1" },
      { id: 2, label: "Option 2" },
      { id: 3, label: "Option 3" },
    ],
    storeFullObject: false,
  },
};

// With custom rendering
export const WithCustomRendering = {
  args: {
    ...WithStaticOptions.args,
    renderOption: (props, option) => (
      <li {...props} key={option.id}>
        {option.label} - Custom Render
      </li>
    ),
  },
};
