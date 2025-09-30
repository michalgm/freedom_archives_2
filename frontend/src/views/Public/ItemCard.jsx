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
  Grid2,
  Divider,
} from "@mui/material";
import { startCase } from "lodash-es";
import { useRef } from "react";
import { Link } from "react-router";
import Thumbnail from "src/components/Thumbnail";
import useExpandableText from "src/hooks/useExpandableText";

import KVChip from "../../components/KVChip";

export function ItemCardLayout({
  url,
  media,
  header,
  details,
  body,
  actions,
  isOverflowing,
  dense = false,
  item = {},
  ...cardProps
}) {
  const content = (
    <CardContent sx={{ p: dense ? 1 : 2 }}>
      <Stack spacing={dense ? 1 : 2} direction="row">
        <Box>{media}</Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: "400",
              lineHeight: "unset",
              fontSize: dense ? "1rem" : "1.25rem",
            }}
          >
            {header}
          </Typography>
          {details && details.length > 0 && (
            <Grid2 container spacing={1} sx={{ my: 1 }}>
              {details}
            </Grid2>
          )}
          {body}
        </Box>
      </Stack>
    </CardContent>
  );

  return (
    <Card variant="outlined" sx={{ flexShrink: 0, border: dense ? "none" : "inhertit" }} {...cardProps}>
      {url ? (
        <ItemLink item={item}>
          <CardActionArea>{content}</CardActionArea>
        </ItemLink>
      ) : (
        content
      )}
      {isOverflowing && <CardActions sx={{ textAlign: "right", justifyContent: "flex-end" }}>{actions}</CardActions>}
    </Card>
  );
}

export function ItemLink({ item, children, ...props }) {
  const url = item.collection_id ? `/public/collections/${item.collection_id}` : item.url || item.primary_instance_url;
  const target = item.collection_id ? "_self" : "_blank";
  if (!url) return children;
  return (
    <Link to={url} style={{ textDecoration: "none", color: "inherit" }} target={target} {...props}>
      {children}
    </Link>
  );
}
export function ItemCard({ item = {}, expand = false, url, dense = false, ...props }) {
  const title = item.title || item.collection_name || "Untitled";
  const { details = [], description, summary } = item;
  const text = summary || description || "";
  const textRef = useRef(null);

  const { isOverflowing, isExpanded, setIsExpanded, styles } = useExpandableText({ textRef, expand });
  const detailChips = details.map(([key, value]) => (
    <Grid2 key={key}>
      <KVChip keyName={startCase(key)} value={value} variant="outlined" size="small" />
    </Grid2>
  ));

  const body = (
    <Typography variant="body2" color="text.secondary" ref={textRef} sx={styles}>
      {text}
    </Typography>
  );
  const actions =
    expand && !isExpanded && isOverflowing ? (
      <Button startIcon={<ExpandMore />} size="small" onClick={() => setIsExpanded(!isExpanded)}>
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
        item,
        ...props,
      }}
    />
  );
}

export function RecordCard({ record, ...props }) {
  return (
    <ItemCard item={record} type="record" expand={true} url={record.url || record.primary_instance_url} {...props} />
  );
}

export function CollectionCard({ collection, ...props }) {
  return (
    <ItemCard item={collection} type="collection" url={`/public/collections/${collection.collection_id}`} {...props} />
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

export function ItemStack({ title, type, loading = false, dense = false, items = [], ...props }) {
  return (
    <Box className="flex-container" {...props}>
      <Typography variant="header" gutterBottom>
        {title}
      </Typography>
      <Stack spacing={dense ? 0 : 2} className="flex-scroller" divider={dense ? <Divider /> : null}>
        {loading ? (
          <>
            <LoadingCard dense={dense} />
            <LoadingCard dense={dense} />
            <LoadingCard dense={dense} />
          </>
        ) : (
          items.map((child) =>
            type === "record" ? (
              <RecordCard key={child.record_id} record={child} dense={dense} />
            ) : (
              <CollectionCard key={child.collection_id} collection={child} dense={dense} />
            )
          )
        )}
      </Stack>
    </Box>
  );
}
