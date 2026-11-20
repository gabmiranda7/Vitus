import { useEffect, useState } from 'react';
import {
  Box, Chip, Typography, Avatar, Button, Alert, Paper, Divider, alpha,
  Dialog, DialogActions, DialogContent, TextField, InputAdornment,
} from '@mui/material';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { Consulta } from '../../types';

const ATUALIZACAO_MS = 30000;

function minutosEspera(dataConsulta: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(dataConsulta).getTime()) / 60000));
}

function tempoLabel(min: number): string {
  if (min < 1) return 'agora';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function corAvatar(nome: string) {
  const cores = ['#1976d2', '#388e3c', '#7b1fa2', '#c62828', '#f57c00', '#0097a7'];
  return cores[nome.charCodeAt(0) % cores.length];
}

const statusConfig: Record<string, { label: string; cor: string }> = {
  Agendada:              { label: 'Agendada',   cor: '#1976d2' },
  EmTriagem:             { label: 'Em Triagem', cor: '#ed6c02' },
  AguardandoAtendimento: { label: 'Aguardando', cor: '#0288d1' },
};

const ordemStatus: Record<string, number> = { EmTriagem: 0, AguardandoAtendimento: 1, Agendada: 2 };

export default function TriagemPage() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [, setTick] = useState(0);
  const [erro, setErro] = useState('');

  const [modalTriagem, setModalTriagem] = useState(false);
  const [consultaSelecionada, setConsultaSelecionada] = useState<Consulta | null>(null);
  const [pressaoArterial, setPressaoArterial] = useState('');
  const [temperatura, setTemperatura] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [erroModal, setErroModal] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregar();
    const reload = setInterval(carregar, ATUALIZACAO_MS);
    const tick = setInterval(() => setTick(t => t + 1), 30000);
    return () => { clearInterval(reload); clearInterval(tick); };
  }, []);

  async function carregar() {
    try {
      const r = await api.get('/api/consultas');
      setConsultas(r.data.filter((c: Consulta) => statusConfig[c.status]));
      setErro('');
    } catch (error: any) {
      setErro(error.mensagemBack ?? 'Erro ao carregar a fila');
    }
  }

  function abrirModalTriagem(c: Consulta) {
    setConsultaSelecionada(c);
    setPressaoArterial('');
    setTemperatura('');
    setObservacoes('');
    setErroModal('');
    setModalTriagem(true);
  }

  function fecharModalTriagem() {
    if (salvando) return;
    setModalTriagem(false);
    setConsultaSelecionada(null);
  }

  async function handleSalvarTriagem() {
    if (!consultaSelecionada) return;
    setErroModal('');
    if (!pressaoArterial.trim() || !temperatura.trim()) {
      setErroModal('Preencha pressão arterial e temperatura');
      return;
    }
    setSalvando(true);
    try {
      if (consultaSelecionada.status === 'Agendada') {
        await api.patch(`/api/consultas/${consultaSelecionada.id}/iniciar-triagem`);
      }
      await api.post('/api/triagens', {
        consultaId: consultaSelecionada.id,
        pressaoArterial,
        temperatura: parseFloat(temperatura),
        observacoes,
      });
      await api.patch(`/api/consultas/${consultaSelecionada.id}/aguardar-atendimento`);
      setModalTriagem(false);
      setConsultaSelecionada(null);
      carregar();
    } catch (error: any) {
      setErroModal(error.mensagemBack ?? 'Erro ao registrar triagem');
      carregar();
    } finally {
      setSalvando(false);
    }
  }

  const fila = [...consultas].sort((a, b) => {
    const diff = (ordemStatus[a.status] ?? 99) - (ordemStatus[b.status] ?? 99);
    if (diff !== 0) return diff;
    return new Date(a.dataConsulta).getTime() - new Date(b.dataConsulta).getTime();
  });

  const contagem = (s: string) => consultas.filter(c => c.status === s).length;

  return (
    <Layout>
      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <MedicalServicesIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 'bold', mr: 1 }}>Triagem</Typography>
        {Object.entries(statusConfig).map(([status, cfg]) => (
          <Chip
            key={status}
            size="small"
            label={`${contagem(status)} ${cfg.label.toLowerCase()}`}
            sx={{ bgcolor: alpha(cfg.cor, 0.12), color: cfg.cor, fontWeight: 700, fontSize: 11 }}
          />
        ))}
        <Chip
          icon={<AccessTimeIcon />} size="small" variant="outlined"
          label="Atualização automática" sx={{ ml: 'auto', fontSize: 11 }}
        />
      </Box>

      {fila.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, color: 'text.secondary' }}>
          <MedicalServicesIcon sx={{ fontSize: 64, opacity: 0.15, mb: 2 }} />
          <Typography variant="h6" sx={{ opacity: 0.4 }}>Nenhum paciente na fila</Typography>
        </Box>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {fila.map((c, i) => {
            const cfg = statusConfig[c.status];
            const min = minutosEspera(c.dataConsulta);
            const atrasada = min >= 30;
            return (
              <Box key={c.id}>
                <Box sx={{
                  display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.5,
                  borderLeft: `4px solid ${cfg.cor}`, flexWrap: { xs: 'wrap', sm: 'nowrap' },
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, width: 48, flexShrink: 0, color: cfg.cor }}>
                    {new Date(c.dataConsulta).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                  <Avatar sx={{ width: 38, height: 38, fontSize: 13, fontWeight: 700, bgcolor: corAvatar(c.nomePaciente), flexShrink: 0 }}>
                    {iniciais(c.nomePaciente)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>{c.nomePaciente}</Typography>
                    <Typography variant="caption" color={atrasada ? 'error' : 'text.secondary'} noWrap sx={{ display: 'block' }}>
                      {c.nomeMedico}{min > 0 ? ` · esperando ${tempoLabel(min)}` : ''}
                    </Typography>
                  </Box>
                  <Chip
                    label={cfg.label} size="small"
                    sx={{ bgcolor: alpha(cfg.cor, 0.12), color: cfg.cor, fontWeight: 700, fontSize: 11, flexShrink: 0 }}
                  />
                  <Box sx={{ width: 190, flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
                    {c.status === 'Agendada' && (
                      <Button size="small" variant="contained" color="warning"
                        startIcon={<MedicalServicesIcon />} onClick={() => abrirModalTriagem(c)}
                        sx={{ borderRadius: 2 }}>
                        Iniciar Triagem
                      </Button>
                    )}
                    {c.status === 'EmTriagem' && (
                      <Button size="small" variant="contained" color="info"
                        startIcon={<FavoriteIcon />} onClick={() => abrirModalTriagem(c)}
                        sx={{ borderRadius: 2 }}>
                        Registrar Sinais
                      </Button>
                    )}
                    {c.status === 'AguardandoAtendimento' && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: '#0288d1' }}>
                        <HourglassEmptyIcon sx={{ fontSize: 16 }} />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>Aguardando médico</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
                {i < fila.length - 1 && <Divider />}
              </Box>
            );
          })}
        </Paper>
      )}

      <Dialog open={modalTriagem} onClose={fecharModalTriagem} fullWidth maxWidth="sm">
        <Box sx={{ background: 'linear-gradient(135deg, #e65100 0%, #f57c00 100%)', p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 52, height: 52, border: '2px solid rgba(255,255,255,0.4)' }}>
              <MedicalServicesIcon sx={{ color: 'white', fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>Triagem</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>{consultaSelecionada?.nomePaciente}</Typography>
            </Box>
          </Box>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          {erroModal && <Alert severity="error" sx={{ mb: 2 }}>{erroModal}</Alert>}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>
            Sinais Vitais
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField label="Pressão Arterial" fullWidth value={pressaoArterial}
              onChange={(e) => setPressaoArterial(e.target.value)} placeholder="ex: 120/80"
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><FavoriteIcon sx={{ fontSize: 18, color: 'error.main' }} /></InputAdornment> } }} />
            <TextField label="Temperatura (°C)" type="number" fullWidth value={temperatura}
              onChange={(e) => setTemperatura(e.target.value)} placeholder="ex: 36.5"
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><ThermostatIcon sx={{ fontSize: 18, color: 'warning.main' }} /></InputAdornment> } }} />
          </Box>
          <Divider sx={{ mb: 2 }} />
          <TextField label="Queixa principal / observações" fullWidth multiline rows={4}
            value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Descreva a queixa principal do paciente, sintomas relatados, etc." 
            slotProps={{ htmlInput: { maxLength: 500 } }}/>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={fecharModalTriagem} variant="outlined" fullWidth disabled={salvando}>Cancelar</Button>
          <Button onClick={handleSalvarTriagem} variant="contained" color="warning" fullWidth
            startIcon={<MedicalServicesIcon />} disabled={salvando}>
            {salvando ? 'Registrando...' : 'Registrar Triagem'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}