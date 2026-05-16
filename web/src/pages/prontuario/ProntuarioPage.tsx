import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Card, CardContent, Chip, Paper, Typography,
  Alert, useTheme, Avatar
} from '@mui/material';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import EditNoteIcon from '@mui/icons-material/EditNote';
import MedicationIcon from '@mui/icons-material/Medication';
import PersonIcon from '@mui/icons-material/Person';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import EventNoteIcon from '@mui/icons-material/EventNote';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { Prontuario, Receita, Triagem, Consulta } from '../../types';

const statusCores: Record<string, string> = {
  Agendada: '#1976d2', EmTriagem: '#ed6c02', AguardandoAtendimento: '#0288d1',
  EmAtendimento: '#ed6c02', Finalizada: '#2e7d32', Cancelada: '#d32f2f',
};

const statusLabels: Record<string, string> = {
  Agendada: 'Agendada', EmTriagem: 'Em Triagem',
  AguardandoAtendimento: 'Aguardando', EmAtendimento: 'Em Atendimento',
  Finalizada: 'Finalizada', Cancelada: 'Cancelada',
};

function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function dataChave(data: string) {
  return new Date(data).toLocaleDateString('pt-BR');
}

function horaFormatada(data: string) {
  return new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

type EventoDia = { tipo: 'triagem'; data: string; item: Triagem }
              | { tipo: 'consulta'; data: string; item: Consulta };

export default function ProntuarioPage() {
  const { consultaId } = useParams();
  const [prontuario, setProntuario] = useState<Prontuario | null>(null);
  const [nomePaciente, setNomePaciente] = useState('');
  const [erro, setErro] = useState('');
  const theme = useTheme();

  const isDark = theme.palette.mode === 'dark';
  const paperBg = isDark ? theme.palette.grey[900] : theme.palette.background.paper;
  const timelineBg = isDark ? theme.palette.grey[800] : '#f8faff';
  const timelineBorder = isDark ? theme.palette.grey[700] : '#e3eaf5';
  const diaBg = isDark ? theme.palette.grey[900] : '#f0f4ff';

  useEffect(() => { if (consultaId) carregar(); }, [consultaId]);

  async function carregar() {
    try {
      const r = await api.get(`/api/prontuarios/consulta/${consultaId}`);
      setProntuario(r.data);
      setNomePaciente(r.data.consultas?.[0]?.nomePaciente ?? '');
    } catch { setErro('Erro ao carregar prontuário'); }
  }

  if (erro) return <Layout><Alert severity="error">{erro}</Alert></Layout>;
  if (!prontuario) return <Layout><Typography color="text.secondary">Carregando...</Typography></Layout>;

  function receitasDaConsulta(id: string): Receita[] {
    return prontuario!.receitas.filter(r => r.consultaId === id);
  }

  const eventosPorDia: Record<string, EventoDia[]> = {};

  prontuario.triagens.forEach(t => {
    const consulta = prontuario.consultas.find(c => c.id === t.prontuarioId) ?? prontuario.consultas[0];
    const chave = consulta ? dataChave(consulta.dataConsulta) : 'Sem data';
    if (!eventosPorDia[chave]) eventosPorDia[chave] = [];
    eventosPorDia[chave].push({ tipo: 'triagem', data: consulta?.dataConsulta ?? '', item: t });
  });

  prontuario.consultas.forEach(c => {
    const chave = dataChave(c.dataConsulta);
    if (!eventosPorDia[chave]) eventosPorDia[chave] = [];
    eventosPorDia[chave].push({ tipo: 'consulta', data: c.dataConsulta, item: c });
  });

  const diasOrdenados = Object.keys(eventosPorDia).sort((a, b) => {
    const [da, ma, ya] = a.split('/').map(Number);
    const [db, mb, yb] = b.split('/').map(Number);
    return new Date(yb, mb - 1, db).getTime() - new Date(ya, ma - 1, da).getTime();
  });

  return (
    <Layout>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <FolderSharedIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Prontuário</Typography>
      </Box>

      <Card sx={{ mb: 3, borderRadius: 2, background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 60, height: 60, border: '2px solid rgba(255,255,255,0.4)' }}>
              <PersonIcon sx={{ color: 'white', fontSize: 32 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>{nomePaciente || 'Paciente'}</Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
                {[
                  { icon: <EventNoteIcon sx={{ fontSize: 16 }} />, label: `${prontuario.consultas.length} consulta(s)` },
                  { icon: <MonitorHeartIcon sx={{ fontSize: 16 }} />, label: `${prontuario.triagens.length} triagem(ns)` },
                  { icon: <MedicationIcon sx={{ fontSize: 16 }} />, label: `${prontuario.receitas.length} receita(s)` },
                  { icon: <FolderSharedIcon sx={{ fontSize: 16 }} />, label: `${diasOrdenados.length} dia(s)` },
                ].map((item, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ color: 'rgba(255,255,255,0.7)' }}>{item.icon}</Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>{item.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <EventNoteIcon color="primary" fontSize="small" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Histórico de Atendimentos</Typography>
            <Chip label={`${diasOrdenados.length} dia(s)`} size="small" color="primary" />
          </Box>

          {diasOrdenados.length === 0 ? (
            <Typography color="text.secondary">Nenhum atendimento registrado</Typography>
          ) : (
            <Box sx={{ position: 'relative' }}>
              <Box sx={{ position: 'absolute', left: 19, top: 24, bottom: 0, width: 2, bgcolor: isDark ? 'grey.700' : 'grey.200', zIndex: 0 }} />

              {diasOrdenados.map((dia, diaIdx) => {
                const eventos = eventosPorDia[dia];
                return (
                  <Box key={dia} sx={{ mb: diaIdx < diasOrdenados.length - 1 ? 4 : 0, position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box sx={{
                        width: 40, height: 40, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `3px solid ${isDark ? '#1e1e1e' : 'white'}`, boxShadow: '0 0 0 2px #1976d240', zIndex: 2,
                      }}>
                        <EventNoteIcon sx={{ color: 'white', fontSize: 18 }} />
                      </Box>
                      <Box sx={{ flex: 1, px: 2, py: 0.75, bgcolor: diaBg, borderRadius: 2, border: `1px solid ${timelineBorder}` }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>{dia}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {eventos.length} evento(s) — {eventos.filter(e => e.tipo === 'triagem').length} triagem(ns) · {eventos.filter(e => e.tipo === 'consulta').length} consulta(s)
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ pl: 7, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {[...eventos].sort((a, b) => ({ triagem: 0, consulta: 1 }[a.tipo] - { triagem: 0, consulta: 1 }[b.tipo]))
                        .map((evento, evtIdx) => {
                          if (evento.tipo === 'triagem') {
                            const t = evento.item as Triagem;
                            return (
                              <Paper key={`t-${evtIdx}`} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', borderColor: '#e65100', borderLeft: '4px solid #e65100' }}>
                                <Box sx={{ p: 1.5, bgcolor: isDark ? '#2d1a00' : '#fff3e0', display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <MedicalServicesIcon sx={{ fontSize: 16, color: '#e65100' }} />
                                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#e65100', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Triagem
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                                    Por: <strong>{t.nomeEnfermeiro || '—'}</strong>
                                  </Typography>
                                </Box>
                                <Box sx={{ p: 2 }}>
                                  <Box sx={{ display: 'flex', gap: 3, mb: t.observacoes ? 1.5 : 0 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                      <FavoriteIcon sx={{ fontSize: 16, color: 'error.main' }} />
                                      <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>Pressão</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{t.pressaoArterial}</Typography>
                                      </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                      <ThermostatIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                                      <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>Temperatura</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{t.temperatura}°C</Typography>
                                      </Box>
                                    </Box>
                                  </Box>
                                  {t.observacoes && (
                                    <Box sx={{ mt: 1.5, p: 1.5, bgcolor: paperBg, borderRadius: 1, borderLeft: '3px solid #e65100' }}>
                                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>"{t.observacoes}"</Typography>
                                    </Box>
                                  )}
                                </Box>
                              </Paper>
                            );
                          }

                          const c = evento.item as Consulta;
                          const receitas = receitasDaConsulta(c.id);
                          const cor = statusCores[c.status] ?? '#1976d2';

                          return (
                            <Paper key={`c-${evtIdx}`} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', borderColor: timelineBorder, borderLeft: `4px solid ${cor}` }}>
                              <Box sx={{ p: 2, bgcolor: timelineBg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  <Avatar sx={{ width: 32, height: 32, bgcolor: '#1565c0', fontSize: 12, fontWeight: 'bold' }}>
                                    {iniciais(c.nomeMedico)}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.nomeMedico}</Typography>
                                    <Typography variant="caption" color="text.secondary">Consulta às {horaFormatada(c.dataConsulta)}</Typography>
                                  </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                  <Chip label={statusLabels[c.status] ?? c.status} size="small" sx={{ bgcolor: cor, color: 'white', fontWeight: 600, fontSize: 11 }} />
                                  {c.anotacoes && <Chip icon={<EditNoteIcon />} label="Anotações" size="small" color="info" variant="outlined" />}
                                  {receitas.length > 0 && <Chip icon={<MedicationIcon />} label={`${receitas.length} receita(s)`} size="small" color="success" variant="outlined" />}
                                </Box>
                              </Box>

                              {c.anotacoes && (
                                <Box sx={{ p: 2, borderTop: `1px solid ${timelineBorder}` }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                    <EditNoteIcon fontSize="small" color="info" />
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'info.main', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                      Anotações Clínicas
                                    </Typography>
                                  </Box>
                                  <Paper variant="outlined" sx={{ p: 1.5, bgcolor: paperBg, borderRadius: 1 }}>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{c.anotacoes}</Typography>
                                  </Paper>
                                </Box>
                              )}

                              {receitas.length > 0 && (
                                <Box sx={{ p: 2, borderTop: `1px solid ${timelineBorder}` }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                                    <MedicationIcon fontSize="small" color="success" />
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'success.main', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                      Receitas Prescritas
                                    </Typography>
                                  </Box>
                                  {receitas.map((receita) => (
                                    <Box key={receita.id} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                                      {receita.medicamentos.map((m, i) => (
                                        <Box key={i} sx={{ flex: '1 1 180px', maxWidth: { xs: '100%', sm: 'calc(50% - 4px)', md: 'calc(33.33% - 5px)' } }}>
                                          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1, bgcolor: paperBg }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{m.nome}</Typography>
                                            <Typography variant="caption" color="text.secondary">{m.dosagem} · {m.posologia}</Typography>
                                          </Paper>
                                        </Box>
                                      ))}
                                    </Box>
                                  ))}
                                </Box>
                              )}

                              {!c.anotacoes && receitas.length === 0 && (
                                <Box sx={{ p: 2, borderTop: `1px solid ${timelineBorder}` }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                    Nenhuma anotação ou receita registrada.
                                  </Typography>
                                </Box>
                              )}
                            </Paper>
                          );
                        })}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}