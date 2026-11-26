import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import LogoVitus from "../../components/LogoVitus";
import SenhaForteIndicador from "../../components/SenhaForteIndicador";
import { senhaEhForte } from "../../utils/senha";
import { rotaInicial } from "../../utils/rotaInicial";

export default function TrocarSenhaPage() {
  const { usuario, isAuthenticated, login, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated || !usuario) return <Navigate to="/login" replace />;

  const obrigatoria = !!usuario.deveTrocarSenha;

  async function handleSalvar() {
    setErro("");
    if (!senhaAtual) return setErro("Informe a senha atual");
    if (!senhaEhForte(novaSenha))
      return setErro("A nova senha não atende aos requisitos de segurança");
    if (novaSenha !== confirmacao)
      return setErro("A confirmação não confere com a nova senha");
    if (novaSenha === senhaAtual)
      return setErro("A nova senha deve ser diferente da atual");

    setLoading(true);
    try {
      const r = await api.post("/api/auth/me/senha", { senhaAtual, novaSenha });
      // O servidor devolve um token novo, já sem a restrição de senha temporária
      login(r.data);
      navigate(rotaInicial(r.data.perfil), { replace: true });
    } catch (err: unknown) {
      const e = err as { mensagemBack?: string };
      setErro(e.mensagemBack ?? "Não foi possível alterar a senha");
    } finally {
      setLoading(false);
    }
  }

  function sair() {
    logout();
    navigate("/login", { replace: true });
  }

  const inputSx = { "& .MuiOutlinedInput-root": { borderRadius: 3 } };
  const slotProps = {
    input: {
      startAdornment: (
        <InputAdornment position="start">
          <LockIcon color="action" fontSize="small" />
        </InputAdornment>
      ),
      endAdornment: (
        <InputAdornment position="end">
          <IconButton size="small" onClick={() => setMostrar(!mostrar)}>
            {mostrar ? (
              <VisibilityOffIcon fontSize="small" />
            ) : (
              <VisibilityIcon fontSize="small" />
            )}
          </IconButton>
        </InputAdornment>
      ),
    },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: isDark
          ? "linear-gradient(135deg, #0a1929 0%, #102a3e 50%, #0d2438 100%)"
          : "linear-gradient(135deg, #e3f2fd 0%, #e0f7fa 50%, #e8f5e9 100%)",
        p: 2,
      }}
    >
      <Card
        sx={{ width: "100%", maxWidth: 440, borderRadius: 4, boxShadow: 6 }}
      >
        <CardContent sx={{ p: 0, pb: "0 !important" }}>
          <Box
            sx={{
              bgcolor: alpha(theme.palette.primary.main, isDark ? 0.16 : 0.08),
              borderRadius: "16px 16px 0 0",
              p: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}
          >
            <LogoVitus size={56} />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {obrigatoria ? "Crie uma nova senha" : "Alterar senha"}
            </Typography>
            {obrigatoria && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: "center" }}
              >
                Você entrou com uma senha temporária. Defina uma senha só sua
                para continuar.
              </Typography>
            )}
          </Box>

          <Box sx={{ p: 4 }}>
            {erro && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {erro}
              </Alert>
            )}

            <TextField
              label={obrigatoria ? "Senha temporária" : "Senha atual"}
              type={mostrar ? "text" : "password"}
              fullWidth
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              sx={{ mb: 2, ...inputSx }}
              slotProps={slotProps}
            />

            <TextField
              label="Nova senha"
              type={mostrar ? "text" : "password"}
              fullWidth
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              sx={{ mb: 1, ...inputSx }}
              slotProps={slotProps}
            />
            <SenhaForteIndicador senha={novaSenha} />

            <TextField
              label="Confirmar nova senha"
              type={mostrar ? "text" : "password"}
              fullWidth
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSalvar()}
              sx={{ mt: 2, mb: 3, ...inputSx }}
              slotProps={slotProps}
            />

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleSalvar}
              disabled={loading}
              sx={{ mb: 1.5, py: 1.5, borderRadius: 3, fontWeight: "bold" }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Salvar nova senha"
              )}
            </Button>

            <Button
              fullWidth
              color="inherit"
              onClick={obrigatoria ? sair : () => navigate(-1)}
              disabled={loading}
              sx={{ borderRadius: 3 }}
            >
              {obrigatoria ? "Sair" : "Voltar"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
