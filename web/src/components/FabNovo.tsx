import { Fab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface Props {
  label: string;
  onClick: () => void;
}

export default function FabNovo({ label, onClick }: Props) {
  return (
    <Fab
      color="primary"
      variant="extended"
      onClick={onClick}
      sx={{ position: 'fixed', right: 32, bottom: 32, zIndex: (t) => t.zIndex.speedDial }}
    >
      <AddIcon sx={{ mr: 1 }} />
      {label}
    </Fab>
  );
}