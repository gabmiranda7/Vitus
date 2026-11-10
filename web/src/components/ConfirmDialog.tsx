import {
  Avatar, Box, Button, CircularProgress, Dialog, DialogActions,
  DialogContent, Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

type Tipo = 'excluir' | 'cancelar' | 'finalizar';

const config: Record<Tipo, { cor: 'error' | 'success'; gradiente: string; Icon: React.ElementType }> = {
  excluir:   { cor: 'error',   gradiente: 'linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)', Icon: DeleteIcon },
  cancelar:  { cor: 'error',   gradiente: 'linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)', Icon: CancelIcon },
  finalizar: { cor: 'success', gradiente: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)', Icon: CheckCircleIcon },
};

interface Props {
  open: boolean;
  tipo: Tipo;
  titulo: string;
  subtitulo?: string;
  mensagem: string;
  confirmarLabel: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  open, tipo, titulo, subtitulo, mensagem, confirmarLabel, loading, onClose, onConfirm,
}: Props) {
  const { cor, gradiente, Icon } = config[tipo];
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <Box sx={{ background: gradiente, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48, border: '2px solid rgba(255,255,255,0.4)' }}>
            <Icon sx={{ color: 'white', fontSize: 26 }} />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', lineHeight: 1.2 }}>{titulo}</Typography>
            {subtitulo && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>{subtitulo}</Typography>}
          </Box>
        </Box>
      </Box>
      <DialogContent sx={{ pt: 3 }}>
        <Typography variant="body2" color="text.secondary">{mensagem}</Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" fullWidth disabled={loading}>Voltar</Button>
        <Button onClick={onConfirm} variant="contained" color={cor} fullWidth disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Icon />}>
          {confirmarLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}