import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, TextField, Typography,
  Alert, CircularProgress, Divider, MenuItem, Select,
  FormControl, InputLabel, InputAdornment, IconButton,
  Stepper, Step, StepLabel, Avatar, useTheme, alpha,
} from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import BadgeIcon from '@mui/icons-material/Badge';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import api from '../../services/api';

const perfis = [
  { value: 'Medico', label: 'Médico' },
  { value: 'Enfermeiro', label: 'Enfermeiro(a)' },
  { value: 'Recepcionista', label: 'Recepcionista' },
];

const perfilInfo: Record<string, { label: string; cor: string; Icon: React.ElementType }> = {
  Medico:        { label: 'Médico',          cor: '#1565c0', Icon: MedicalServicesIcon },
  Enfermeiro:    { label: 'Enfermeiro(a)',    cor: '#2e7d32', Icon: VaccinesIcon       },
  Recepcionista: { label: 'Recepcionista',   cor: '#6a1b9a', Icon: SupportAgentIcon   },
};

const steps = ['Dados pessoais', 'Perfil', 'Confirmação'];

export default function CadastroPage() {
  const [step, setStep] = useState(0);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [perfil, setPerfil] = useState('');
  const [crm, setCrm] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  function proximoStep() {
    setErro('');
    if (step === 0) {
      if (!nome.trim()) return setErro('Nome é obrigatório');
      if (!email.trim()) return setErro('Email é obrigatório');
      if (!senha.trim()) return setErro('Senha é obrigatória');
    }
    if (step === 1) {
      if (!perfil) return setErro('Selecione um perfil');
      if (perfil === 'Medico') {
        if (!crm.trim()) return setErro('CRM é obrigatório para médicos');
        if (!especialidade.trim()) return setErro('Especialidade é obrigatória para médicos');
      }
    }
    setStep(s => s + 1);
  }

  async function handleCadastro() {
    setErro(''); setSucesso(''); setLoading(true);
    try {
      await api.post('/api/auth/registrar', {
        nome, email, senha, perfil,
        ...(perfil === 'Medico' && { crm, especialidade })
      });
      setSucesso('Cadastro realizado com sucesso!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { messages?: string[] } } };
      setErro(e.response?.data?.messages?.[0] ?? 'Erro ao realizar cadastro');
      setStep(0);
    } finally {
      setLoading(false);
    }
  }

  const inputSx = {
    '& .MuiOutlinedInput-root': { borderRadius: 3 },
  };

  const info = perfilInfo[perfil];

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
      <Card sx={{ width: '100%', maxWidth: 460, borderRadius: 4, boxShadow: 6 }}>
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
              Criar nova conta
            </Typography>
          </Box>

          <Box sx={{ px: 4, pt: 3, pb: 4 }}>
            <Stepper activeStep={step} sx={{ mb: 3 }}>
              {steps.map((label) => (
                <Step key={label}><StepLabel>{label}</StepLabel></Step>
              ))}
            </Stepper>

            {erro && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{erro}</Alert>}
            {sucesso && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{sucesso}</Alert>}

            {step === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Nome completo"
                  fullWidth
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  sx={inputSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={inputSx}
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
                  sx={inputSx}
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
              </Box>
            )}

            {step === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth sx={inputSx}>
                  <InputLabel>Perfil</InputLabel>
                  <Select value={perfil} label="Perfil" onChange={(e) => setPerfil(e.target.value)}>
                    {perfis.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                  </Select>
                </FormControl>
                {perfil === 'Medico' && (
                  <>
                    <TextField
                      label="CRM"
                      fullWidth
                      value={crm}
                      onChange={(e) => setCrm(e.target.value)}
                      placeholder="Ex: CRM-MG 12345"
                      sx={inputSx}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BadgeIcon color="action" fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      label="Especialidade"
                      fullWidth
                      value={especialidade}
                      onChange={(e) => setEspecialidade(e.target.value)}
                      placeholder="Ex: Clínico Geral"
                      sx={inputSx}
                    />
                  </>
                )}
              </Box>
            )}

            {step === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Confirme seus dados antes de finalizar:
                </Typography>

                {info && (
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    borderRadius: 3,
                    bgcolor: alpha(info.cor, isDark ? 0.18 : 0.08),
                    border: `1px solid ${alpha(info.cor, 0.25)}`,
                    mb: 0.5,
                  }}>
                    <Avatar sx={{ bgcolor: info.cor, width: 48, height: 48 }}>
                      <info.Icon sx={{ fontSize: 26 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: info.cor }}>
                        {info.label}
                      </Typography>
                      {perfil === 'Medico' && (
                        <Typography variant="caption" color="text.secondary">
                          {crm} · {especialidade}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}

                {[
                  { label: 'Nome', value: nome },
                  { label: 'Email', value: email },
                ].map((item) => (
                  <Box key={item.label} sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    py: 1.5, px: 2,
                    borderRadius: 2,
                    bgcolor: 'action.hover',
                  }}>
                    <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.value}</Typography>
                  </Box>
                ))}
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              {step > 0 && (
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => setStep(s => s - 1)}
                  disabled={loading}
                  sx={{ borderRadius: 3 }}
                >
                  Voltar
                </Button>
              )}
              {step < 2 ? (
                <Button
                  variant="contained"
                  fullWidth
                  onClick={proximoStep}
                  sx={{ borderRadius: 3, fontWeight: 'bold' }}
                >
                  Próximo
                </Button>
              ) : (
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleCadastro}
                  disabled={loading}
                  sx={{ borderRadius: 3, fontWeight: 'bold' }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Finalizar Cadastro'}
                </Button>
              )}
            </Box>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">ou</Typography>
            </Divider>

            <Button
              variant="text"
              fullWidth
              onClick={() => navigate('/login')}
              sx={{ borderRadius: 3 }}
            >
              Já tenho conta — Entrar
            </Button>
          </Box>

        </CardContent>
      </Card>
    </Box>
  );
}