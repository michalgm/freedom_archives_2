import { Close } from "@mui/icons-material";
import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Icon,
  IconButton,
  InputAdornment,
  Link,
  ListItemText
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useState } from "react";
import {
  TextFieldElement
} from "react-hook-form-mui";

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
