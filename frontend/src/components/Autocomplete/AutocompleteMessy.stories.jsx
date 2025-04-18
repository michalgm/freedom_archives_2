import { FormContainer, useForm, useFormContext } from "react-hook-form-mui";

import { Field } from "../form/Field";

// const defaultValues = {
//   textField: "Sample text",
//   numberField: 42,
//   multilineField: "This is a\nmultiline text field",
//   checkboxField: true,
//   radioField: "option1",
//   // dateField: dayjs(),
//   dateStringField: "05/15/2023",
//   selectField: "option2",
//   htmlField: "<p>This is <strong>HTML</strong> content</p>",
//   ItemSelect: { id: 2, label: "Option 2" },
//   yearField: { id: 2022, label: "2022" },
//   monthField: { id: 5, label: "May" },

//   dayField: { id: 15, label: "15" },
//   mediaTypeField: { id: "PDF", label: "PDF" },
//   autocomplete: { id: "option1", label: "Option 1" },
// };
export default {
  title: "Components/Autocomplete/Messy",
  component: Field,
  tags: ["autodocs"],
  args: {
    returnFullObject: true,
    field_type: "autocomplete_messy",
    multiple: false,
    formDefaultValue: "",
  },
  // argTypes: {
  //   returnFullObject: {
  //     control: { type: "boolean" },
  //     description: "Whether to store the full object or just the ID",
  //     defaultValue: true,
  //     table: {
  //       type: { summary: "boolean" },
  //       defaultValue: { summary: true },
  //     },
  //   },
  // },
  decorators: [
    (Story, context) => {
      const formDefaultValue = context.args.formDefaultValue;
      return (
        <div key={JSON.stringify(context.args)}>
          <FormContainer key={formDefaultValue} defaultValues={{ [context.args.name]: formDefaultValue }}>
            <Story />
            <ShowValue name={context.args.name} />
          </FormContainer>
        </div>
      );
    },
  ],
};

const ShowValue = ({ name }) => {
  const { watch } = useFormContext();
  const value = watch(name);
  return <pre>{JSON.stringify(value, null, 2)}</pre>;
};

export const MultiListItem = {
  args: {
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
    service: "list_items",
    searchParams: { type: "author" },
    create: true,
  },
};

export const ListItem = {
  args: {
    name: "demo-autocomplete",
    label: "Authors",
    service: "list_items",
  },
};
export const ListItemWithCreate = {
  args: {
    name: "demo-autocomplete",
    label: "Authors",
    service: "list_items",
    create: true,
  },
};

// Basic static options example
export const WithStaticOptions = {
  args: {
    name: "demo-autocomplete",
    label: "Authors",
    options: [
      { id: "1", label: "Option 1" },
      { id: "2", label: "Option 2" },
      { id: "3", label: "Option 3" },
    ],
  },
};

// With custom rendering
export const WithCustomRendering = {
  args: {
    ...WithStaticOptions.args,
    autocompleteProps: {
      renderOption: (props, option) => (
        <li {...props} key={option.id}>
          {option.label} - Custom Render
        </li>
      ),
    },
  },
};
