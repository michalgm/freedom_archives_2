import { Close, Help } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  Icon,
  IconButton,
  InputAdornment,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { startCase } from "lodash-es";
import { useState } from "react";
import {
  CheckboxElement,
  SelectElement,
  TextFieldElement,
  useFormContext,
} from "react-hook-form-mui";
import { TagCloud } from "react-tagcloud";
import AutoSubmit from "src/components/AutoSubmit";
import Form from "src/components/form/Form";
import PaginationFooter from "src/components/PaginationFooter";
import {
  PAGE_SIZE,
  INITIAL_FILTER_DISPLAY_COUNT,
  FILTER_TYPE_LABELS,
  FILTER_TYPES,
  SORT_OPTIONS,
} from "src/public/PublicSearch/constants";

const FilterItem = ({ value, label, count, type, addFilter, search }) => {
  return (
    <ListItemButton onClick={() => addFilter({ type, value })}>
      <ListItemText
        slotProps={{
          primary: {
            sx: {
              color: "primary.main",
              fontWeight: (search[type] || []).includes(value) ? 800 : 400,
            },
          },
        }}
        primary={label || "???"}
      ></ListItemText>
      <Chip
        size="small"
        variant="outlined"
        label={count.toLocaleString()}
        sx={{ ml: "auto" }}
      />
    </ListItemButton>
  );
};

const Filter = ({ type, values = [], addFilter, search }) => {
  const [limit, setlimit] = useState(INITIAL_FILTER_DISPLAY_COUNT);
  return (
    <Box key={type}>
      <Typography variant="overline" sx={{ color: "text.secondary" }}>
        {startCase(FILTER_TYPE_LABELS[type] || type)}
      </Typography>
      <List dense sx={{ p: 0 }}>
        {(values || []).slice(0, limit).map(([label, count, value]) => (
          <FilterItem
            key={label}
            {...{
              value: value || label,
              label,
              count,
              type,
              addFilter,
              search,
            }}
          />
        ))}
        {values && values.length > limit && (
          <ListItem sx={{ justifyContent: "end" }}>
            <Button
              size="small"
              variant="text"
              startIcon={<Icon>add</Icon>}
              onClick={() => setlimit(limit + 5)}
            >
              Show More...
            </Button>
          </ListItem>
        )}
      </List>
    </Box>
  );
};

const WordCloud = ({ data = {}, addFilter, loading }) => {
  let contents = [];
  const height = 150;

  if (loading) {
    contents = (
      <Stack spacing={1}>
        <Skeleton variant="rounded" />
        <Skeleton variant="rounded" />
        <Skeleton variant="rounded" />
        <Skeleton variant="rounded" />
      </Stack>
    );
  } else {
    const words = (data?.["keyword_ids"] || [])
      ?.slice(0, 30)
      .map(([text, value, id]) => ({
        value: text,
        count: value,
        key: id,
      }));
    contents = (
      <TagCloud
        minSize={8}
        maxSize={23}
        tags={words}
        onClick={(word) => {
          addFilter({ type: "keyword_ids", value: word.key });
        }}
        disableRandomColor
      />
    );
  }

  return (
    <Box
      sx={{
        textAlign: "center",
        mb: 1,
        lineHeight: 1,
        minHeight: height,
        width: "100%",
        color: "primary.main",
        transition: "all 1s ease-in-out",
        span: {
          cursor: "pointer",
          ":hover": { textDecoration: "underline", color: "primary.dark" },
        },
      }}
    >
      {contents}
    </Box>
  );
};

export const SearchFilters = ({
  search,
  filters,
  addFilter,
  clearFilters,
  loading,
}) => {
  // const nonDigitizedTotalString = (parseInt(nonDigitizedTotal, 10) || 0).toLocaleString();

  return (
    <Box
      // p={1}
      sx={{ backgroundColor: (theme) => theme.palette.background.paper }}
      className="flex-container"
    >
      <Grid
        size={12}
        container
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography variant="h6">Common Terms</Typography>
        <WordCloud loading={loading} data={filters} addFilter={addFilter} />
        <Divider flexItem sx={{ width: "100%", my: 1 }} />
        <Typography variant="h6">Filter Search Results</Typography>
        <Button
          startIcon={<Icon>clear</Icon>}
          color="inherit"
          size="small"
          variant="text"
          onClick={clearFilters}
        >
          Clear Filters
        </Button>
      </Grid>
      <Grid size={12} className="flex-scroller">
        <Stack
          spacing={1}
          divider={<Divider orientation="horizontal" flexItem />}
          sx={{
            mt: 1,
            backgroundColor: (theme) => theme.palette.background.paper,
          }}
        >
          {FILTER_TYPES.filter(
            (type) => filters[type] && filters[type].length > 0,
          ).map((type) => {
            return (
              <Filter
                key={type}
                type={type}
                values={filters[type]}
                addFilter={addFilter}
                search={search}
              />
            );
          })}
        </Stack>
      </Grid>
    </Box>
  );
};

export function SearchInput({ focus, ...props }) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <TextFieldElement
        name="fullText"
        size="small"
        label=""
        placeholder="Search archives..."
        sx={{
          backgroundColor: alpha("#000", 0.04),
          "&:hover": { backgroundColor: alpha("#000", 0.07) },
          borderRadius: 1000,
          fieldset: { border: "none" },
        }}
        hiddenLabel
        InputProps={{
          sx: {
            border: "none",
            borderRadius: 1000,
          },
          startAdornment: (
            <InputAdornment position="start">
              <Icon>search</Icon>
            </InputAdornment>
          ),
          endAdornment: (<InputAdornment position="end">
            <IconButton onClick={() => setShowHelp(true)}><Icon>help_outline</Icon>
            </IconButton>
          </InputAdornment>
          ),
        }}
        autoFocus={focus}
        fullWidth
        {...props}
      />
      <SearchHelpDialog open={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
}

function SearchHelpDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Search Help</DialogTitle>
      <IconButton onClick={() => onClose()} sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500], cursor: 'pointer' }}  >
        <Close />
      </IconButton>
      <DialogContent dividers>
        <DialogContentText sx={{
          '& dl': { m: 0 },
          '& dt': {
            fontWeight: 'bold', mt: 0,
          },
          '& dd': {
            mb: 2, textAlign: 'justify',
            code: {
              fontWeight: 'bold',
              backgroundColor: (theme) => alpha(theme.palette.primary.light, 0.08),
              color: (theme) => theme.palette.primary.light,
            }
          },
        }}>
          <dl>
            <dt>How does this work?</dt>
            <dd>
              There are many ways to search the collections of the Freedom Archives. Below is a brief guide that will help you conduct effective searches. Note, anytime you search for anything in the Freedom Archives, the first results that appear will be our digitized items. Information for items that have yet to be scanned or yet to be digitized can still be viewed, but only by checking the "Include non-digitized records" checkbox. If you are interested in accessing these non-digitized materials, please email <Link href="mailto:info@freedomarchives.org">info@freedomarchives.org</Link>.
            </dd>
            <dt>Exploring the Collections without the Search Bar</dt>
            <dd>
              Under the heading Browse By Collection, you’ll notice most of the Freedom Archives’ major collections. These collections have an image as well as a short description of what you’ll find in that collection. Click on that image to instantly explore that specific collection.
            </dd>
            <dt>Basic Searching</dt>
            <dd>
              You can always type what you’re looking for into the search bar. Certain searches may generate hundreds of results, so sometimes it will help to use quotation marks to help narrow down your results. For instance, searching for the phrase <code>Black Liberation</code> will generate all of our holdings that contain the words Black <b>and</b> Liberation, while searching for <code>"Black Liberation"</code> (in quotation marks) will only generate our records that have those two words next to each other.
            </dd>
            <dt>Advanced Searching</dt>
            <dd>
              The Freedom Archives search site also understands Boolean search logic, specifically AND (<code>+</code>, <code>&amp;</code>, or <code>AND</code>), NOT (<code>-</code> or <code>!</code>) and OR (<code>OR</code> or <code>|</code>) operators. <Link target="_blank" href="http://libguides.mit.edu/c.php?g=175963&p=1158594">Here is a brief tutorial on how to use Boolean search logic </Link>. Some examples of advanced searches:
              <ul>
                <li>
                  <ListItemText primary={<code>liberation -"black liberation"</code>} secondary={<span>returns all records that contain the word liberation but not the phrase <code>"black liberation"</code>.</span>} />
                </li>
                <li>
                  <ListItemText primary={<code>freedom OR liberation</code>} secondary={<span>returns all records that contain either the word freedom or the word liberation.</span>} />
                </li>
                <li>
                  <ListItemText primary={<code>revolution (community OR organizing)</code>} secondary={<span>returns all records that contain the word "revolution" and one of "community" or "organizing".</span>} />
                </li>
              </ul>
            </dd>
            <dt>Word Stemming</dt>
            <dd>
              The Freedom Archives search function performs "word-stemming” to match words related to your search terms. For example, a search for <code>liberation</code> will also return results for <code>liberate</code>, <code>liberated</code>, <code>liberating</code>, <code>liberations</code>, etc.
            </dd>
            <dt>Filtering Search Results</dt>
            <dd>
              After you conduct a search, you can filter your results by using the options on the left side of the page. These filters allow you to narrow your search results by format (e.g., audio, video, text), collection, date, subjects, and more. Simply click on any of the filter options to apply them to your search results. You can apply multiple filters at once to further refine your search. The number next to each filter option indicates how many records matching your current search are associated with that filter.
            </dd>
            <dt>Term Searches</dt>
            <dd>
              You’ll notice that under the heading "Common Terms", there are a number of words, phrases or names that describe content. Sometimes these are also called “tags” or "keywords". Clicking on these words will filter your search resulst to only show records that have been associated with those terms.
            </dd>
          </dl>
        </DialogContentText>
      </DialogContent>
    </Dialog>
  );
}
export function SearchForm({
  search,
  doSearch,
  nonDigitizedTotal,
  offset,
  total,
  setOffset,
  focus,
  filtersLoading,
}) {
  return (
    <Form defaultValues={search} onSubmit={doSearch}>
      <AutoSubmit action={doSearch} timeout={300} />
      <Grid
        container
        spacing={1}
        direction="row"
        alignItems="center"
        sx={{ p: 1 }}
      >
        <Grid size={5}>
          <SearchInput focus={focus} />
        </Grid>
        <Grid size={3}>
          <SelectElement
            name="sort"
            label="Sort by"
            options={Object.keys(SORT_OPTIONS).map((id) => ({ id, label: id }))}
            size="small"
            fullWidth
          />
        </Grid>
        <Grid size={3}>
          <CheckboxElement
            name="include_non_digitized"
            label={`Include non-digitized records`}
            field_type="checkbox"
            // sx={{ "& .MuiFormControlLabel-label": { fontSize: "0.875rem" } }}
            // slotProps={{ label: { size: "small" } }}
            labelProps={{
              size: "small",
              slotProps: {
                typography: { fontSize: "0.875rem" },
              },
            }}
            // autoSubmit
            width={12}
          />
        </Grid>
        <SearchResults
          total={total}
          nonDigitizedTotal={nonDigitizedTotal}
          offset={offset}
          setOffset={setOffset}
          loading={filtersLoading}
        />
      </Grid>
    </Form>
  );
}

function SearchResults({
  total,
  nonDigitizedTotal,
  offset,
  setOffset,
  loading,
}) {
  const { setValue } = useFormContext();
  return (
    <Box sx={{ width: "100%" }}>
      <Divider sx={{ my: 1 }} orientation="horizontal" flexItem />
      {total === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          No records found.
          {nonDigitizedTotal > 0 && (
            <Typography variant="body2" color="text.secondary">
              Hiding {nonDigitizedTotal} non-digitized records.
              <Button
                size="small"
                onClick={() => setValue("include_non_digitized", true)}
              >
                Show All
              </Button>
            </Typography>
          )}
        </Typography>
      ) : (
        <PaginationFooter
          offset={offset}
          total={total}
          page_size={PAGE_SIZE}
          setOffset={setOffset}
          size="small"
          loading={loading}
        />
      )}
    </Box>
  );
}
