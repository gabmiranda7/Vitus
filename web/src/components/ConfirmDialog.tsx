import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";

type Tipo = "excluir" | "cancelar" | "finalizar";

const config: Record<
  Tipo,
  { cor: "error" | "success"; Icon: React.ElementType; descricao: string }
> = {
  excluir: {
    cor: "error",
    Icon: DeleteOutlinedIcon,
    descricao: "Esta ação é permanente",
  },
  cancelar: {
    cor: "error",
    Icon: WarningAmberRoundedIcon,
    descricao: "Confirme para continuar",
  },
  finalizar: {
    cor: "success",
    Icon: CheckCircleOutlinedIcon,
    descricao: "Confirme para concluir",
  },
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
  open,
  tipo,
  titulo,
  subtitulo,
  mensagem,
  confirmarLabel,
  loading,
  onClose,
  onConfirm,
}: Props) {
  const theme = useTheme();
  const { cor, Icon, descricao } = config[tipo];
  const principal = theme.palette[cor].main;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
            backgroundImage: "none",
          },
        },
      }}
    >
      <DialogContent sx={{ px: 3.5, pt: 4, pb: 1, textAlign: "center" }}>
        <Box
          sx={{
            width: 60,
            height: 60,
            mx: "auto",
            mb: 2.5,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: principal,
            bgcolor: alpha(principal, 0.12),
            animation: "iconePop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
            "@keyframes iconePop": {
              from: { transform: "scale(0.5)", opacity: 0 },
              to: { transform: "scale(1)", opacity: 1 },
            },
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          }}
        >
          <Icon sx={{ fontSize: 30 }} />
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
          {titulo}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 0.5,
            mb: 1.5,
            color: "text.disabled",
            fontWeight: 500,
          }}
        >
          {subtitulo || descricao}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", lineHeight: 1.7 }}
        >
          {mensagem}
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3.5,
          pt: 2.5,
          pb: 3.5,
          gap: 1.5,
          "& > :not(style) ~ :not(style)": { ml: 0 },
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          fullWidth
          disabled={loading}
          sx={{
            minHeight: 44,
            borderColor: "divider",
            color: "text.secondary",
          }}
        >
          Voltar
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={cor}
          fullWidth
          disabled={loading}
          sx={{ minHeight: 44 }}
        >
          {loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            confirmarLabel
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
