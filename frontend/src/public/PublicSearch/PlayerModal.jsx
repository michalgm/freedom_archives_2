import { Close } from '@mui/icons-material';
import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import ReactPlayer from 'react-player';

const PlayerModal = ({ open, onClose, item }) => {
  if (!item?.url) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ mr: 3 }}>{item.title} </DialogTitle>
      <IconButton onClick={() => onClose()} sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500], cursor: 'pointer' }}  >
        <Close />
      </IconButton>
      <DialogContent>
        <ReactPlayer
          src={item.url}
          height='auto'
          controls
          width="100%"
        />
      </DialogContent>
    </Dialog>
  );
};
export default PlayerModal;
