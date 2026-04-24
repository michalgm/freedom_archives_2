import Search from "@mui/icons-material/Search";
import Autocomplete from "@mui/material/Autocomplete";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Icon from "@mui/material/Icon";
import InputAdornment from "@mui/material/InputAdornment";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import { alpha } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { unified_search } from "src/api";
import Thumbnail from "src/components/Thumbnail";
import { useDebouncedCallback } from "use-debounce";

const QuickSearchInput = ({ loading, InputProps, ...params }) => (
  <TextField
    {...params}
    variant="standard"
    sx={{
      borderRadius: 1,
      backgroundColor: (theme) => alpha(theme.palette.common.white, 0.2),
      "& .MuiSvgIcon-root": {
        color: "#fff !important",
      },
    }}
    placeholder="Search records and collections"
    slotProps={{
      input: {
        sx: { color: "#fff" },
        disableUnderline: true,
        ...InputProps,
        type: "search",
        startAdornment: (
          <InputAdornment position="start">
            <Search />
          </InputAdornment>
        ),
        endAdornment: loading ? (
          <InputAdornment position="end">
            <CircularProgress size={20} sx={{ color: "#fff" }} />
          </InputAdornment>
        ) : null,
      },
    }}
  />
);

function QuickSearch() {
  const [searchValue, setSearchValue] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchCountRef = useRef(0);

  const navigate = useNavigate();

  const performSearch = useDebouncedCallback(
    useCallback(async (query) => {
      setLoading(true);
      const searchCount = ++searchCountRef.current;

      try {
        const res = await unified_search.find({ query, noLoading: true });
        if (searchCount !== searchCountRef.current) return;
        setResults(res.data);
      } finally {
        setLoading(false);
      }
    }, []),
    300,
  );

  const resetSearch = useCallback(() => {
    setResults([]);
    setSearchValue("");
  }, []);

  useEffect(() => {
    return () => {
      resetSearch();
    };
  }, [resetSearch]);

  const handleInputChange = useCallback(
    (event, value, reason) => {
      if (reason === "input") {
        setSearchValue(value);
        if (value.length) {
          performSearch({
            $fullText: value,
            $limit: 10,
            $sort: { rank: -1, date_modified: -1, title: 1 },
            $select: [
              "id",
              "title",
              "result_type",
              "call_numbers",
              "collection",
              "date_modified",
              "thumbnail",
              "record_type",
              "has_digital",
            ],
          });
        } else {
          setResults([]);
        }
      }
    },
    [performSearch],
  );

  return (
    <Box sx={{ flexGrow: 0, flexShrink: 0, width: "268px", ml: "auto !important" }}>
      <Autocomplete
        size="small"
        autoHighlight
        loading={loading}
        options={results}
        blurOnSelect={true}
        clearOnBlur={true}
        disableClearable={true}
        forcePopupIcon={false}
        openOnFocus={false}
        // open={searchValue.length > 0}
        getOptionLabel={(option) => option.title || ""}
        onInputChange={handleInputChange}
        filterOptions={(x) => x}
        onChange={(event, value) => {
          if (value && value.id) {
            resetSearch();
            navigate(`/admin/${value.result_type}s/${value.id}`);
          }
        }}
        renderOption={(props, item) => {
          const { id, title, result_type } = item;

          const secondary = (
            <Stack>
              <span>{item.call_numbers}</span>
              <span>{item.collection.title}</span>
              <span>{new Date(item.date_modified).toLocaleString()}</span>
            </Stack>
          );
          return (
            <Box {...props} key={id} style={{ padding: "4px 8px" }}>
              <ListItem alignItems="flex-start" dense disableGutters sx={{ p: 0 }}>
                <ListItemAvatar sx={{ minWidth: 38 }}>
                  <Stack spacing={1} direction="column">
                    <Thumbnail item={{ ...item, [`${result_type}_id`]: item.id }} width={30} type={result_type} />
                    <Avatar sx={{ width: 30, height: 30 }} variant="rounded">
                      <Icon fontSize="inherit">{result_type === "collection" ? "library_books" : "description"}</Icon>
                    </Avatar>
                  </Stack>
                </ListItemAvatar>
                <ListItemText
                  primary={title}
                  secondary={secondary}
                  slotProps={{ secondary: { component: "div", variant: "caption" } }}
                />
              </ListItem>
            </Box>
          );
        }}
        inputValue={searchValue}
        slotProps={{
          listbox: {
            component: List,
            dense: true,
            sx: { p: 0 },
          },
          paper: {
            sx: { p: 0 },
          },
        }}
        renderInput={(params) => <QuickSearchInput {...params} loading={loading} />}
      />
    </Box>
  );
}

export default QuickSearch;
