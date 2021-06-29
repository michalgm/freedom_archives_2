import RecordItem, {CollectionItem} from './RecordItem'

import {Autocomplete} from 'formik-material-ui-lab';
import {Field} from 'formik';
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
    fields: ['collection_id', 'collection_name', 'thumbnail', 'parent'],
    renderOption: item => <CollectionItem collection={item} component='div' dense />
  },
  records: {
    id: 'record_id',
    label: 'title',
    fields: ['record_id', 'title', 'parent_record_id', 'primary_instance_thumbnail', 'primary_instance_format_text', 'primary_instance_media_type', 'collection'],
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
  onChange: customOnChange,
  onBlur,
  searchType,
  setFieldValue,
  searchParams,
  fetchAll,
  autoHighlight,
  excludeIds,
  managed,
  loadOptions: inputLoadOptions,
  ...props
}) => {
  const {id: typeId, label: typeLabel, renderOption, fields} = searchTypes[searchType]
  const [open, setOpen] = React.useState(props.autoFocus || false);
  const [inputValue, setInputValue] = React.useState('');
  const [options, setOptions] = React.useState([]);
  const loading = Boolean(open && inputValue);
  
  const value = inputValue || ((defaultValue && defaultValue[typeLabel]) ? defaultValue[typeLabel] : "")
  const $select = fields || [typeId, typeLabel]
  const query = {
    $select,
    $sort: {[typeLabel]: 1},
    $limit: 100,
    ...searchParams,
  }

  if (!fetchAll) {
    query[typeLabel] = {$ilike: `%${value}%`}
  }
  if (excludeIds) {
    query[typeId] = {$nin: excludeIds}
  }
  if (isMulti) {
    query[typeId] = {$nin: defaultValue.map(item => item[typeId])}
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


  const onChange = React.useCallback(
    (event, option) => {
      const {value} = event.target;
      setFieldValue(name, option);

      !isMulti && customOnChange && customOnChange(event, option);
    },
    [setFieldValue, name, isMulti]
  );

  return (
    <Field
      component={Autocomplete}
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
      renderInput={(params: unused) => (
        <TextField
          {...params}
          name={name}
          InputLabelProps={{ shrink: true }}
          label={label}
          variant={props.variant || "outlined"}
          autoFocus={props.autoFocus || false}
        />
      )}
      onChange={onChange}
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
      name={name}
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
