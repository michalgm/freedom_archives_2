import {
    Button,
    Grid,
    Icon,
    IconButton,
    Paper,
} from '@material-ui/core';
import {FieldArray, useFormikContext} from "formik";
import React, {useEffect, useState} from 'react'
import {collections, records} from '../api';

import Field from '../components/Field';
import Form from '../components/Form';
import {ItemsList} from './RecordItem';
import ListItemField from '../components/ListItemField'
import PaginationFooter from '../components/PaginationFooter'
import ViewContainer from '../components/ViewContainer';
import {makeStyles} from '@material-ui/core/styles';
import {startCase} from 'lodash'
import {useStateValue} from '../appContext';

const page_size = 10;

const useStyles = makeStyles({
    filter: {
        display: 'flex',
        background: 'rgba(0, 0, 0, 0.08)',

        "& .MuiTextField-root": {
            background: 'white'
        }
    },
});

function Filter({filter, index, remove, filterTypes}) {
    const classes = useStyles();
    const {setFieldValue, values: {filters}} = useFormikContext()
    if (!filters[index]) {
        return null;
    }

    const field = filters[index].field

    const type = filterTypes[field]?.input;
    const filter_fields = Object.keys(filterTypes).sort()

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

export default function Manage({renderItem, defaultFilter, filterTypes, createQuery, type, service}) {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [offset, setOffset] = useState(0);
    const [filter, setFilter] = useState(defaultFilter);
    const {dispatch} = useStateValue();
    useEffect(() => {
        const {filters} = filter
        const fetchItems = async () => {
            const query = createQuery(filter)
            query.$skip = offset;
            query.$limit = page_size;

            if (filters.length) {
                filters.forEach(({field, value}) => {
                    if (value && field) {
                        switch (filterTypes[field].match) {
                            case 'contained':
                                query[field] = {$contains: [value.list_item_id || value]}
                                break;
                            case 'fuzzy':
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
                })
            }
            const {data, total} = await (service === 'record' ? records : collections).find({query});
            setItems(data);

            setTotal(total);
            dispatch('SEARCH', {
                type: service,
                query,
                total,
                offset,
                page_size,
            })
        };
        fetchItems();
    }, [offset, filter, service]);

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
                    {service === 'record' && <Field
                        name='collection'
                        type="select"
                        searchType="collections"
                        size="small"
                    />}
                </Grid>
                <Grid item xs={3}>
                    <div style={{display: 'flex', flexDirection: 'column'}}>
                        {service === 'record' && <Field type='checkbox' name="non_digitized" label="Include non-digitized" margin="none" size="small" style={{paddingBottom: 4, paddingTop: 4}} />}
                        <Field type='checkbox' name="hidden" label="Include Hidden" margin="none" size="small" style={{paddingBottom: 4, paddingTop: 4}} />
                        <Field type='checkbox' name="needs_review" label="Needs Review" margin="none" size="small" style={{paddingBottom: 4, paddingTop: 4}} />
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
                                    {filter.filters.map((filter, index) => <Filter filterTypes={filterTypes} filter={filter} key={index} index={index} remove={remove} />)}
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
            footerElements={[<PaginationFooter type={service} total={total} offset={offset} page_size={page_size} setOffset={setOffset} />]}
            headerElements={[renderFilterBar()]}
            service={service}
        >
            <Paper>
                <ItemsList
                    description
                    items={items}
                    onClick={(index) => dispatch('SEARCH_INDEX', offset + index)}
                    type={service}
                />
            </Paper>
        </ViewContainer>
    )
}
