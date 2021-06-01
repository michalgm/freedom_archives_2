import {Autocomplete} from '@material-ui/lab';
import React from 'react';
import RecordItem from './RecordItem'
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
  records: {
    id: 'record_id',
    label: 'title',
    renderOption: item => <RecordItem record={item} component='div' dense />
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
  excludeId,
  loadOptions: inputLoadOptions,
  ...props
}) => {
  const {id: typeId, label: typeLabel, renderOption} = searchTypes[searchType]
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [options, setOptions] = React.useState([]);
  const loading = Boolean(open && inputValue);
  
  const value = inputValue || ((defaultValue && defaultValue[typeLabel]) ? defaultValue[typeLabel] : "")
  const $select = searchType === 'records' ? [typeId, typeLabel, 'parent_record_id', 'primary_instance_thumbnail', 'primary_instance_format', 'primary_instance_media_type', 'collection'] : [typeId, typeLabel]
  const query = {
    $select,
    $sort: {[typeLabel]: 1},
    $limit: 100,
    ...searchParams,
  }

  if (!fetchAll) {
    query[typeLabel] = {$ilike: `%${value}%`}
  }

  if (excludeId) {
    query[typeId] = {$ne: excludeId}
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
      setOptions([{[typeId]: null, [typeLabel]: ''}, ...options.filter(o => o[typeLabel].trim())])
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
        if (!value[typeId] && !option[typeId]) {
          return true;
        }
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
          if (!props.clearOnBlur) {
            setFieldValue(name, option);
          }
          onChange && onChange(_, option);
        }
      }}
      renderOption={(option) => {
        if (renderOption) {
          return renderOption(option)
        } else {
          return option[typeLabel]
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
