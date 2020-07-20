import React, { useState, useEffect } from 'react';
import { collections as collectionsService } from '../api';
import {
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
  ListItemAvatar,
  Avatar,
} from '@material-ui/core';
import { BrokenImage } from '@material-ui/icons';
import { Pagination } from '@material-ui/lab';
import { Link } from 'react-router-dom';

const page_size = 10;

function Collections() {
  const [collections, setCollections] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const fetchCollections = async () => {
      const { data, total } = await collectionsService.find({
        query: {
          $skip: offset,
          $sort: { display_order: 1, collection_name: 1 },
          is_hidden: false,
        },
      });
      setCollections(data);
      setTotal(total);
    };
    fetchCollections();
  }, [offset]);

  const renderPagination = () => {
    return (
      // <Grid item xs={12} style={{ textAlign: 'center' }}>
      <Pagination
        count={Math.round(total / page_size)}
        onChange={(_, page) => setOffset((page - 1) * page_size)}
        showFirstButton
        showLastButton
        size="large"
      />
      // </Grid>
    );
  };

  return (
    <Grid container justify="center" alignItems="center" alignContent="center">
      {renderPagination()}
      <Grid item xs={12}>
        <List>
          {collections.map(collection => {
            return (
              <ListItem
                key={collection.collection_id}
                divider
                button
                alignItems="flex-start"
                component={Link}
                to={`/collections/${collection.collection_id}`}
              >
                <ListItemAvatar>
                  {collection.thumbnail ? (
                    <img
                      src={`https://search.freedomarchives.org/${collection.thumbnail}`}
                      alt={`${collection.collection_name} Thumbnail`}
                      width={40}
                    />
                  ) : (
                    <Avatar>
                      <BrokenImage />
                    </Avatar>
                  )}
                </ListItemAvatar>
                <ListItemText
                  primary={collection.collection_name}
                  secondaryTypographyProps={{ component: 'div' }}
                  secondary={
                    <>
                      <Typography variant="subtitle2">
                        Parent Collection: {collection.parent.collection_name}
                      </Typography>
                      <Typography
                        style={{ maxHeight: 100, overflowX: 'auto' }}
                        variant="body2"
                        dangerouslySetInnerHTML={{
                          __html: collection.description,
                        }}
                      ></Typography>
                    </>
                  }
                ></ListItemText>
              </ListItem>
            );
          })}
        </List>
      </Grid>
      {renderPagination()}
    </Grid>
  );
}

export default Collections;
