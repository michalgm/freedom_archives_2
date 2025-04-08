import { Box, MenuItem, TextField } from "@mui/material";
import RecordItem, { CollectionItem } from "./EditableItemsList";

import { Field } from "formik";
import { Autocomplete } from "formik-mui";
import React from "react";
import { useDebouncedCallback } from "use-debounce";
import useDeepCompareEffect from "use-deep-compare-effect";
import { services } from "../api";

const searchTypes = {
  list_items: {
    id: "list_item_id",
    label: "item",
  },
  collections: {
    id: "collection_id",
    label: "collection_name",
    fields: ["collection_id", "collection_name", "thumbnail", "parent"],
    renderOption: (item) => <CollectionItem collection={item} component="div" dense />,
  },
  records: {
    id: "record_id",
    label: "title",
    fields: [
      "record_id",
      "title",
      "parent_record_id",
      "primary_instance_thumbnail",
      "primary_instance_format_text",
      "primary_instance_media_type",
      "collection",
    ],
    renderOption: (item) => <RecordItem record={item} component="div" dense />,
  },
  value_lookup: {
    id: "value",
    label: "value",
  },
  users: {
    id: "user_id",
    label: "full_name",
    fields: ["user_id", "full_name"],
    renderOption: (item) => <Box>{item.full_name}</Box>,
    searchFields: ["username", "full_name", "email"],
  },
};

let active = false;

const SelectField = ({
  isMulti,
  // ro,
  defaultValue,
  label,
  name,
  // validateChange,
  onChange: customOnChange,
  // onBlur,
  searchType,
  setFieldValue,
  searchParams = {},
  fetchAll,
  // autoHighlight,
  excludeIds,
  // managed,
  clearOnChange,
  // loadOptions: inputLoadOptions,
  InputProps,
  error,
  helperText,
  ...props
}) => {
  const { id: typeId, label: typeLabel, renderOption, fields, searchFields = [] } = searchTypes[searchType];
  const [open, setOpen] = React.useState(props.autoFocus || false);
  const [inputValue, setInputValue] = React.useState("");
  const [options, setOptions] = React.useState([]);
  const has_options = options.length !== 0;
  const loading = Boolean(open && inputValue);

  const value = inputValue || (defaultValue && defaultValue[typeLabel] ? defaultValue[typeLabel] : null);

  const currentValues = (Array.isArray(defaultValue) ? defaultValue : [defaultValue]).map((item) => item[typeLabel]);

  const $select = fields || [typeId, typeLabel];
  const query = {
    $select,
    $sort: { [typeLabel]: 1 },
    $limit: fetchAll ? 10000 : 100,
    ...searchParams,
  };

  if (!fetchAll) {
    if (searchFields.length) {
      query.$or = searchFields.map((field) => ({ [field]: { $ilike: `%${value}%` } }));
    } else {
      query[typeLabel] = { $ilike: `%${value}%` };
    }
  }
  if (excludeIds) {
    query[typeId] = { $nin: excludeIds };
  }
  if (isMulti) {
    query[typeId] = {
      $nin: defaultValue.map((item) => item[typeId]).filter((v) => v !== "new"),
    };
  }
  React.useEffect(() => {
    const value = defaultValue?.[typeLabel] ?? "";
    setInputValue(value);
  }, [defaultValue, typeLabel]);

  const fetchOptions = useDebouncedCallback(
    async () => {
      if (!value && !fetchAll) {
        return;
      }
      const { data: options } = await services[searchType].find({
        noLoading: true,
        query,
      });

      const newOptions = options.filter((o) => o[typeLabel].trim());
      if (currentValues[0] != null) {
        newOptions.push({ [typeId]: null, [typeLabel]: "", clear: true });
      }
      const optionValues = options.map((o) => o[typeLabel]);
      (isMulti ? defaultValue : [defaultValue]).forEach((value) => {
        if (!optionValues.includes(value[typeLabel])) {
          newOptions.push({ ...value, hidden: true });
        }
      });
      setOptions(newOptions);
      active = false;
    },
    fetchAll ? 0 : 250
  );

  useDeepCompareEffect(() => {
    if ((fetchAll && has_options) || (!fetchAll && !value)) {
      return undefined;
    }
    active = true;
    fetchOptions();
  }, [query, searchType, fetchAll, value, loading, has_options]);

  const onChange = React.useCallback(
    async (event, option) => {
      const customResults = customOnChange && (await customOnChange(event, option));
      if (clearOnChange && customResults !== false) {
        await setFieldValue(name, null);
      }
      setOptions([]);
    },
    [setFieldValue, name, clearOnChange, customOnChange]
  );

  return (
    <Field
      component={Autocomplete}
      handleHomeEndKeys
      loading={active}
      multiple={isMulti}
      open={open}
      autoHighlight
      onOpen={() => {
        setOpen(true);
      }}
      onClose={() => {
        setOpen(false);
      }}
      filterOptions={(x) => x}
      getOptionLabel={(item) => item[typeLabel] || ""}
      isOptionEqualToValue={(option, value) => {
        if (!value[typeId] && !option[typeId]) {
          return true;
        }
        return value[typeLabel] ? option[typeLabel] === value[typeLabel] : option[typeLabel] === value;
      }}
      options={options}
      renderInput={(params) => (
        <TextField
          {...params}
          name={name}
          label={label}
          helperText={helperText}
          error={error}
          variant={props.variant || "outlined"}
          autoFocus={props.autoFocus || false}
          slotProps={{
            input: {
              ...params.InputProps,
              ...(InputProps || {}),
            },

            inputLabel: { ...params.InputLabelProps, shrink: true },
          }}
        />
      )}
      onChange={onChange}
      renderOption={(props, option) => {
        const key = option[typeId];
        if (option.hidden || !key) {
          return null;
        }
        if (renderOption) {
          return (
            <MenuItem {...props} key={key}>
              {renderOption(option)}
            </MenuItem>
          );
        } else {
          return (
            <MenuItem {...props} key={key}>
              {option[typeLabel]}
            </MenuItem>
          );
        }
      }}
      onInputChange={(_, option) => {
        setInputValue(option);
        setOptions([]);
        active = true;
      }}
      name={name}
      loadingText="Loading...."
      inputValue={inputValue}
      blurOnSelect
      slotProps={{
        paper: { sx: { width: "max-content" } },
      }}
      {...props}
    />
  );
};

export default SelectField;
