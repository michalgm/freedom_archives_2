import React, { useState, useEffect } from 'react';
import { collections as collectionsService } from '../api';
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  ListItemAvatar,
  Avatar,
} from '@material-ui/core';
import { BrokenImage } from '@material-ui/icons';
import { Link } from 'react-router-dom';
import ViewContainer from '../components/ViewContainer';
import PaginationFooter from '../components/PaginationFooter'

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

  return (
    <ViewContainer footerElements={[<PaginationFooter total={total} offset={offset} page_size={page_size} setOffset={setOffset}/>]} >
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
                    <Typography variant="subtitle2" gutterBottom>
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
    </ViewContainer>
  );
}

export default Collections;
