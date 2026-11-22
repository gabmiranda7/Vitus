import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

type Tipo = "excluir" | "cancelar" | "finalizar";

const config: Record<
  Tipo,
  {
    cor: "error" | "success";
    gradiente: string;
    Icon: React.ElementType;
    descricao: string;
  }
> = {
  excluir: {
    cor: "error",
    gradiente: "linear-gradient(135deg, #991b1b 0%, #dc2626 100%)",
    Icon: DeleteIcon,
    descricao: "Ação permanente",
  },
  cancelar: {
    cor: "error",
    gradiente: "linear-gradient(135deg, #991b1b 0%, #dc2626 100%)",
    Icon: CancelIcon,
    descricao: "Confirmação necessária",
  },
  finalizar: {
    cor: "success",
    gradiente: "linear-gradient(135deg, #166534 0%, #16a34a 100%)",
    Icon: CheckCircleIcon,
    descricao: "Concluir operação",
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
  const { cor, gradiente, Icon, descricao } = config[tipo];

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        },
      }}
    >
      {/* Cabeçalho */}
      <Box
        sx={{
          background: gradiente,
          px: 3,
          py: 3.5,
          position: "relative",
          overflow: "hidden",
          "&::after": {
            content: '""',
            position: "absolute",
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.07)",
            right: -45,
            top: -65,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            position: "relative",
            zIndex: 1,
          }}
        >
          <Avatar
            sx={{
              bgcolor: "rgba(255,255,255,0.18)",
              width: 54,
              height: 54,
              border: "1px solid rgba(255,255,255,0.35)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            }}
          >
            <Icon sx={{ color: "white", fontSize: 28 }} />
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                color: "white",
                fontWeight: 700,
                lineHeight: 1.3,
                letterSpacing: "-0.3px",
              }}
            >
              {titulo}
            </Typography>

            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.8)",
                fontWeight: 500,
                letterSpacing: 0.3,
              }}
            >
              {subtitulo || descricao}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Mensagem */}
      <DialogContent
        sx={{
          px: 3,
          pt: 3,
          pb: 2,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            lineHeight: 1.8,
            fontSize: "0.9rem",
          }}
        >
          {mensagem}
        </Typography>
      </DialogContent>

      {/* Ações */}
      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          pt: 1,
          gap: 1.5,
          "& > :not(style) ~ :not(style)": {
            ml: 0,
          },
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          fullWidth
          disabled={loading}
          sx={{
            minHeight: 44,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            borderColor: "divider",
            color: "text.secondary",
            "&:hover": {
              borderColor: "text.secondary",
              bgcolor: "action.hover",
            },
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
          startIcon={
            loading ? <CircularProgress size={17} color="inherit" /> : <Icon />
          }
          sx={{
            minHeight: 44,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 700,
            boxShadow: "none",
            "&:hover": {
              boxShadow: "0 4px 12px rgba(0,0,0,0.16)",
            },
          }}
        >
          {confirmarLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
