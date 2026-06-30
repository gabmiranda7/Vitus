import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Chip, Paper, Typography,
  Alert, useTheme, Avatar, Button
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import BadgeIcon from '@mui/icons-material/Badge';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { Prontuario, Receita, Triagem, Consulta, Paciente } from '../../types';

const statusCores: Record<string, string> = {
  Agendada: '#1976d2', EmTriagem: '#ed6c02', AguardandoAtendimento: '#0288d1',
  EmAtendimento: '#7b1fa2', Finalizada: '#2e7d32', Cancelada: '#d32f2f',
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

function calcularIdade(dataNascimento?: string): string {
  if (!dataNascimento) return '';
  const hoje = new Date();
  const nasc = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return `${idade} anos`;
}

interface ConsultaAgrupada {
  consulta: Consulta;
  triagem?: Triagem;
  receitas: Receita[];
}

interface GrupoDia {
  chave: string;
  consultas: ConsultaAgrupada[];
}

function agruparPorDia(
  consultas: Consulta[],
  triagens: Triagem[],
  receitas: Receita[]
): GrupoDia[] {
  // Indexa triagens e receitas por consultaId para lookup O(1)
  const triagemPorConsulta = new Map<string, Triagem>(
    triagens.map(t => [t.consultaId, t])
  );
  const receitasPorConsulta = receitas.reduce((acc, r) => {
    acc.set(r.consultaId, [...(acc.get(r.consultaId) ?? []), r]);
    return acc;
  }, new Map<string, Receita[]>());

  // Agrupa consultas por dia (mais antigas primeiro dentro do dia)
  const porDia = new Map<string, ConsultaAgrupada[]>();
  const consultasOrdenadas = [...consultas].sort(
    (a, b) => new Date(a.dataConsulta).getTime() - new Date(b.dataConsulta).getTime()
  );

  for (const c of consultasOrdenadas) {
    const chave = dataChave(c.dataConsulta);
    if (!porDia.has(chave)) porDia.set(chave, []);
    porDia.get(chave)!.push({
      consulta: c,
      triagem: triagemPorConsulta.get(c.id),
      receitas: receitasPorConsulta.get(c.id) ?? [],
    });
  }

  // Dias do mais recente ao mais antigo
  return Array.from(porDia.entries())
    .map(([chave, consultas]) => ({ chave, consultas }))
    .sort((a, b) => {
      const parse = (s: string) => {
        const [d, m, y] = s.split('/').map(Number);
        return new Date(y, m - 1, d).getTime();
      };
      return parse(b.chave) - parse(a.chave);
    });
}

export default function ProntuarioPacientePage(): React.ReactElement {
  const { pacienteId } = useParams();
  const navigate = useNavigate();
  const [prontuario, setProntuario] = useState<Prontuario | null>(null);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [erro, setErro] = useState('');
  const theme = useTheme();

  const isDark = theme.palette.mode === 'dark';
  const paperBg = isDark ? theme.palette.grey[900] : theme.palette.background.paper;
  const timelineBg = isDark ? theme.palette.grey[800] : '#f8faff';
  const timelineBorder = isDark ? theme.palette.grey[700] : '#e3eaf5';
  const diaBg = isDark ? theme.palette.grey[900] : '#f0f4ff';

  useEffect(() => { if (pacienteId) carregar(); }, [pacienteId]);

  async function carregar() {
    try {
      const rProntuario = await api.get(`/api/prontuarios/paciente/${pacienteId}`);
      setProntuario(rProntuario.data);
      const pacienteIdDoProntuario = rProntuario.data.pacienteId;
      if (pacienteIdDoProntuario) {
        const rPaciente = await api.get(`/api/Paciente/${pacienteIdDoProntuario}`);
        setPaciente(rPaciente.data);
      }
    } catch { setErro('Erro ao carregar prontuário'); }
  }

  if (erro) return <Layout><Alert severity="error">{erro}</Alert></Layout>;
  if (!prontuario) return <Layout><Typography color="text.secondary">Carregando...</Typography></Layout>;

  const nomePaciente = paciente?.nome ?? prontuario.consultas?.[0]?.nomePaciente ?? 'Paciente';
  const grupos = agruparPorDia(prontuario.consultas, prontuario.triagens, prontuario.receitas);

  return (
    <Layout>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/prontuarios')} variant="outlined" size="small">
          Voltar
        </Button>
      </Box>

      {/* Card do paciente */}
      <Card sx={{ mb: 3, borderRadius: 3, background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 64, height: 64, border: '2px solid rgba(255,255,255,0.4)', flexShrink: 0 }}>
              <PersonIcon sx={{ color: 'white', fontSize: 34 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, mb: 0.5 }}>{nomePaciente}</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1.5 }}>
                {[
                  { icon: <EventNoteIcon sx={{ fontSize: 16 }} />, label: `${prontuario.consultas.length} consulta(s)` },
                  { icon: <MonitorHeartIcon sx={{ fontSize: 16 }} />, label: `${prontuario.triagens.length} triagem(ns)` },
                  { icon: <MedicationIcon sx={{ fontSize: 16 }} />, label: `${prontuario.receitas.length} receita(s)` },
                  { icon: <FolderSharedIcon sx={{ fontSize: 16 }} />, label: `${grupos.length} dia(s)` },
                ].map((item, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ color: 'rgba(255,255,255,0.7)' }}>{item.icon}</Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>{item.label}</Typography>
                  </Box>
                ))}
              </Box>
              {paciente && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {paciente.dataNascimento && (
                    <Chip icon={<PersonIcon sx={{ fontSize: 14, color: 'white !important' }} />}
                      label={`${calcularIdade(paciente.dataNascimento)}${paciente.sexo ? ` · ${paciente.sexo}` : ''}`}
                      size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 11 }} />
                  )}
                  {paciente.cpf && (
                    <Chip icon={<BadgeIcon sx={{ fontSize: 14, color: 'white !important' }} />}
                      label={`CPF: ${paciente.cpf}`} size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 11 }} />
                  )}
                  {paciente.cartaoSus && (
                    <Chip label={`SUS: ${paciente.cartaoSus}`} size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 11 }} />
                  )}
                </Box>
              )}
            </Box>
          </Box>
          {paciente?.informacoesAdicionais && (
            <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,152,0,0.25)', border: '1px solid rgba(255,152,0,0.5)', display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <MedicalInformationIcon sx={{ color: '#ffb74d', fontSize: 18, mt: 0.2, flexShrink: 0 }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#ffb74d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>
                  Informações Médicas Adicionais
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.25 }}>
                  {paciente.informacoesAdicionais}
                </Typography>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <EventNoteIcon color="primary" fontSize="small" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Histórico de Atendimentos</Typography>
            <Chip label={`${grupos.length} dia(s)`} size="small" color="primary" />
          </Box>

          {grupos.length === 0 ? (
            <Typography color="text.secondary">Nenhum atendimento registrado</Typography>
          ) : (
            <Box sx={{ position: 'relative' }}>
              <Box sx={{ position: 'absolute', left: 19, top: 24, bottom: 0, width: 2, bgcolor: isDark ? 'grey.700' : 'grey.200', zIndex: 0 }} />

              {grupos.map((grupo, grupoIdx) => (
                <Box key={grupo.chave} sx={{ mb: grupoIdx < grupos.length - 1 ? 4 : 0, position: 'relative', zIndex: 1 }}>
                  {/* Cabeçalho do dia */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{
                      width: 40, height: 40, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `3px solid ${isDark ? '#1e1e1e' : 'white'}`,
                      boxShadow: '0 0 0 2px #1976d240', zIndex: 2,
                    }}>
                      <EventNoteIcon sx={{ color: 'white', fontSize: 18 }} />
                    </Box>
                    <Box sx={{ flex: 1, px: 2, py: 0.75, bgcolor: diaBg, borderRadius: 2, border: `1px solid ${timelineBorder}` }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>{grupo.chave}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {grupo.consultas.length} consulta(s) · {grupo.consultas.filter(i => i.triagem).length} triagem(ns) · {grupo.consultas.reduce((acc, i) => acc + i.receitas.length, 0)} receita(s)
                      </Typography>
                    </Box>
                  </Box>

                  {/* Consultas do dia */}
                  <Box sx={{ pl: 7, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {grupo.consultas.map(({ consulta: c, triagem: t, receitas }) => {
                      const cor = statusCores[c.status] ?? '#1976d2';
                      return (
                        <Paper key={c.id} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', borderColor: timelineBorder, borderLeft: `4px solid ${cor}` }}>

                          {/* Cabeçalho da consulta */}
                          <Box sx={{ p: 2, bgcolor: timelineBg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: '#1565c0', fontSize: 12, fontWeight: 700 }}>
                                {iniciais(c.nomeMedico)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.nomeMedico}</Typography>
                                <Typography variant="caption" color="text.secondary">Consulta às {horaFormatada(c.dataConsulta)}</Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                              <Chip label={statusLabels[c.status] ?? c.status} size="small" sx={{ bgcolor: cor, color: 'white', fontWeight: 600, fontSize: 11 }} />
                              {t && <Chip icon={<MedicalServicesIcon />} label="Triagem" size="small" sx={{ color: '#e65100', borderColor: '#e65100' }} variant="outlined" />}
                              {c.anotacoes && <Chip icon={<EditNoteIcon />} label="Anotações" size="small" color="info" variant="outlined" />}
                              {receitas.length > 0 && <Chip icon={<MedicationIcon />} label={`${receitas.length} receita(s)`} size="small" color="success" variant="outlined" />}
                            </Box>
                          </Box>

                          {/* 1. Triagem */}
                          {t && (
                            <Box sx={{ p: 2, borderTop: `1px solid ${timelineBorder}`, bgcolor: isDark ? '#2d1a00' : '#fffaf5' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                <MedicalServicesIcon sx={{ fontSize: 15, color: '#e65100' }} />
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#e65100', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                  Triagem
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                                  Por: <strong>{t.nomeEnfermeiro || '—'}</strong>
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 3, mb: t.observacoes ? 1.5 : 0 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                  <FavoriteIcon sx={{ fontSize: 15, color: 'error.main' }} />
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>Pressão</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{t.pressaoArterial}</Typography>
                                  </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                  <ThermostatIcon sx={{ fontSize: 15, color: 'warning.main' }} />
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
                          )}

                          {/* 2. Anotações clínicas */}
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

                          {/* 3. Receitas */}
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

                          {!t && !c.anotacoes && receitas.length === 0 && (
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
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}