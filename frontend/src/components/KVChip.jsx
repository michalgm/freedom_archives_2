import { Chip, Divider, Stack, Typography } from "@mui/material";

export default function KVChip({ keyName, value, ...props }) {
  const label = (
    <Stack direction="row" alignItems={"center"}>
      <Typography variant="body1">{keyName}</Typography>
      <Divider sx={{ ml: 1, mr: 1 }} orientation="vertical" flexItem />
      <Typography variant="body1" sx={{ color: "text.secondary" }}>
        {value}
      </Typography>
    </Stack>
  );
  return <Chip variant="filled" size="small" sx={{ overflow: "hidden" }} label={label} {...props} />;
}
