import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Chip, Avatar,
  LinearProgress, Button, Paper, alpha,
} from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNote';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import PeopleIcon from '@mui/icons-material/People';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MedicationIcon from '@mui/icons-material/Medication';
import ScienceIcon from '@mui/icons-material/Science';
import HistoryIcon from '@mui/icons-material/History';
import TodayIcon from '@mui/icons-material/Today';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import Layout from '../../components/layout/Layout';
import { iniciais, corAvatar } from '../../utils/pessoas';
import { statusCores, statusLabels } from '../../utils/consulta';
import { acaoLabels, acaoCores } from '../../utils/auditoria';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Consulta, AuditoriaLog } from '../../types';

const statusAtivos = [
  'EmAtendimento',
  'AguardandoAtendimento',
  'EmTriagem',
  'Agendada',
];

const LIMITE_LISTA = 5;

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function dataHoje() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function DashboardPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [logs, setLogs] = useState<AuditoriaLog[]>([]);
  const [pendentesCount, setPendentesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const isAdmin = usuario?.perfil === 'Administrador';
  const isMedico = usuario?.perfil === 'Medico';
  const isEnfermeiro = usuario?.perfil === 'Enfermeiro';
  const isRecepcionista = usuario?.perfil === 'Recepcionista';

  useEffect(() => {
    carregar();
    const interval = setInterval(carregar, 60000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  async function carregar() {
    try {
      if (isAdmin) {
        const [resLogs, resPendentes] = await Promise.all([
          api.get('/api/auditoria'),
          api.get('/api/auth/pendentes').catch(() => ({ data: [] })),
        ]);
        setLogs(resLogs.data);
        setPendentesCount(Array.isArray(resPendentes.data) ? resPendentes.data.length : 0);
      } else {
        const r = await api.get('/api/consultas');
        setConsultas(r.data);
      }
    } finally {
      setLoading(false);
    }
  }

  const ativas = consultas
    .filter(c => statusAtivos.includes(c.status))
    .filter(c => !isMedico || c.medicoId === usuario?.medicoId)
    .sort((a, b) => statusAtivos.indexOf(a.status) - statusAtivos.indexOf(b.status));

  const logsRecentes = useMemo(
    () =>
      [...logs]
        .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
        .slice(0, LIMITE_LISTA),
    [logs]
  );

  const hojeStr = new Date().toDateString();
  const logsHoje = logs.filter(l => new Date(l.dataHora).toDateString() === hojeStr).length;
  const usuariosUnicos = new Set(logs.map(l => l.usuarioId)).size;

  const topAcoes = useMemo(() => {
    const contagem: Record<string, number> = {};
    logs.forEach(l => {
      contagem[l.acao] = (contagem[l.acao] ?? 0) + 1;
    });
    return Object.entries(contagem)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [logs]);

  const kpisAdmin = [
    {
      label: 'Total de Registros',
      valor: logs.length,
      cor: '#1976d2',
      icon: <HistoryIcon />,
      rota: '/auditoria',
    },
    {
      label: 'Registros Hoje',
      valor: logsHoje,
      cor: '#2e7d32',
      icon: <TodayIcon />,
      rota: '/auditoria',
    },
    {
      label: 'Usuários Ativos',
      valor: usuariosUnicos,
      cor: '#7b1fa2',
      icon: <PeopleIcon />,
      rota: '/auditoria',
    },
    {
      label: 'Aprovações Pendentes',
      valor: pendentesCount,
      cor: pendentesCount > 0 ? '#ed6c02' : '#546e7a',
      icon: <HowToRegIcon />,
      rota: '/aprovacoes',
    },
  ];

  const atalhos = [
    ...(isAdmin ? [
      {
        label: 'Auditoria',
        cor: '#1976d2',
        icon: <HistoryIcon />,
        rota: '/auditoria',
      },
      {
        label: 'Aprovações',
        cor: '#ed6c02',
        icon: <HowToRegIcon />,
        rota: '/aprovacoes',
      },
    ] : []),

    ...(isRecepcionista ? [
      {
        label: 'Pacientes',
        cor: '#1976d2',
        icon: <PeopleIcon />,
        rota: '/pacientes',
      },
      {
        label: 'Médicos',
        cor: '#1565c0',
        icon: <LocalHospitalIcon />,
        rota: '/medicos',
      },
      {
        label: 'Consultas',
        cor: '#7b1fa2',
        icon: <EventNoteIcon />,
        rota: '/consultas',
      },
    ] : []),

    ...(isMedico ? [
      {
        label: 'Consultas',
        cor: '#1976d2',
        icon: <EventNoteIcon />,
        rota: '/consultas',
      },
      {
        label: 'Prontuários',
        cor: '#7b1fa2',
        icon: <PeopleIcon />,
        rota: '/prontuarios',
      },
      {
        label: 'Receitas',
        cor: '#2e7d32',
        icon: <MedicationIcon />,
        rota: '/receitas',
      },
    ] : []),

    ...(isEnfermeiro ? [
      {
        label: 'Triagem',
        cor: '#ed6c02',
        icon: <MedicalServicesIcon />,
        rota: '/triagem',
      },
      {
        label: 'Consultas',
        cor: '#1976d2',
        icon: <EventNoteIcon />,
        rota: '/consultas',
      },
      {
        label: 'Prontuários',
        cor: '#7b1fa2',
        icon: <ScienceIcon />,
        rota: '/prontuarios',
      },
    ] : []),
  ].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

  return (
    <Layout>
      {loading && (
        <LinearProgress
          sx={{
            position: 'fixed',
            top: 64,
            left: 0,
            right: 0,
            zIndex: 9999,
          }}
        />
      )}

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
          {saudacao()}, {usuario?.nome?.split(' ')[0]}
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ textTransform: 'capitalize' }}
        >
          {dataHoje()}
        </Typography>
      </Box>

      {isAdmin ? (
        <>
          {/* Grid de KPIs clicáveis */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            {kpisAdmin.map((kpi) => (
              <Card
                key={kpi.label}
                onClick={() => navigate(kpi.rota)}
                sx={{
                  flex: '1 1 200px',
                  borderRadius: 3,
                  borderLeft: `4px solid ${kpi.cor}`,
                  cursor: 'pointer',
                  transition: '0.15s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        bgcolor: alpha(kpi.cor, 0.12),
                        color: kpi.cor,
                        display: 'flex',
                      }}
                    >
                      {kpi.icon}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                        {kpi.label}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: kpi.cor, lineHeight: 1.2 }}>
                        {kpi.valor}
                      </Typography>
                    </Box>
                    <ArrowForwardIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Resumo + Atividade Recente lado a lado em telas largas */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {topAcoes.length > 0 && (
              <Card sx={{ flex: '1 1 320px', borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Principais Ações
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {topAcoes.map(([acao, count]) => {
                      const cor = acaoCores[acao] ?? '#1976d2';
                      const pct = logs.length > 0 ? Math.round((count / logs.length) * 100) : 0;
                      return (
                        <Box key={acao}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {acaoLabels[acao] ?? acao}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: cor }}>
                              {count} ({pct}%)
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.max(pct, 4)}
                            sx={{
                              height: 7,
                              borderRadius: 4,
                              bgcolor: alpha(cor, 0.14),
                              '& .MuiLinearProgress-bar': { bgcolor: cor, borderRadius: 4 },
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            )}

            <Card sx={{ flex: '2 1 420px', borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Atividade Recente
                    </Typography>
                    {logs.length > 0 && (
                      <Chip label={logs.length} size="small" color="primary" />
                    )}
                  </Box>

                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate('/auditoria')}
                  >
                    Ver todas
                  </Button>
                </Box>

                {logsRecentes.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                    <HistoryIcon sx={{ fontSize: 44, opacity: 0.15, mb: 1 }} />
                    <Typography variant="body2" sx={{ opacity: 0.5 }}>
                      Nenhum registro de auditoria
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {logsRecentes.map((log) => {
                      const cor = acaoCores[log.acao] ?? '#1976d2';
                      return (
                        <Paper
                          key={log.id}
                          variant="outlined"
                          onClick={() => navigate('/auditoria')}
                          sx={{
                            p: 1.75,
                            borderRadius: 2,
                            borderLeft: `4px solid ${cor}`,
                            cursor: 'pointer',
                            transition: '0.15s',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              transform: 'translateX(2px)',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                                {acaoLabels[log.acao] ?? log.acao}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                                {log.usuarioNome} · {log.entidadeAfetada} ·{' '}
                                {new Date(log.dataHora).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </Typography>
                            </Box>
                            <Chip
                              label={log.entidadeAfetada}
                              size="small"
                              sx={{
                                bgcolor: alpha(cor, 0.12),
                                color: cor,
                                fontWeight: 600,
                                fontSize: 11,
                                flexShrink: 0,
                              }}
                            />
                          </Box>
                        </Paper>
                      );
                    })}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </>
      ) : (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {isMedico ? 'Minhas consultas ativas' : 'Ativas agora'}
                </Typography>

                {ativas.length > 0 && (
                  <Chip label={ativas.length} size="small" color="primary" />
                )}
              </Box>

              <Button
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/consultas')}
              >
                Ver todas
              </Button>
            </Box>

            {ativas.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                <EventNoteIcon sx={{ fontSize: 44, opacity: 0.15, mb: 1 }} />
                <Typography variant="body2" sx={{ opacity: 0.5 }}>
                  Nenhuma consulta ativa no momento
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {ativas.slice(0, LIMITE_LISTA).map((c) => {
                  const cor = statusCores[c.status] ?? '#1976d2';

                  return (
                    <Paper
                      key={c.id}
                      variant="outlined"
                      onClick={() => navigate('/consultas')}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        borderLeft: `4px solid ${cor}`,
                        cursor: 'pointer',
                        transition: '0.15s',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          transform: 'translateX(2px)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{
                          width: 40,
                          height: 40,
                          fontSize: 13,
                          fontWeight: 700,
                          bgcolor: corAvatar(c.nomePaciente),
                          flexShrink: 0,
                        }}>
                          {iniciais(c.nomePaciente)}
                        </Avatar>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {c.nomePaciente}
                          </Typography>

                          <Typography variant="caption" color="text.secondary">
                            {c.nomeMedico} · {new Date(c.dataConsulta).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Typography>
                        </Box>

                        <Chip
                          label={statusLabels[c.status]}
                          size="small"
                          sx={{
                            bgcolor: alpha(cor, 0.12),
                            color: cor,
                            fontWeight: 600,
                            fontSize: 11,
                            flexShrink: 0,
                          }}
                        />
                      </Box>
                    </Paper>
                  );
                })}

                {ativas.length > LIMITE_LISTA && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      textAlign: 'center',
                      pt: 1,
                      cursor: 'pointer',
                      '&:hover': { color: 'primary.main' },
                    }}
                    onClick={() => navigate('/consultas')}
                  >
                    +{ativas.length - LIMITE_LISTA} consultas, ver todas
                  </Typography>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Atalhos */}
      {atalhos.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mt: 3, flexWrap: 'wrap' }}>
          {atalhos.map((a) => (
            <Button
              key={a.label}
              size="small"
              variant="outlined"
              startIcon={a.icon}
              onClick={() => navigate(a.rota)}
              sx={{
                borderRadius: 2,
                color: a.cor,
                borderColor: alpha(a.cor, 0.4),
              }}
            >
              {a.label}
            </Button>
          ))}
        </Box>
      )}
    </Layout>
  );
}