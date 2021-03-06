import './Search.scss';

import {Box, Button, Card, Chip, Divider, Grid, Icon, Link as MULink, Paper, Typography} from '@material-ui/core';
import React, {useEffect, useRef, useState} from 'react';
import {makeStyles, useTheme} from '@material-ui/core/styles';

import AutoSave from '../components/AutoSave'
import Field from '../components/Field';
import Form from '../components/Form';
import PaginationFooter from '../components/PaginationFooter'
import Thumbnail from '../components/Thumbnail';
import {isEqual} from 'lodash';
import {records as recordsService} from '../api';
import {startCase} from 'lodash';
import {unstable_batchedUpdates} from 'react-dom'

const descriptionMaxLines = 5;

const useStyles = makeStyles({
  descriptionContainer: {
    width: '100%'
  },
  description: props => ({
    transition: '0.4s',
  }),
  descriptionClosed: props => ({
    maxHeight: `${descriptionMaxLines * props.typography.body2.lineHeight}em`,
    overflow: 'hidden',
  }),
  descriptionOpen: {
    maxHeight: 800,

  },
  openControl: {
    textAlign: 'right',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    float: 'right',
    cursor: 'pointer',
    '& .MuiIcon-root': {
      transition: 'transform 400ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
    },
    '& .MuiIcon-root.open': {
      transform: 'rotate(180deg)'
    }
  }
});


const page_size = 10;

function Description({text}) {
  const theme = useTheme();
  const classes = useStyles(theme);
  const [open, setopen] = useState(false)
  const [height, setHeight] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    const size = parseFloat(getComputedStyle(ref.current.parentElement).fontSize)
    setHeight(ref.current.clientHeight / size)
  }, [setHeight])

  return (
    <div className={classes.descriptionContainer}>
      <div className={[classes.description, open ? classes.descriptionOpen : classes.descriptionClosed].join(' ')}>
        <div ref={ref}>
          {text}
        </div>
      </div>
      {height > (descriptionMaxLines * theme.typography.body2.lineHeight) &&
        <Typography variant="caption" className={classes.openControl} onClick={e => setopen(!open)}>
          <Icon className={open ? 'open' : ''}>expand_more</Icon> View {open ? 'Less' : 'More'}
        </Typography>
      }
    </div>
  )
}

function Filter({type, values = [], addFilter, search}) {
  const [limit, setlimit] = useState(5)

  const renderFilterItem = ({value, label, count, i, type}) => (
    <div key={i} onClick={() => addFilter({type, value})}>
      <MULink
        href=""
        onClick={e => e.preventDefault()}
        style={{fontWeight: (search || []).includes(value) ? 800 : 400}}
      >
        {label || '???'}
      </MULink>{' '}
      &nbsp;({count})
    </div>
  );

  return (

    <div key={type} style={{flexGrow: 1, marginBottom: 10}}>
      <Typography variant="h6" gutterBottom>{startCase(type)}</Typography>
      <div style={{paddingLeft: 10}}>
        <div>
          {(values || [])
            .slice(0, limit)
            .map(([label, count, value], i) =>
              renderFilterItem({value: value || label, label, count, type, i})
            )}
        </div>
        {(values && values.length > limit) &&
          <Button size="small" color="default" startIcon={<Icon>add</Icon>} onClick={e => setlimit(limit + 5)} style={{display: 'flex', cursor: 'pointer'}}>
            Show More...
          </Button>
        }
      </div>
      <Divider></Divider>
    </div>
  );
}

function Search() {
  const [records, setRecords] = useState({count: 0, records: []});
  const [filters, setFilters] = useState([]);
  const [search, setSearch] = useState({$fullText: '', include_non_digitized: false});
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [time, setTime] = useState(0);

  const searchRef = useRef(search);
  // console.log(searchRef.current, search, records, filters, total, offset, time)
  if (!isEqual(search, searchRef.current)) {
    searchRef.current = search
  }

  useEffect(() => {
    setOffset(0)
  }, [searchRef.current])


  useEffect(() => {
    // console.log('search?')
    const fetchRecords = async () => {
      const time = new Date();
      try {
        const {$fullText, include_non_digitized} = search;
        const query = {
          $select: ['record_id', 'title', 'description', 'year', 'publisher', 'producers', 'authors'],
          $limit: page_size,
          $fullText: $fullText,
          $skip: offset,
        };
        if (!include_non_digitized) {
          query.has_digital = true
        }
        ['keyword', 'subject', 'author', 'producer'].forEach(type => {
          if (search[type]) {
            query[`${type}s_search`] = {$contains: search[type]};
          }
        });
        ['year', 'title'].forEach(type => {
          if (search[type]) {
            query[type] = {$in: search[type]};
          }
        });
        if (search.collection) {
          query.collection_id = {$in: search.collection};
        }
        const {
          total,
          data: records,
          filters = [],
        } = await recordsService.find({query});
        unstable_batchedUpdates(() => {
          setRecords({
            total, records: records.map(record => {
              const keys = ['year', 'producers', 'publisher', 'authors']
              record.details = []
              keys.forEach(key => {
                let value = record[key]
                if (value) {
                  if (Array.isArray(value)) {
                    if (value.length) {
                      value = value.map(({item}) => item).join(', ')
                    }
                  } else if (typeof value === 'object') {
                    value = value.item
                  }
                }
                if (value && value.toString().trim()) {
                  record.details.push([key, value])
                }
              })
              return record
            })
          });
          setFilters(filters);
          setTime((new Date() - time) / 1000);
          setTotal(total);
        })
      } catch { }
    };
    fetchRecords();
  }, [searchRef.current, offset]);

  const addFilter = ({type, value}) => {
    let newFilter = [...search[type] || []];
    if (newFilter.includes(value)) {
      newFilter = newFilter.filter(v => v !== value)
    } else {
      newFilter.push(value)
    }
    setSearch({...search, ...{[type]: newFilter}})
  };

  const clearFilters = () => {
    const newFilters = {};
    filters.forEach(({type}) => {
      newFilters[type] = [];
    });
    setSearch({...search, ...newFilters})
  };

  const renderResult = (record = {}) => {
    return (
      <Grid item xs={12} key={record.record_id}>
        <Card style={{display: 'flex'}}>
          <Thumbnail
            src={`https://search.freedomarchives.org/images/thumbnails/${record.record_id}.jpg`}
            width={75}
          />
          <div style={{width: '100%'}}>
            <Typography variant='h5'>
              {record.title}
            </Typography>
            <Typography variant='caption'>
              <Grid container spacing={1} style={{marginBottom: 3, marginTop: 3}}>
                {(record.details || []).map(([key, value]) => <Grid item key={key}>
                  <Chip variant="outlined" size="small" label={`${startCase(key)} - ${value}`} />
                </Grid>)}
              </Grid>
            </Typography>
            <Description text={record.description} />
          </div>
        </Card>
      </Grid>
    )
  }

  const renderResults = () => (
    <Grid container spacing={2}>

      {/* {Array.from(new Array(3)).map(renderResult)} */}
      {records.records.map(renderResult)}
    </Grid>
  );

  const renderFilters = () => (
    <div>
      <Typography variant="h5">Filters</Typography>
      <Button
        color="primary"
        size="small"
        variant="contained"
        onClick={() => clearFilters()}
      >
        Clear Filters
      </Button>
      {filters.map(({type, values}) => {
        return <Filter
          key={type}
          type={type}
          values={values}
          addFilter={addFilter}
          search={search[type]}
        />
      })}
    </div>
  );

  const SearchForm = ({children}) => (
    <Paper>
      <Form
        initialValues={search}
        onSubmit={fields => {
          setSearch({
            ...search,
            ...fields
          });
        }}
      >
        <AutoSave timeout={500} />
        <Grid item xs={12}>
          <Field
            name="$fullText"
            label="Search"
            placeholder="Search Records"
            width={12}
            autoFocus
          />
          <Field
            name="include_non_digitized"
            label="Include non-digitized documents"
            type="checkbox"
            // autoSubmit
            width={12}
          />
        </Grid>
        <Grid item xs={12}>
          {renderFilters()}
        </Grid>
      </Form>
    </Paper>
  );

  return (
    <div className="records">
      <Grid container spacing={2}>
        <Grid item xs={4} lg={3} xl={2}>
          <Paper>
            <SearchForm />
          </Paper>
        </Grid>
        <Grid item xs={8} lg={9} xl={10}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Paper>
                <Box justifyContent="center" display="flex">
                  <PaginationFooter offset={offset} total={total} page_size={page_size} setOffset={setOffset} size="small" />
                </Box>
                <Box mt={2} textAlign="center">
                  {records.total} total results ({time} seconds)
                </Box>

              </Paper>
            </Grid>
            <Grid item xs={12}>
              {
                renderResults()
              }
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
}

export default React.memo(Search);
