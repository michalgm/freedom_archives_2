import {
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Typography,
} from '@material-ui/core';
import React, { useEffect, useState } from 'react';

import Field from '../components/Field';
import Form from '../components/Form';
import { Link } from 'react-router-dom';
import PaginationFooter from '../components/PaginationFooter'
import Thumbnail from '../components/Thumbnail'
import ViewContainer from '../components/ViewContainer';
import { records as recordsService } from '../api';

const page_size = 10;

function Records() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState({
    search: '',
    non_digitized: false,
    collection: {},
    hidden: false,
    needs_review: ''
  });

  useEffect(() => {
    const {search, non_digitized, hidden, needs_review, collection={}} = filter
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
          // 'call_number',
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
        ]
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
          <Field name="search" label="Quick Search"/>
        </Grid>
        <Grid item xs={5}>
          <Field
            name='collection'
            type="select"
            searchType="collections"
            size="small"
          />
        </Grid>
        <Grid item xs={4}>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <Field type='checkbox' name="non_digitized" label="Include non-digitized" margin="none" size="small" style={{paddingBottom: 4, paddingTop: 4}}/>
            <Field type='checkbox' name="hidden" label="Include Hidden" margin="none" size="small"  style={{paddingBottom: 4, paddingTop: 4}}/>
            <Field type='checkbox' name="needs_review" label="Needs Review" margin="none" size="small" style={{paddingBottom: 4, paddingTop: 4}}/>
          </div>
        </Grid>
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
                to={`/record/${record.record_id}`}
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
