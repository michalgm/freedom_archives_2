import { Close } from '@mui/icons-material';
import { Box, Dialog, DialogContent, DialogTitle } from "@mui/material";
import IconButton from '@mui/material/IconButton';
import { useMediaQuery } from "@mui/system";
import ReactPlayer from 'react-player';

function parseAspectRatio(value) {
  if (!value) return null;
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*[:\/]\s*(\d+(?:\.\d+)?)$/);
    if (match) {
      const width = Number(match[1]);
      const height = Number(match[2]);
      if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) return width / height;
    }
    const asNumber = Number(trimmed);
    if (Number.isFinite(asNumber) && asNumber > 0) return asNumber;
  }
  return null;
}

const PlayerModal = ({ open, onClose, item }) => {
  const fullScreen = useMediaQuery((theme) => theme.breakpoints.down("md"));
  if (!item?.url) {
    return null;
  }
  const aspectRatio = parseAspectRatio(item.aspectRatio) ?? parseAspectRatio(item.aspect_ratio) ?? 16 / 9;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={fullScreen}>
      <DialogTitle sx={{ mr: 3 }}>{item.title} </DialogTitle>
      <IconButton
        onClick={() => onClose()}
        sx={{ position: "absolute", right: 8, top: 8, color: (theme) => theme.palette.grey[500], cursor: "pointer" }}
      >
        <Close />
      </IconButton>
      <DialogContent sx={{ p: 0 }}>
        <Box
          sx={{
            width: "100%",
            aspectRatio,
            position: "relative",
            backgroundColor: "black",
          }}
        >
          <ReactPlayer url={item.url} controls width="100%" height="100%" style={{ position: "absolute", inset: 0 }} />
        </Box>
      </DialogContent>
    </Dialog>
  );
};
export default PlayerModal;
