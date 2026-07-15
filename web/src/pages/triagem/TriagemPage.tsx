import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Chip, Typography, Avatar, Button,
  LinearProgress, Alert, Paper, useTheme, alpha, Divider
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EventNoteIcon from '@mui/icons-material/EventNote';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { Consulta } from '../../types';

function minutosEspera(dataConsulta: string): number {
  return Math.max(0, Math.floor((new Date().getTime() - new Date(dataConsulta).getTime()) / 1000 / 60));
}

function tempoLabel(min: number): string {
  if (min < 1) return 'Agora';
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

const statusConfig: Record<string, { label: string; cor: string; corChip: 'default' | 'primary' | 'warning' | 'info' | 'success' }> = {
  Agendada:              { label: 'Agendada',          cor: '#1976d2', corChip: 'primary' },
  EmTriagem:             { label: 'Em Triagem',         cor: '#ed6c02', corChip: 'warning' },
  AguardandoAtendimento: { label: 'Aguardando',         cor: '#0288d1', corChip: 'info'    },
};

export default function TriagemPage() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [, setTick] = useState(0);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    carregar();
    const reload = setInterval(carregar, 60000);
    const tick = setInterval(() => setTick(t => t + 1), 30000);
    return () => { clearInterval(reload); clearInterval(tick); };
  }, []);

  async function carregar() {
    try {
      const r = await api.get('/api/consultas');
      setConsultas(r.data.filter((c: Consulta) =>
        ['Agendada', 'EmTriagem', 'AguardandoAtendimento'].includes(c.status)
      ));
    } catch (error: any) { setErro(error.mensagemBack ?? 'Erro ao carregar'); }
  }

  async function handleIniciarTriagem(id: string) {
    setLoadingId(id);
    try {
      await api.patch(`/api/consultas/${id}/iniciar-triagem`);
      carregar();
    } catch (error: any) { setErro(error.mensagemBack ?? 'Erro ao iniciar triagem'); }
    finally { setLoadingId(null); }
  }

  async function handleAguardar(id: string) {
    setLoadingId(id);
    try {
      await api.patch(`/api/consultas/${id}/aguardar-atendimento`);
      carregar();
    } catch (error: any) { setErro(error.mensagemBack ?? 'Erro ao enviar para atendimento'); }
    finally { setLoadingId(null); }
  }

  const agendadas = consultas.filter(c => c.status === 'Agendada');
  const emTriagem = consultas.filter(c => c.status === 'EmTriagem');
  const aguardando = consultas.filter(c => c.status === 'AguardandoAtendimento');

  return (
    <Layout>
      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MedicalServicesIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Triagem</Typography>
          <Chip label={consultas.length} size="small" color="warning" />
        </Box>
        <Chip icon={<AccessTimeIcon />} label="Atualiza a cada minuto" size="small" variant="outlined" />
      </Box>

      {/* Cards de resumo */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Agendadas',   valor: agendadas.length,  cor: '#1976d2', icon: <EventNoteIcon /> },
          { label: 'Em Triagem',  valor: emTriagem.length,  cor: '#ed6c02', icon: <MedicalServicesIcon /> },
          { label: 'Aguardando',  valor: aguardando.length, cor: '#0288d1', icon: <HourglassEmptyIcon /> },
          { label: 'Total',       valor: consultas.length,  cor: '#7b1fa2', icon: <WarningAmberIcon /> },
        ].map((s) => (
          <Paper key={s.label} sx={{
            flex: '1 1 120px', p: 2, borderRadius: 3,
            bgcolor: alpha(s.cor, isDark ? 0.12 : 0.07),
            border: `1px solid ${alpha(s.cor, 0.2)}`,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box sx={{ color: s.cor, display: 'flex' }}>{s.icon}</Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: s.cor, lineHeight: 1 }}>{s.valor}</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
          </Paper>
        ))}
      </Box>

      {consultas.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, color: 'text.secondary' }}>
          <MedicalServicesIcon sx={{ fontSize: 72, opacity: 0.15, mb: 2 }} />
          <Typography variant="h6" sx={{ opacity: 0.4 }}>Nenhum paciente na fila</Typography>
          <Typography variant="body2" sx={{ opacity: 0.3, mt: 1 }}>A lista atualiza automaticamente a cada minuto</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {consultas
            .sort((a, b) => {
              const ordemStatus: Record<string, number> = { EmTriagem: 0, AguardandoAtendimento: 1, Agendada: 2 };
              const diff = (ordemStatus[a.status] ?? 99) - (ordemStatus[b.status] ?? 99);
              if (diff !== 0) return diff;
              return minutosEspera(b.dataConsulta) - minutosEspera(a.dataConsulta);
            })
            .map((c) => {
              const min = minutosEspera(c.dataConsulta);
              const progresso = Math.min((min / 30) * 100, 100);
              const cfg = statusConfig[c.status] ?? { label: c.status, cor: '#1976d2', corChip: 'default' };

              return (
                <Box key={c.id} sx={{ flex: '1 1 280px', maxWidth: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.33% - 11px)' } }}>
                  <Card sx={{
                    borderRadius: 3, overflow: 'hidden',
                    border: `1px solid ${alpha(cfg.cor, 0.25)}`,
                    borderTop: `4px solid ${cfg.cor}`,
                    transition: '0.2s', '&:hover': { boxShadow: 4 }
                  }}>
                    <CardContent sx={{ p: 2.5 }}>
                      {/* Status */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Chip label={cfg.label} color={cfg.corChip} size="small" sx={{ fontWeight: 700 }} />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(c.dataConsulta).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>

                      {/* Paciente */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <Avatar sx={{ bgcolor: corAvatar(c.nomePaciente), width: 48, height: 48, fontWeight: 'bold', fontSize: 16 }}>
                          {iniciais(c.nomePaciente)}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body1" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.nomePaciente}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocalHospitalIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                            <Typography variant="caption" color="text.secondary">{c.nomeMedico}</Typography>
                          </Box>
                        </Box>
                      </Box>

                      <Divider sx={{ mb: 2 }} />

                      {/* Tempo de espera */}
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AccessTimeIcon sx={{ fontSize: 14, color: cfg.cor }} />
                            <Typography variant="caption" sx={{ color: cfg.cor, fontWeight: 600 }}>
                              Esperando {tempoLabel(min)}
                            </Typography>
                          </Box>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={progresso}
                          color={progresso >= 100 ? 'error' : progresso >= 50 ? 'warning' : 'success'}
                          sx={{ borderRadius: 2, height: 6 }}
                        />
                      </Box>

                      {/* Ação conforme status */}
                      {c.status === 'Agendada' && (
                        <Button fullWidth size="small" variant="contained" color="warning"
                          startIcon={<MedicalServicesIcon />}
                          disabled={loadingId === c.id}
                          onClick={() => handleIniciarTriagem(c.id)}
                          sx={{ borderRadius: 2 }}>
                          Iniciar Triagem
                        </Button>
                      )}
                      {c.status === 'EmTriagem' && (
                        <Button fullWidth size="small" variant="contained" color="info"
                          startIcon={<FavoriteIcon />}
                          disabled={loadingId === c.id}
                          onClick={() => handleAguardar(c.id)}
                          sx={{ borderRadius: 2 }}>
                          Enviar para Atendimento
                        </Button>
                      )}
                      {c.status === 'AguardandoAtendimento' && (
                        <Box sx={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          gap: 1, py: 1, borderRadius: 2,
                          bgcolor: alpha('#0288d1', isDark ? 0.15 : 0.07),
                        }}>
                          <HourglassEmptyIcon sx={{ fontSize: 16, color: '#0288d1' }} />
                          <Typography variant="caption" sx={{ color: '#0288d1', fontWeight: 600 }}>
                            Aguardando médico
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              );
            })}
        </Box>
      )}
    </Layout>
  );
}