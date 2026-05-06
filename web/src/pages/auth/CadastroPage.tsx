import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, TextField, Typography,
  Alert, CircularProgress, Divider, MenuItem, Select,
  FormControl, InputLabel, InputAdornment, IconButton,
  Stepper, Step, StepLabel
} from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import BadgeIcon from '@mui/icons-material/Badge';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import api from '../../services/api';

const perfis = [
  { value: 'Medico', label: 'Médico' },
  { value: 'Enfermeiro', label: 'Enfermeiro(a)' },
  { value: 'Recepcionista', label: 'Recepcionista' },
];

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

  const perfilLabel = perfis.find(p => p.value === perfil)?.label ?? perfil;

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0d47a1 0%, #1976d2 50%, #42a5f5 100%)',
      p: 2,
    }}>
      <Card sx={{ width: '100%', maxWidth: 460, borderRadius: 3, boxShadow: 20 }}>
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
            <Typography variant="body2" color="text.secondary">Criar nova conta</Typography>
          </Box>

          <Stepper activeStep={step} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
          </Stepper>

          {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
          {sucesso && <Alert severity="success" sx={{ mb: 2 }}>{sucesso}</Alert>}

          {step === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Nome completo"
                fullWidth
                value={nome}
                onChange={(e) => setNome(e.target.value)}
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
              <FormControl fullWidth>
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
                  />
                </>
              )}
            </Box>
          )}

          {step === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Confirme seus dados antes de finalizar:
              </Typography>
              {[
                { label: 'Nome', value: nome },
                { label: 'Email', value: email },
                { label: 'Perfil', value: perfilLabel },
                ...(perfil === 'Medico' ? [
                  { label: 'CRM', value: crm },
                  { label: 'Especialidade', value: especialidade },
                ] : []),
              ].map((item) => (
                <Box key={item.label} sx={{
                  display: 'flex', justifyContent: 'space-between',
                  py: 1.5, px: 2, borderRadius: 1,
                  bgcolor: 'action.hover'
                }}>
                  <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.value}</Typography>
                </Box>
              ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
            {step > 0 && (
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setStep(s => s - 1)}
                disabled={loading}
                sx={{ borderRadius: 2 }}
              >
                Voltar
              </Button>
            )}
            {step < 2 ? (
              <Button
                variant="contained"
                fullWidth
                onClick={proximoStep}
                sx={{ borderRadius: 2, fontWeight: 'bold' }}
              >
                Próximo
              </Button>
            ) : (
              <Button
                variant="contained"
                fullWidth
                onClick={handleCadastro}
                disabled={loading}
                sx={{ borderRadius: 2, fontWeight: 'bold' }}
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
            sx={{ borderRadius: 2 }}
          >
            Já tenho conta — Entrar
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}