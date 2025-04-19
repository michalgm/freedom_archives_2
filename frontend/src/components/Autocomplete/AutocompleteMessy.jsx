
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid2,
  InputAdornment,
  MenuItem,
  Autocomplete as MUIAutocomplete,
  TextField,
} from "@mui/material";
import { debounce, merge } from "lodash-es";
import { memo, useCallback, useMemo, useState } from "react";
import { AutocompleteElement, FormProvider, useForm, useFormContext } from "react-hook-form-mui";

// import { useDisplayError } from "../SnackBar";
import { services } from "../../api";
import { useDisplayError } from "../../appContext";
import RecordItem, { CollectionItem } from "../EditableItemsList";
import FieldRow from "../FieldRow";
import { Field } from "../form/Field";

const searchTypes = {
  default: {
    id: "id",
    label: "label",
  },
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

const queryApi = async ({
  searchType,
  searchParams,
  searchTerm,
  excludeIds = [],
  isMulti = false,
  fetchAll = false,
  value,
}) => {
  const { id, label = "item", fields, searchFields = [] } = searchTypes[searchType];
  const $select = fields || [id, label];
  if (!searchTerm && !fetchAll) {
    return [];
  }
  const query = {
    $select,
    $sort: { [label]: 1 },
    // $fields: fields,
    $limit: fetchAll ? 10000 : 15,
    ...searchParams,
  };

  if (!fetchAll) {
    if (searchFields.length) {
      query.$or = searchFields.map((field) => ({ [field]: { $ilike: `%${searchTerm}%` } }));
    } else {
      query[label] = { $ilike: `%${searchTerm}%` };
    }
  }
  if (excludeIds) {
    query[id] = { $nin: excludeIds };
  }
  if (isMulti) {
    query[id] = {
      $nin: value.map((item) => item[id]).filter((v) => v !== "new"),
    };
  }

  const { data: options } = await services[searchType].find({
    noLoading: true,
    query,
  });

  return options;

  // const newOptions = options.filter((o) => o[typeLabel].trim());
  // if (currentValues[0] != null) {
  //   newOptions.push({ [typeId]: null, [typeLabel]: "", clear: true });
  // }
  // const optionValues = options.map((o) => o[typeLabel]);
  // (isMulti ? defaultValue : [defaultValue]).forEach((value) => {
  //   if (!optionValues.includes(value[typeLabel])) {
  //     newOptions.push({ ...value, hidden: true });
  //   }
  // });
  // return newOptions;
};
// const displayError = (e) => {
//
// };

export const NewListItemDialog = ({ label, service, handleClose, value, createParams }) => {
  // const [listItem, setListItem] = useState({});
  const cancel = () => {
    handleClose(null);
  };

  return (
    <Dialog open={value !== null} onClose={cancel} aria-labelledby="form-Dialog-title">
      {value && <NewListItemForm {...{ label, service, value, createParams, cancel, handleClose }} />}
    </Dialog>
  );
};

const NewListItemForm = ({ label, service, value, createParams, cancel, handleClose }) => {
  const defaultValues = { value };
  const methods = useForm({
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onBlur",
  });

  const { handleSubmit } = methods;

  const onSave = async ({ value }) => {
    const result = await services[service].create({
      item: value,
      ...createParams,
    });
    handleClose(result);
  };

  const validateItem = useCallback(
    async (item) => {
      const { data } = await services.list_items.find({
        query: {
          item,
          ...createParams,
        },
      });
      if (data.length) {
        return `A ${label} named "${item}" already exists`;
      }
    },
    [label, createParams]
  );

  const handleSubmitWithoutPropagation = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(onSave)(e);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmitWithoutPropagation} autoComplete="off" noValidate>
        <Grid2 size={12} sx={{ width: 300 }}>
          <DialogTitle id="form-dialog-title">Create a new {label}</DialogTitle>
          <DialogContent>
            <FieldRow>
              <Field
                name="value"
                label=""
                rules={{
                  validate: validateItem,
                }}
              />
            </FieldRow>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancel} color="primary">
              Cancel
            </Button>
            <Button type="submit" color="primary">
              Add
            </Button>
          </DialogActions>
        </Grid2>
      </form>
    </FormProvider>
  );
};

const Autocomplete = ({
  name,
  label,
  textFieldProps,
  options: staticOptions,
  autocompleteProps: defaultAutocompleteProps,
  // query,
  value,
  onChange: customOnChange,
  helperText,
  isRHF = false,
  service = "default",
  searchParams,
  createParams,
  fetchAll = false,
  create = false,
  clearOnSelect = false,
  ...props
}) => {
  const displayError = useDisplayError();
  const { getValues, setValue } = useFormContext() || {};
  const [loading, setLoading] = useState(false);
  const [customValue, setCustomValue] = useState(null);

  const currentValue = isRHF && getValues ? getValues(name) : value;
  const typeLabel = (label || "").replace(/s$/, "").toLowerCase();
  const { id: idField, label: labelField } = searchTypes[service];

  const renderOption = useCallback(
    (props, option) => {
      const key = option[idField];
      const renderOption = searchTypes[service]?.renderOption || ((item) => item[labelField]);
      if (option.hidden || !key) {
        return null;
      }
      return (
        <MenuItem {...props} key={key}>
          {key === "new" ? (
            <i>
              Create new {typeLabel} "<b>{option.searchTerm}</b>"
            </i>
          ) : (
            renderOption(option)
          )}
        </MenuItem>
      );
    },
    [idField, typeLabel, service, labelField]
  );

  const [options, setOptions] = useState(() => {
    if (currentValue && !staticOptions) {
      if (props.multiple && Array.isArray(currentValue)) {
        return currentValue;
      }
      return [
        {
          ...(currentValue[idField] ? currentValue : { id: currentValue }),
          label: currentValue[labelField],
        },
      ];
    }
    const initialOptions = staticOptions || [];

    return initialOptions;
  });

  const handleSearch = useCallback(
    async (searchTerm = "") => {
      if (staticOptions) return;
      setLoading(true);
      try {
        const options = await queryApi({
          searchTerm,
          searchType: service,
          searchParams,
          fetchAll,
          value: currentValue,
        });
        if (searchTerm && create && !options.some((option) => option[labelField] === searchTerm)) {
          options.push({ [labelField]: `Create new ${typeLabel}`, [idField]: "new", searchTerm });
        }
        setOptions(options);
      } catch (e) {
        displayError({ severity: "error", message: e.message });
      }
      setLoading(false);
    },
    [staticOptions, fetchAll, service, searchParams, displayError, labelField, idField, typeLabel, create, currentValue]
  );

  const debouncedSearch = useMemo(
    () =>
      debounce((searchTerm) => {
        handleSearch(searchTerm);
      }, 300),
    [handleSearch]
  );

  const combinedOptions = useMemo(() => {
    if (staticOptions) {
      return staticOptions;
    }
    const optionsMap = new Map(options.map((option) => [option[idField], option]));

    if (props.multiple && Array.isArray(currentValue)) {
      currentValue.forEach((value) => {
        if (value && value[idField]) {
          optionsMap.set(value[idField], value);
        }
      });
    } else if (currentValue && currentValue[idField]) {
      optionsMap.set(currentValue[idField], currentValue);
    }

    const combinedOptions = Array.from(optionsMap.values()); //.concat([{ [typeLabel]: "Create New", [typeId]: "new" }]);

    return combinedOptions;
  }, [options, currentValue, staticOptions, props.multiple, idField]);

  const onChange = useCallback(
    async (e, value) => {
      customOnChange && customOnChange(value);
      if (clearOnSelect) {
        setTimeout(() => {
          logger.log("onChange", value, clearOnSelect);
          setValue(name, null);
          setOptions([]);
        });
      }
    },
    [customOnChange, clearOnSelect, setValue, name]
  );

  const autocompleteProps = {
    // disableClearable: true,
    handleHomeEndKeys: true,
    filterSelectedOptions: true,
    disableCloseOnSelect: false,
    clearOnBlur: true,
    blurOnSelect: false,
    onChange,
    disabled: props.disabled,
    autoHighlight: true,
    isOptionEqualToValue: (option = {}, value = {}) => {
      if (!value?.[idField] && !option?.[idField]) {
        return true;
      }
      return value?.[labelField] ? option[labelField] === value[labelField] : option[labelField] === value;
    },
    getOptionLabel: (option) => option?.[labelField] || "",
    getOptionKey: (option) => option?.[idField],
    onInputChange: (e, value, reason) => {
      if (reason === "input") {
        debouncedSearch(value);
      }
    },
    size: textFieldProps?.size || "small",
    renderOption,
    ...defaultAutocompleteProps,
  };
  if (!staticOptions) {
    autocompleteProps.filterOptions = (x) => x;
  }
  delete autocompleteProps.inputProps;
  delete autocompleteProps.helperText;

  console.log("MESSY");
  //

  return (
    <>
      {isRHF ? (
        <AutocompleteElement
          name={name}
          label={label}
          options={combinedOptions}
          textFieldProps={textFieldProps}
          autocompleteProps={autocompleteProps}
          helperText={helperText}
          loading={loading}
          {...props}
          transform={{
            input: (value) => {
              let returnValue = value || null;
              if (props.multiple) {
                returnValue = Array.isArray(value) ? value : [];
              }

              return returnValue;
            },
            output: (_, value) => {
              const newValue = props.multiple && value ? value[value.length - 1] : value;
              if (newValue?.[idField] === "new") {
                setCustomValue(newValue.searchTerm);
                const returnValue = props.multiple ? value.slice(0, -1) : {};

                return returnValue;
              }

              return value;
              // return [{ [typeIdField]: "book", [typeLabelField]: "teapot" }];
            },
          }}
        />
      ) : (
        <MUIAutocomplete
          name={name}
          label={label}
          options={options}
          value={currentValue}
          renderInput={(params) => {
            const mergedProps = merge(params, textFieldProps);
            if (loading) {
              mergedProps.InputProps = {
                ...mergedProps.InputProps,
                endAdornment: (
                  <InputAdornment position="end">
                    <CircularProgress color="inherit" size={20} />
                  </InputAdornment>
                ),
              };
            }
            return <TextField {...params} {...mergedProps} error={props.error} helperText={helperText} />;
          }}
          {...autocompleteProps}
          {...props}
        />
      )}
      <NewListItemDialog
        handleClose={(result) => {
          setCustomValue(null);
          if (result) {
            const updatedValue = props.multiple ? [...getValues(name), result] : result;
            setValue(name, updatedValue, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
          }
        }}
        service={service}
        label={typeLabel}
        value={customValue}
        createParams={createParams}
        multiple={props.multiple}
      />
    </>
  );
};

export default memo(Autocomplete);
