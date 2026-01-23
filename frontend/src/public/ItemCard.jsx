import { ExpandMore } from "@mui/icons-material";
import {
  Box,
  Button,
  Skeleton,
  Stack,
  Typography,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  Grid,
  Divider,
} from "@mui/material";
import { startCase } from "lodash-es";
import { useRef } from "react";
import { Link } from "react-router";
import Thumbnail from "src/components/Thumbnail";
import useExpandableText from "src/hooks/useExpandableText";
import { DetailsRow } from "src/public/PublicCollections";

import KVChip from "../components/KVChip";

export function ItemCardLayout({
  url,
  media,
  header,
  details,
  body,
  actions,
  isOverflowing,
  dense = false,
  item,
  setCurrentRecord,
  ...cardProps
}) {
  const content = (
    <CardContent sx={{ p: dense ? 1 : 2 }}>
      <Stack spacing={dense ? 1 : 2} direction="row">
        <Box>{media}</Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: "400",
              lineHeight: "unset",
              fontSize: dense ? "1rem" : "1.25rem",
            }}
            gutterBottom
          >
            {header}
          </Typography>
          {details && details.length > 0 && (
            <Grid container spacing={1} sx={{ my: 1 }}>
              {details}
            </Grid>
          )}
          {body}
          {item?.extra}
        </Box>
      </Stack>
    </CardContent>
  );

  return (
    <Card
      variant="outlined"
      sx={{
        flexShrink: 0,
        border: dense ? "none" : "inhertit",
        // scrollSnapAlign: "start",
      }}
      {...cardProps}
    >
      {url ? (
        <ItemLink item={item} setCurrentRecord={setCurrentRecord}>
          <CardActionArea>{content}</CardActionArea>
        </ItemLink>
      ) : (
        content
      )}
      {item?.actions || isOverflowing && (
        <CardActions sx={{ textAlign: "right", justifyContent: "flex-end" }}>
          {item.actions || actions}
        </CardActions>
      )}
    </Card>
  );
}

export function ItemLink({ item, children, ...props }) {
  if (!item) return children;
  const url = item.collection_id ? `/collections/${item.collection_id}` : item.url || item.primary_media_url;
  const target = item.collection_id ? "_self" : "_blank";
  if (!url) return children;
  // const onClick = ['Audio', 'Video'].includes(item.media_type) && setCurrentRecord ? (e) => {
  //   e.preventDefault();
  //   setCurrentRecord(item);
  // } : undefined;
  return (
    <Link
      to={url}
      style={{ textDecoration: "none", color: "inherit" }}
      target={target}
      // preventScrollReset={true}
      // onClick={onClick}
      {...props}
    >
      {children}
    </Link>
  );
}
export function ItemCard({
  item,
  expand = false,
  url,
  dense = false,
  setCurrentRecord,
  ...props
}) {
  const title = item?.title || "Untitled";
  const { details = [], description, summary } = item || {};
  const text = summary || description || "";
  const textRef = useRef(null);

  const { isOverflowing, isExpanded, setIsExpanded, styles } =
    useExpandableText({ textRef, expand });
  const detailChips = details.map(([key, value]) => (
    <Grid key={key}>
      <KVChip
        keyName={startCase(key)}
        value={value}
        variant="outlined"
        size="small"
        sx={{ height: 'auto', whiteSpace: 'wrap', '.MuiChip-label': { whiteSpace: 'wrap' } }}
      // color={key === 'Collection' ? 'primary' : 'default'}
      />
    </Grid>
  ));

  const body = (
    <Typography
      variant="body2"
      color="text.secondary"
      ref={textRef}
      sx={styles}
    >
      {text}
    </Typography>
  );
  const actions =
    expand && !isExpanded && isOverflowing ? (
      <Button
        startIcon={<ExpandMore />}
        size="small"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        View More
      </Button>
    ) : null;

  return (
    <ItemCardLayout
      {...{
        url,
        body,
        details: detailChips,
        header: title,
        media: <Thumbnail item={item} width={dense ? 50 : 75} />,
        actions,
        isOverflowing,
        dense,
        item: item || {},
        setCurrentRecord,
        ...props,
      }}
    />
  );
}

export function RecordCard({ record, setCurrentRecord, ...props }) {
  return (
    <ItemCard
      item={record}
      type="record"
      expand={true}
      url={record.url || record.primary_media_url}
      setCurrentRecord={setCurrentRecord}
      {...props}
    />
  );
}

export function CollectionCard({ collection, ...props }) {
  return (
    <ItemCard
      item={{
        ...collection,
        extra: <DetailsRow label="Subcollections" value={collection.children} keyProp="collection_id" valueProp="title" />,
      }}
      type="collection"
      url={`/collections/${collection.collection_id}`}
      {...props}
    />
  );
}
export function LoadingCard({ ...props }) {
  return (
    <ItemCardLayout
      media={<Skeleton variant="rectangular" width={75} height={75} />}
      header={<Skeleton width="50%" />}
      body={<Skeleton variant="rounded" height={60} />}
      details={
        <>
          <Skeleton width={60} />
          <Skeleton width={60} />
          <Skeleton width={60} />
        </>
      }
      {...props}
    />
  );
}

export function ItemStack({
  title,
  type,
  loading = false,
  dense = false,
  items,
  footer,
  setCurrentRecord,
  ...props
}) {
  return (
    <Box className="flex-container" {...props}>
      {title && <Typography variant="header" gutterBottom>
        {title}
      </Typography>}
      <Stack
        spacing={dense ? 0 : 2}
        className="flex-scroller"
        sx={{
          // scrollSnapType: "y mandatory",
        }}
        divider={dense ? <Divider /> : null}
      >
        {loading ? (
          <>
            <LoadingCard dense={dense} />
            <LoadingCard dense={dense} />
            <LoadingCard dense={dense} />
          </>
        ) : (
          (items || []).map((child) =>
            type === "record" ? (
              <RecordCard key={child.record_id} record={child} dense={dense} setCurrentRecord={setCurrentRecord} />
            ) : (
              <CollectionCard
                key={child.collection_id}
                collection={child}
                dense={dense}
              />
            ),
          )
        )}
        {footer}
      </Stack>
    </Box>
  );
}
