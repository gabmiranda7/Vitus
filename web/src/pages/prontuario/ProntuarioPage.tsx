import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Card, CardContent, Chip, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Typography,
  Alert, useTheme, Avatar, Divider, Grid
} from '@mui/material';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import EditNoteIcon from '@mui/icons-material/EditNote';
import MedicationIcon from '@mui/icons-material/Medication';
import PersonIcon from '@mui/icons-material/Person';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import EventNoteIcon from '@mui/icons-material/EventNote';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { Prontuario, Receita } from '../../types';

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

export default function ProntuarioPage() {
  const { consultaId } = useParams();
  const [prontuario, setProntuario] = useState<Prontuario | null>(null);
  const [nomePaciente, setNomePaciente] = useState('');
  const [erro, setErro] = useState('');
  const theme = useTheme();

  const isDark = theme.palette.mode === 'dark';
  const headerBg = isDark ? theme.palette.grey[800] : theme.palette.grey[100];
  const paperBg = isDark ? theme.palette.grey[900] : theme.palette.background.paper;
  const timelineBg = isDark ? theme.palette.grey[800] : '#f8faff';
  const timelineBorder = isDark ? theme.palette.grey[700] : '#e3eaf5';

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

  const consultasOrdenadas = [...prontuario.consultas].sort(
    (a, b) => new Date(b.dataConsulta).getTime() - new Date(a.dataConsulta).getTime()
  );

  return (
    <Layout>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <FolderSharedIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Prontuário</Typography>
      </Box>

      {/* Card do paciente */}
      <Card sx={{ mb: 3, borderRadius: 2, background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 60, height: 60, border: '2px solid rgba(255,255,255,0.4)' }}>
              <PersonIcon sx={{ color: 'white', fontSize: 32 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                {nomePaciente || 'Paciente'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <EventNoteIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    {prontuario.consultas.length} consulta(s)
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <MonitorHeartIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    {prontuario.triagens.length} triagem(ns)
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <MedicationIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    {prontuario.receitas.length} receita(s)
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Triagens — cards compactos */}
      {prontuario.triagens.length > 0 && (
        <Card sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <MonitorHeartIcon color="error" fontSize="small" />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Triagens</Typography>
              <Chip label={prontuario.triagens.length} size="small" color="error" />
            </Box>
            <Grid container spacing={2}>
              {prontuario.triagens.map((t) => (
                <Grid item xs={12} sm={6} md={4} key={t.id}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: timelineBg, borderColor: timelineBorder }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Por: <strong>{t.nomeEnfermeiro || '—'}</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <FavoriteIcon sx={{ fontSize: 14, color: 'error.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{t.pressaoArterial}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ThermostatIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{t.temperatura}°C</Typography>
                      </Box>
                    </Box>
                    {t.observacoes && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
                        "{t.observacoes}"
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Timeline de consultas */}
      <Card sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <EventNoteIcon color="primary" fontSize="small" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Histórico de Consultas</Typography>
            <Chip label={prontuario.consultas.length} size="small" color="primary" />
          </Box>

          {consultasOrdenadas.length === 0 ? (
            <Typography color="text.secondary">Nenhuma consulta registrada</Typography>
          ) : (
            <Box sx={{ position: 'relative' }}>
              {/* Linha vertical da timeline */}
              <Box sx={{
                position: 'absolute', left: 19, top: 0, bottom: 0,
                width: 2, bgcolor: isDark ? 'grey.700' : 'grey.200', zIndex: 0
              }} />

              {consultasOrdenadas.map((c, idx) => {
                const receitas = receitasDaConsulta(c.id);
                const cor = statusCores[c.status] ?? '#1976d2';
                const dataFormatada = new Date(c.dataConsulta).toLocaleDateString('pt-BR');
                const horaFormatada = new Date(c.dataConsulta).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                return (
                  <Box key={c.id} sx={{ display: 'flex', gap: 2, mb: idx < consultasOrdenadas.length - 1 ? 3 : 0, position: 'relative', zIndex: 1 }}>
                    {/* Bolinha da timeline */}
                    <Box sx={{ flexShrink: 0, mt: 1.5 }}>
                      <Box sx={{
                        width: 40, height: 40,
                        borderRadius: '50%',
                        bgcolor: cor,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `3px solid ${isDark ? '#1e1e1e' : 'white'}`,
                        boxShadow: `0 0 0 2px ${cor}40`,
                      }}>
                        <EventNoteIcon sx={{ color: 'white', fontSize: 18 }} />
                      </Box>
                    </Box>

                    {/* Conteúdo */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Paper variant="outlined" sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                        borderColor: timelineBorder,
                        borderLeft: `4px solid ${cor}`,
                      }}>
                        {/* Header da consulta */}
                        <Box sx={{ p: 2, bgcolor: timelineBg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: '#1565c0', fontSize: 12, fontWeight: 'bold' }}>
                              {iniciais(c.nomeMedico)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.nomeMedico}</Typography>
                              <Typography variant="caption" color="text.secondary">{dataFormatada} às {horaFormatada}</Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Chip
                              label={statusLabels[c.status] ?? c.status}
                              size="small"
                              sx={{ bgcolor: cor, color: 'white', fontWeight: 600, fontSize: 11 }}
                            />
                            {c.anotacoes && <Chip icon={<EditNoteIcon />} label="Anotações" size="small" color="info" variant="outlined" />}
                            {receitas.length > 0 && <Chip icon={<MedicationIcon />} label={`${receitas.length} receita(s)`} size="small" color="success" variant="outlined" />}
                          </Box>
                        </Box>

                        {/* Anotações */}
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

                        {/* Receitas */}
                        {receitas.length > 0 && (
                          <Box sx={{ p: 2, borderTop: `1px solid ${timelineBorder}` }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                              <MedicationIcon fontSize="small" color="success" />
                              <Typography variant="caption" sx={{ fontWeight: 600, color: 'success.main', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Receitas Prescritas
                              </Typography>
                            </Box>
                            {receitas.map((receita) => (
                              <Box key={receita.id} sx={{ mb: 1 }}>
                                <Grid container spacing={1}>
                                  {receita.medicamentos.map((m, i) => (
                                    <Grid item xs={12} sm={6} md={4} key={i}>
                                      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1, bgcolor: paperBg }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{m.nome}</Typography>
                                        <Typography variant="caption" color="text.secondary">{m.dosagem} · {m.posologia}</Typography>
                                      </Paper>
                                    </Grid>
                                  ))}
                                </Grid>
                              </Box>
                            ))}
                          </Box>
                        )}

                        {!c.anotacoes && receitas.length === 0 && (
                          <Box sx={{ p: 2, borderTop: `1px solid ${timelineBorder}` }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              Nenhuma anotação ou receita registrada nesta consulta.
                            </Typography>
                          </Box>
                        )}
                      </Paper>
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