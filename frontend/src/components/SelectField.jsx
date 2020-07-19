import React from 'react';
import { TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { services } from '../api';

const searchTypes = {
  list_items: {
    id: 'list_item_id',
    label: 'item',
  },
  collections: {
    id: 'collection_id',
    label: 'collection_name',
  },
};

let active = false;

const SelectField = ({
  type,
  isMulti,
  ro,
  defaultValue,
  label,
  name,
  validateChange,
  onChange,
  onBlur,
  loadOptions,
  searchType,
  setFieldValue,
  searchParams,
  ...props
}) => {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [value, setValue] = React.useState(defaultValue);
  const [options, setOptions] = React.useState([]);
  const loading = Boolean(open && inputValue);

  if (searchType && !loadOptions) {
    const type = searchTypes[searchType];
    loadOptions = async value => {
      const { data } = await services[searchType].find({
        noLoading: true,
        query: {
          $select: [type.id, type.label],
          [type.label]: { $ilike: `%${value}%` },
          ...searchParams,
        },
      });
      return data;
    };
  }

  React.useEffect(() => {
    if (!loading || active) {
      return undefined;
    }
    active = true;

    const fetchRecord = async () => {
      const response = await loadOptions(inputValue);
      setOptions(response);
      active = false;
    };

    fetchRecord();
  }, [inputValue]);
  // }, [inputValue, loading, loadOptions]);

  React.useEffect(() => {
    if (!open) {
      setOptions([]);
    }
  }, [open]);

  React.useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  return (
    <Autocomplete
      loading={loading}
      multiple={isMulti}
      open={open}
      onOpen={() => {
        setOpen(true);
      }}
      onClose={() => {
        setOpen(false);
      }}
      getOptionLabel={item => item[searchTypes[searchType].label] || ''}
      getOptionSelected={(option, value) =>
        option[searchTypes[searchType].id] === value[searchTypes[searchType].id]
      }
      options={options}
      renderInput={params => (
        <TextField
          {...params}
          InputLabelProps={{ shrink: true }}
          label={label}
          variant="outlined"
        />
      )}
      onChange={(_, option) => {
        if (!validateChange || validateChange(_, option)) {
          // onChange(_);
          setFieldValue(name, option);
        }
      }}
      onInputChange={(_, option) => {
        setInputValue(option);
      }}
      value={value}
      inputValue={inputValue}
      {...props}
    />
  );
};

SelectField.defaultProps = {
  searchParams: {},
};

export default SelectField;
