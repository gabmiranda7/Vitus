import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, TextField, Typography,
  Alert, CircularProgress, Divider, InputAdornment, IconButton
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

  async function handleLogin() {
    setErro('');
    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', { email, senha });
      login(response.data);
      const perfil = response.data.perfil;
      if (perfil === 'Recepcionista') navigate('/pacientes');
      else if (perfil === 'Enfermeiro') navigate('/consultas');
      else if (perfil === 'Medico') navigate('/consultas');
      else navigate('/login');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { messages?: string[] } } };
      setErro(e.response?.data?.messages?.[0] ?? 'Email ou senha inválidos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0d47a1 0%, #1976d2 50%, #42a5f5 100%)',
      p: 2,
    }}>
      <Card sx={{ width: '100%', maxWidth: 420, borderRadius: 3, boxShadow: 20 }}>
        <CardContent sx={{ p: 5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Box sx={{
              bgcolor: 'primary.main', borderRadius: '50%',
              width: 72, height: 72, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              mb: 2, boxShadow: 3
            }}>
              <LocalHospitalIcon sx={{ color: 'white', fontSize: 40 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }} color="primary">Vitus</Typography>
            <Typography variant="body2" color="text.secondary">Prontuário Eletrônico</Typography>
          </Box>

          {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

          <TextField
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
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
            sx={{ mb: 3 }}
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
            sx={{ mb: 2, py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
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
            sx={{ borderRadius: 2 }}
          >
            Criar nova conta
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}