import { ThemeProvider } from "@emotion/react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { RECORD_TYPES } from "src/config/constants";
import { theme } from "src/theme";

import Thumbnail from "./Thumbnail";

export default {
  title: "Components/Thumbnail",
  component: Thumbnail,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <Story />
      </ThemeProvider>
    ),
  ],
};

const Group = ({ label, ...props }) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
    <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 700 }}>
      {label}
    </Typography>
    <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>{sized({ ...props })}</Box>
  </Box>
);

const Records = ({ label, item, ...props }) =>
  [...RECORD_TYPES, null].map((record_type) => (
    <Group
      key={record_type}
      label={`${record_type ?? "No type"} record - ${label}`}
      {...{ ...props, item: { ...item, record_type } }}
    />
  ));

const sized = ({ item, ...props }) => (
  <>
    <Thumbnail item={item} width={75} {...props} />
    <Thumbnail item={item} width={100} {...props} />
    <Thumbnail item={item} width={250} {...props} />
  </>
);

export const NotDigitized = () => <Records label="Not digitized" item={{ record_id: 1, has_digital: false }} />;

export const Digitized = () => <Records label="Digitized" item={{ record_id: 36304, has_digital: true }} />;

export const BrokenThumbnail = () => <Records label="Broken" item={{ record_id: 99999999, has_digital: true }} />;

export const Collections = () => (
  <>
    <Group label="Collections - with thumbnail" item={{ collection_id: 336, thumbnail: true }} />
    <Group label="Collections - no thumbnail" item={{ collection_id: 336, thumbnail: null }} />
    <Group label="Collections - broken thumbnail" item={{ collection_id: 999999, thumbnail: "/foo" }} />
  </>
);

export const ManualSource = () => (
  <>
    <Group label="Manual source" src="https://freedomarchives.org/wp-content/uploads/2017/07/logo_lg.png" />
    <Group label="Manual source - broken" src="/foo" />
  </>
);
