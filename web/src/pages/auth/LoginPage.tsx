import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  IconButton,
  useTheme,
  alpha,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import LogoVitus from "../../components/LogoVitus";
import { rotaInicial } from "../../utils/rotaInicial";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [esqueciAberto, setEsqueciAberto] = useState(false);
  const [emailEsqueci, setEmailEsqueci] = useState("");
  const [enviandoEsqueci, setEnviandoEsqueci] = useState(false);
  const [msgEsqueci, setMsgEsqueci] = useState("");
  const [erroEsqueci, setErroEsqueci] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  async function handleLogin() {
    setErro("");
    setLoading(true);
    try {
      const response = await api.post("/api/auth/login", { email, senha });
      login(response.data);
      navigate(
        response.data.deveTrocarSenha
          ? "/trocar-senha"
          : rotaInicial(response.data.perfil),
      );
    } catch (err: unknown) {
      const e = err as {
        mensagemBack?: string;
        response?: { data?: { Messages?: string[]; messages?: string[] } };
      };
      const mensagem =
        e.mensagemBack ??
        e.response?.data?.Messages?.[0] ??
        e.response?.data?.messages?.[0];
      setErro(
        mensagem ??
          "Não foi possível entrar. Verifique sua conexão e tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  function abrirEsqueci() {
    setEmailEsqueci(email);
    setMsgEsqueci("");
    setErroEsqueci("");
    setEsqueciAberto(true);
  }

  function fecharEsqueci() {
    if (!enviandoEsqueci) setEsqueciAberto(false);
  }

  async function enviarEsqueci() {
    setErroEsqueci("");
    if (!/^\S+@\S+\.\S+$/.test(emailEsqueci.trim())) {
      setErroEsqueci("Informe um e-mail válido");
      return;
    }
    setEnviandoEsqueci(true);
    try {
      const r = await api.post("/api/auth/esqueci-senha", {
        email: emailEsqueci.trim(),
      });
      setMsgEsqueci(
        r.data?.mensagem ??
          "Pedido registrado. O administrador vai gerar uma senha temporária para você.",
      );
    } catch (err: unknown) {
      const e = err as { mensagemBack?: string };
      setErroEsqueci(
        e.mensagemBack ?? "Não foi possível enviar o pedido. Tente novamente.",
      );
    } finally {
      setEnviandoEsqueci(false);
    }
  }

  const inputSx = { "& .MuiOutlinedInput-root": { borderRadius: 3 } };

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
        sx={{ width: "100%", maxWidth: 420, borderRadius: 4, boxShadow: 6 }}
      >
        <CardContent sx={{ p: 0, pb: "0 !important" }}>
          <Box
            sx={{
              bgcolor: alpha(theme.palette.primary.main, isDark ? 0.16 : 0.08),
              borderRadius: "16px 16px 0 0",
              p: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}
          >
            <LogoVitus size={72} />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: "primary.main",
                letterSpacing: -0.5,
              }}
            >
              Vitus
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Prontuário Eletrônico
            </Typography>
          </Box>

          <Box sx={{ p: 4 }}>
            {erro && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {erro}
              </Alert>
            )}

            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2, ...inputSx }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label="Senha"
              type={mostrarSenha ? "text" : "password"}
              fullWidth
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              sx={{ mb: 0.5, ...inputSx }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setMostrarSenha(!mostrarSenha)}
                      >
                        {mostrarSenha ? (
                          <VisibilityOffIcon fontSize="small" />
                        ) : (
                          <VisibilityIcon fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
              <Button size="small" onClick={abrirEsqueci}>
                Esqueci minha senha
              </Button>
            </Box>

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleLogin}
              disabled={loading}
              sx={{ mb: 2, py: 1.5, borderRadius: 3, fontWeight: "bold" }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Entrar"
              )}
            </Button>

            <Divider sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                ou
              </Typography>
            </Divider>

            <Button
              variant="outlined"
              fullWidth
              size="large"
              onClick={() => navigate("/cadastro")}
              sx={{ borderRadius: 3 }}
            >
              Criar nova conta
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={esqueciAberto}
        onClose={fecharEsqueci}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Esqueci minha senha</DialogTitle>
        <DialogContent>
          {msgEsqueci ? (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              {msgEsqueci}
            </Alert>
          ) : (
            <>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2, mt: 0.5 }}
              >
                Informe seu e-mail. O administrador será avisado e vai gerar uma
                senha temporária para você, que deverá ser trocada no primeiro
                acesso.
              </Typography>
              {erroEsqueci && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  {erroEsqueci}
                </Alert>
              )}
              <TextField
                label="Email"
                type="email"
                fullWidth
                autoFocus
                value={emailEsqueci}
                onChange={(e) => setEmailEsqueci(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && enviarEsqueci()}
                sx={inputSx}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          {msgEsqueci ? (
            <Button variant="contained" fullWidth onClick={fecharEsqueci}>
              Fechar
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                fullWidth
                onClick={fecharEsqueci}
                disabled={enviandoEsqueci}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={enviarEsqueci}
                disabled={enviandoEsqueci || !emailEsqueci.trim()}
              >
                {enviandoEsqueci ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  "Solicitar"
                )}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
