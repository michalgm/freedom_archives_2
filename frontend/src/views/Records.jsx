import {
  Button,
  Grid,
  Icon,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Typography,
} from '@material-ui/core';
import {FieldArray, useFormikContext} from "formik";
import React, {useEffect, useState} from 'react';

import Field from '../components/Field';
import Form from '../components/Form';
import { Link } from 'react-router-dom';
import ListItemField from '../components/ListItemField'
import PaginationFooter from '../components/PaginationFooter'
import Thumbnail from '../components/Thumbnail'
import ViewContainer from '../components/ViewContainer';
import {makeStyles} from '@material-ui/core/styles';
import { records as recordsService } from '../api';
import {startCase} from 'lodash'

const page_size = 10;
const filter_types = {
  'day': 'exact',
  'description': 'text',
  'file_extension': 'text',
  'location': 'text',
  'month': 'exact',
  'title': 'text',
  'vol_number': 'text',
  'year': 'exact',
  'authors': 'listitem',
  'subjects': 'listitem',
  'keywords': 'listitem',
  'producers': 'listitem',
  'programs': 'listitem_id',
  'publishers': 'listitem_id',
  'call_numbers': 'text',
  'formats': 'listitem',
  'qualitys': 'listitem',
  'generations': 'listitem',
  'media_types': 'text',
}
const filter_fields = Object.keys(filter_types).sort()

const useStyles = makeStyles({
  filter: {
    display: 'flex',
    background: 'rgba(0, 0, 0, 0.08)',

    "& .MuiTextField-root": {
      background: 'white'
    }
  },
});

function Filter({filter, index, remove}) {
  const classes = useStyles();
  const {setFieldValue, values: {filters}} = useFormikContext()
  if (!filters[index]) {
    return null;
  }

  const field = filters[index].field
  const type = filter_types[field];


  return <Grid item xs={6} lg={3}>
    <Paper className={classes.filter}>
      <IconButton onClick={() => remove(index)} variant="outlined" size="small"><Icon>close</Icon></IconButton>
      <Field
        size="small"
        name={`filters[${index}].field`}
        label='Field'
        type='simpleSelect'
        options={filter_fields}
        getOptionLabel={(option) => startCase(option)}
        onChange={() => {
          setFieldValue(`filters[${index}].value`, '')
        }}
      />
      {
        type === 'listitem' || type === 'listitem_id' ?
          <ListItemField name={`filters[${index}].value`} label='Value' listType={field.replace(/s$/, '')} />
          : <Field name={`filters[${index}].value`} label='Value' />
      }

    </Paper>
  </Grid >
}

function Records() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState({
    search: '',
    non_digitized: false,
    collection: {},
    hidden: false,
    needs_review: '',
    filters: []
  });

  useEffect(() => {
    const {search, non_digitized, hidden, needs_review, collection = {}, filters} = filter
    const fetchRecords = async () => {
      const query = {
        has_digital: non_digitized ? undefined : true,
        is_hidden: hidden ? undefined: false,
        needs_review: needs_review ? needs_review : undefined,
        collection_id: collection ? collection.collection_id : undefined,
        $skip: offset,
        $limit: page_size,
        $sort: { title: 1 },
        $select: [
          'record_id',
          'title',
          'collection',
          'has_digital',
          'description',
        ]
      }
      if (search) {
        const $ilike = `%${search}%`
        query.$or = [
          {keywords_text: {$ilike}},
          {producers_text: {$ilike}},
          {title: {$ilike}},
          {description: {$ilike}},
          {record_id: parseInt(search, 10) || undefined},
          {call_numbers: {$contains: [search]}}
        ]
      }
      if (filters.length) {
        filters.forEach(({field, value}) => {
          console.log(field, value)
          if (value) {
            if (['call_numbers', 'qualitys', 'generations', 'media_types', 'formats'].includes(field)) {
              query[field] = {$contains: [value.list_item_id || value]}
            } else {
              switch (filter_types[field]) {
                case 'text':
                  query[field] = {'$ilike': `%${value}%`}
                  break;
                case 'listitem':
                  query[`${field}_search`] = {$contains: [value.item]}
                  break;
                case 'listitem_id':
                  query[`${field.replace(/s$/, '')}_id`] = value.list_item_id
                  break;
                default:
                  query[field] = value
              }
            }
          }
        })
      }
      const { data, total } = await recordsService.find({ query });
      setRecords(data);
      setTotal(total);
    };
    fetchRecords();
  }, [offset, filter]);

  const renderFilterBar = () => {
    return (
      <Form initialValues={filter} onChange={(values) => {
        if (values !== filter) {
          setFilter(values)
          setOffset(0);
        } 
      }}>
        <Grid item xs={3}>
          <Field name="search" type="search" label="Quick Search" />
        </Grid>
        <Grid item xs={4}>
          <Field
            name='collection'
            type="select"
            searchType="collections"
            size="small"
          />
        </Grid>
        <Grid item xs={3}>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <Field type='checkbox' name="non_digitized" label="Include non-digitized" margin="none" size="small" style={{paddingBottom: 4, paddingTop: 4}}/>
            <Field type='checkbox' name="hidden" label="Include Hidden" margin="none" size="small"  style={{paddingBottom: 4, paddingTop: 4}}/>
            <Field type='checkbox' name="needs_review" label="Needs Review" margin="none" size="small" style={{paddingBottom: 4, paddingTop: 4}}/>
          </div>
        </Grid>
        <FieldArray
          name="filters"
          render={({push, remove}) => {
            return <>
              <Grid item xs={2} lg={2}>
                <Button variant="outlined" startIcon={<Icon>add</Icon>} onClick={() => {push({field: '', value: ''})}}>Add Filter</Button>

              </Grid>
              <Grid item xs={12}>
                <Grid container spacing={2}>
                  {filter.filters.map((filter, index) => <Filter filter={filter} key={index} index={index} remove={remove} />)}
                </Grid>
              </Grid>
            </>
          }}
        />
      </Form>
    )
  }

  return (
    <ViewContainer
      footerElements={[<PaginationFooter total={total} offset={offset} page_size={page_size} setOffset={setOffset}/>]}
      headerElements={[renderFilterBar()]}
    >
      <Paper>
        <List>
          {records.map(record => {
            return (
              <ListItem
                key={record.record_id}
                divider
                button
                alignItems="flex-start"
                component={Link}
                to={`/records/${record.record_id}`}
              >
                <ListItemAvatar>
                  <Thumbnail
                    src={record.has_digital ? `https://search.freedomarchives.org/images/thumbnails/${record.record_id}.jpg` : ''}
                    alt={`${record.title} Thumbnail`}
                    width={40}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Grid container justify="space-between" style={{flexWrap: 'inherit'}}>
                      <Grid item>
                        {record.title}
                      </Grid>
                      <Grid item>
                        <Typography variant="body2">
                          ID:&nbsp;{record.record_id}
                        </Typography>
                      </Grid>
                    </Grid>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                  secondary={
                    <>
                      <Grid container justify="space-between" style={{flexWrap: 'inherit'}}>
                        <Grid item>
                          <Typography variant="subtitle2" gutterBottom>
                            Collection: {record.collection.collection_name}
                          </Typography>
                        </Grid>
                        {record.call_number && <Grid item>
                          <Typography variant="body2">
                            CN:&nbsp;{record.call_number}
                          </Typography>
                        </Grid>}
                      </Grid>

                      <Typography
                        style={{ maxHeight: 100, overflowX: 'auto' }}
                        variant="body2"
                        dangerouslySetInnerHTML={{
                          __html: record.description,
                        }}
                      ></Typography>
                    </>
                  }
                ></ListItemText>
              </ListItem>
            );
          })}
        </List>
      </Paper>
    </ViewContainer>
  );
}

export default Records;
