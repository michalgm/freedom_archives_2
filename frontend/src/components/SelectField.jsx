import {Autocomplete} from '@material-ui/lab';
import React from 'react';
import {TextField} from '@material-ui/core';
import { services } from '../api';
import useDeepCompareEffect from 'use-deep-compare-effect'

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
  isMulti,
  ro,
  defaultValue,
  label,
  name,
  validateChange,
  onChange,
  onBlur,
  searchType,
  setFieldValue,
  searchParams,
  fetchAll,
  autoHighlight,
  loadOptions: inputLoadOptions,
  ...props
}) => {
  const {id: typeId, label: typeLabel} = searchTypes[searchType]
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [options, setOptions] = React.useState([]);
  const loading = Boolean(open && inputValue);
  
  const value = inputValue || ((defaultValue && defaultValue[typeLabel]) ? defaultValue[typeLabel] : "")
  const query = {
    $select: [typeId, typeLabel],
    $sort: {[typeLabel]: 1},
    $limit: 100,
    ...searchParams,
  }

  if (!fetchAll) {
    query[typeLabel] = {$ilike: `%${value}%`}
  }

  React.useEffect(() => {
    const value = defaultValue && defaultValue[typeLabel] ? defaultValue[typeLabel] : ''
    setInputValue(value)
  }, [defaultValue, typeLabel])

  useDeepCompareEffect(() => {
    if (
      (fetchAll && options.length) ||
      (!fetchAll && (
        !loading
        || active
        || !value
      ))
    ) {
      return undefined;
    }
    active = true;
    const fetchRecord = async () => {
      const {data: options} = await services[searchType].find({
        noLoading: true,
        query,
      });
      setOptions(options)
      active = false;
    };
    fetchRecord();
  }, [query, searchType, fetchAll, value, loading])

  return (
    <Autocomplete
      loading={loading}
      multiple={isMulti}
      open={open}
      autoHighlight
      onOpen={() => {
        setOpen(true);
      }}
      onClose={() => {
        setOpen(false);
      }}
      getOptionLabel={item => item[typeLabel] || ''}
      getOptionSelected={(option, value) => {
        return value[typeLabel] ? option[typeLabel] === value[typeLabel] : option[typeLabel] === value
      }
      }
      options={options}
      renderInput={params => (
        <TextField
          {...params}
          InputLabelProps={{ shrink: true }}
          label={label}
          variant={props.variant || "outlined"}
        />
      )}
      onChange={(_, option) => {
        if (!validateChange || validateChange(_, option)) {
          setFieldValue(name, option);
        }
      }}
      onInputChange={(_, option) => {
        setInputValue(option);
      }}
      value={defaultValue}
      inputValue={inputValue}
      blurOnSelect
      {...props}
    />
  );
};

SelectField.defaultProps = {
  searchParams: {},
};


export default React.memo(SelectField);
