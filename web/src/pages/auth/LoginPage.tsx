import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, TextField, Typography,
  Alert, CircularProgress, Divider, InputAdornment, IconButton,
  useTheme, alpha,
} from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  async function handleLogin() {
    setErro('');
    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', { email, senha });
      login(response.data);
      const perfil = response.data.perfil;
      if (perfil === 'Recepcionista') navigate('/dashboard');
      else if (perfil === 'Enfermeiro') navigate('/dashboard');
      else if (perfil === 'Medico') navigate('/dashboard');
      else if (perfil === 'Administrador') navigate('/auditoria');
      else navigate('/login');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { messages?: string[] } } };
      setErro(e.response?.data?.messages?.[0] ?? 'Email ou senha inválidos');
    } finally {
      setLoading(false);
    }
  }

  const inputSx = {
    '& .MuiOutlinedInput-root': { borderRadius: 3 },
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isDark
        ? 'linear-gradient(135deg, #0a1929 0%, #102a3e 50%, #0d2438 100%)'
        : 'linear-gradient(135deg, #e3f2fd 0%, #e0f7fa 50%, #e8f5e9 100%)',
      p: 2,
    }}>
      <Card sx={{ width: '100%', maxWidth: 420, borderRadius: 4, boxShadow: 6 }}>
        <CardContent sx={{ p: 0, pb: '0 !important' }}>

          <Box sx={{
            bgcolor: alpha(theme.palette.primary.main, isDark ? 0.16 : 0.08),
            borderRadius: '16px 16px 0 0',
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
          }}>
            <Box sx={{
              bgcolor: 'primary.main',
              borderRadius: '50%',
              width: 64, height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
            }}>
              <LocalHospitalIcon sx={{ color: 'white', fontSize: 34 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: -0.5 }}>
              Vitus
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Prontuário Eletrônico
            </Typography>
          </Box>

          <Box sx={{ p: 4 }}>
            {erro && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{erro}</Alert>}

            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2, ...inputSx }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Senha"
              type={mostrarSenha ? 'text' : 'password'}
              fullWidth
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              sx={{ mb: 3, ...inputSx }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setMostrarSenha(!mostrarSenha)}>
                      {mostrarSenha ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleLogin}
              disabled={loading}
              sx={{ mb: 2, py: 1.5, borderRadius: 3, fontWeight: 'bold' }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
            </Button>

            <Divider sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">ou</Typography>
            </Divider>

            <Button
              variant="outlined"
              fullWidth
              size="large"
              onClick={() => navigate('/cadastro')}
              sx={{ borderRadius: 3 }}
            >
              Criar nova conta
            </Button>
          </Box>

        </CardContent>
      </Card>
    </Box>
  );
}