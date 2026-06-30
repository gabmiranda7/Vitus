import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Chip, Avatar,
  Button, Divider, LinearProgress, Alert, useTheme, alpha,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditNoteIcon from '@mui/icons-material/EditNote';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Consulta } from '../../types';

const statusCores: Record<string, string> = {
  Agendada: '#1976d2', AguardandoAtendimento: '#0288d1',
  EmAtendimento: '#7b1fa2', Finalizada: '#2e7d32', Cancelada: '#d32f2f',
};

const statusLabels: Record<string, string> = {
  Agendada: 'Agendada', AguardandoAtendimento: 'Aguardando',
  EmAtendimento: 'Em Atendimento', Finalizada: 'Finalizada', Cancelada: 'Cancelada',
};

function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function corAvatar(nome: string) {
  const cores = ['#1976d2', '#388e3c', '#7b1fa2', '#c62828', '#f57c00', '#0097a7'];
  return cores[nome.charCodeAt(0) % cores.length];
}

function horaFormatada(data: string) {
  return new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function AgendaPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregar();
    const interval = setInterval(carregar, 30000);
    return () => clearInterval(interval);
  }, []);

  async function carregar() {
    try {
      const r = await api.get('/api/consultas');
      setConsultas(r.data);
    } catch (error: any) {
      setErro(error.mensagemBack ?? 'Erro ao carregar agenda');
    } finally {
      setLoading(false);
    }
  }

  async function mudarStatus(id: string, acao: string) {
    try {
      await api.patch(`/api/consultas/${id}/${acao}`);
      carregar();
    } catch (error: any) {
      setErro(error.mensagemBack ?? 'Erro ao atualizar consulta');
    }
  }

  const hoje = new Date().toDateString();

  const minhasConsultas = consultas
    .filter(c => {
      const ehHoje = new Date(c.dataConsulta).toDateString() === hoje;
      const ehMeuMedico = usuario?.medicoId
        ? c.medicoId === usuario.medicoId
        : c.nomeMedico.toLowerCase().includes((usuario?.nome ?? '').split(' ')[0].toLowerCase());
      return ehHoje && ehMeuMedico;
    })
    .sort((a, b) => new Date(a.dataConsulta).getTime() - new Date(b.dataConsulta).getTime());

  const finalizadas = minhasConsultas.filter(c => c.status === 'Finalizada').length;
  const progresso = minhasConsultas.length > 0
    ? Math.round((finalizadas / minhasConsultas.length) * 100)
    : 0;

  const proxima = minhasConsultas.find(c =>
    ['AguardandoAtendimento', 'EmAtendimento'].includes(c.status)
  );
  const isEmAtendimento = proxima?.status === 'EmAtendimento';

  const miniStats = [
    { label: 'Total',          valor: minhasConsultas.length,                                                               cor: '#1976d2' },
    { label: 'Aguardando',     valor: minhasConsultas.filter(c => c.status === 'AguardandoAtendimento').length,             cor: '#0288d1' },
    { label: 'Em Atendimento', valor: minhasConsultas.filter(c => c.status === 'EmAtendimento').length,                     cor: '#7b1fa2' },
    { label: 'Finalizadas',    valor: finalizadas,                                                                          cor: '#2e7d32' },
  ];

  return (
    <Layout>
      {loading && (
        <LinearProgress sx={{ position: 'fixed', top: 64, left: 0, right: 0, zIndex: 9999 }} />
      )}

      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <CalendarTodayIcon color="primary" />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Minha Agenda</Typography>
            <Chip label="Hoje" size="small" color="primary" />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Typography>
        </Box>
        <Button size="small" variant="outlined" onClick={carregar} sx={{ borderRadius: 2 }}>
          Atualizar
        </Button>
      </Box>

      {/* Mini chips de stat + barra de progresso — linha única compacta */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        {miniStats.map(s => (
          <Box key={s.label} sx={{
            display: 'flex', alignItems: 'center', gap: 0.75,
            px: 1.25, py: 0.5, borderRadius: 2,
            bgcolor: alpha(s.cor, isDark ? 0.15 : 0.08),
            border: `1px solid ${alpha(s.cor, 0.2)}`,
          }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: s.cor }}>{s.valor}</Typography>
            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
          </Box>
        ))}

        <Box sx={{ flex: 1, minWidth: 160, display: 'flex', alignItems: 'center', gap: 1.5, ml: 1 }}>
          <LinearProgress
            variant="determinate"
            value={progresso}
            sx={{ flex: 1, height: 6, borderRadius: 3 }}
          />
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', whiteSpace: 'nowrap' }}>
            {progresso}%
          </Typography>
        </Box>
      </Box>

      {/* Card próxima / em atendimento — destaque */}
      {proxima && (
        <Card sx={{
          borderRadius: 3, mb: 3,
          background: isEmAtendimento
            ? 'linear-gradient(135deg, #6a1b9a 0%, #7b1fa2 100%)'
            : 'linear-gradient(135deg, #0277bd 0%, #0288d1 100%)',
        }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="caption" sx={{
              color: 'rgba(255,255,255,0.75)',
              textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700,
              display: 'block', mb: 1.5,
            }}>
              {isEmAtendimento ? '🩺 Em Atendimento Agora' : '⏭️ Próxima Consulta'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{
                bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48,
                fontSize: 16, fontWeight: 700, border: '2px solid rgba(255,255,255,0.35)',
              }}>
                {iniciais(proxima.nomePaciente)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.2 }}>
                  {proxima.nomePaciente}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', mt: 0.25 }}>
                  <AccessTimeIcon sx={{ fontSize: 13, mr: 0.5, verticalAlign: 'middle' }} />
                  {horaFormatada(proxima.dataConsulta)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                {proxima.status === 'AguardandoAtendimento' && (
                  <Button size="small" variant="contained"
                    sx={{ bgcolor: 'white', color: '#0288d1', fontWeight: 600, borderRadius: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
                    startIcon={<PersonIcon />}
                    onClick={() => mudarStatus(proxima.id, 'iniciar-atendimento')}>
                    Iniciar
                  </Button>
                )}
                {proxima.status === 'EmAtendimento' && (
                  <>
                    <Button size="small" variant="outlined"
                      sx={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white', borderRadius: 2, '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.08)' } }}
                      startIcon={<FolderSharedIcon />}
                      onClick={() => navigate(`/prontuario/${proxima.id}`)}>
                      Prontuário
                    </Button>
                    <Button size="small" variant="contained"
                      sx={{ bgcolor: 'white', color: '#2e7d32', fontWeight: 600, borderRadius: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
                      startIcon={<CheckCircleIcon />}
                      onClick={() => mudarStatus(proxima.id, 'finalizar')}>
                      Finalizar
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5 }}>
            Agenda Completa
          </Typography>

          {minhasConsultas.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
              <CalendarTodayIcon sx={{ fontSize: 56, opacity: 0.12, mb: 2 }} />
              <Typography variant="h6" sx={{ opacity: 0.4 }}>Nenhuma consulta hoje</Typography>
              <Typography variant="body2" sx={{ opacity: 0.3, mt: 0.5 }}>Sua agenda está livre</Typography>
            </Box>
          ) : (
            <Box>
              {minhasConsultas.map((c, i) => {
                const cor = statusCores[c.status] ?? '#1976d2';
                const finalizada = c.status === 'Finalizada';
                const cancelada = c.status === 'Cancelada';

                return (
                  <Box key={c.id}>
                    <Box sx={{
                      display: 'flex', alignItems: 'center', gap: 2.5,
                      py: 2.5, opacity: cancelada ? 0.4 : 1,
                    }}>
                      {/* Horário */}
                      <Box sx={{ width: 48, textAlign: 'right', flexShrink: 0 }}>
                        <Typography variant="body2" sx={{
                          fontWeight: 700, fontSize: 13,
                          color: finalizada || cancelada ? 'text.disabled' : cor,
                        }}>
                          {horaFormatada(c.dataConsulta)}
                        </Typography>
                      </Box>

                      {/* Dot */}
                      <Box sx={{ width: 16, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                        <Box sx={{
                          width: finalizada ? 10 : 14, height: finalizada ? 10 : 14,
                          borderRadius: '50%',
                          bgcolor: finalizada ? '#2e7d32' : cancelada ? '#d32f2f' : cor,
                          boxShadow: !finalizada && !cancelada ? `0 0 0 3px ${alpha(cor, 0.2)}` : 'none',
                        }} />
                      </Box>

                      {/* Avatar */}
                      <Avatar sx={{ bgcolor: corAvatar(c.nomePaciente), width: 44, height: 44, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                        {iniciais(c.nomePaciente)}
                      </Avatar>

                      {/* Info */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{
                          fontWeight: 600,
                          textDecoration: cancelada ? 'line-through' : 'none',
                          color: finalizada ? 'text.secondary' : 'text.primary',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {c.nomePaciente}
                        </Typography>
                        <Chip
                          label={statusLabels[c.status]}
                          size="small"
                          sx={{
                            mt: 0.5, height: 20, fontSize: 11,
                            bgcolor: alpha(cor, isDark ? 0.2 : 0.1),
                            color: cor, fontWeight: 600,
                          }}
                        />
                      </Box>

                      {/* Ações */}
                      <Box sx={{ display: 'flex', gap: 0.75, flexShrink: 0 }}>
                        {c.status === 'AguardandoAtendimento' && (
                          <Button size="small" variant="contained" color="primary" sx={{ borderRadius: 2 }}
                            startIcon={<PersonIcon />}
                            onClick={() => mudarStatus(c.id, 'iniciar-atendimento')}>
                            Iniciar
                          </Button>
                        )}
                        {c.status === 'EmAtendimento' && (
                          <>
                            <Button size="small" variant="outlined" color="secondary" sx={{ borderRadius: 2 }}
                              startIcon={<FolderSharedIcon />}
                              onClick={() => navigate(`/prontuario/${c.id}`)}>
                              Prontuário
                            </Button>
                            <Button size="small" variant="outlined" color="info" sx={{ borderRadius: 2 }}
                              startIcon={<EditNoteIcon />}
                              onClick={() => navigate('/consultas')}>
                              Anotar
                            </Button>
                            <Button size="small" variant="contained" color="success" sx={{ borderRadius: 2 }}
                              startIcon={<CheckCircleIcon />}
                              onClick={() => mudarStatus(c.id, 'finalizar')}>
                              Finalizar
                            </Button>
                          </>
                        )}
                        {c.status === 'Finalizada' && (
                          <Button size="small" variant="outlined" color="secondary" sx={{ borderRadius: 2 }}
                            startIcon={<FolderSharedIcon />}
                            onClick={() => navigate(`/prontuario/${c.id}`)}>
                            Prontuário
                          </Button>
                        )}
                      </Box>
                    </Box>
                    {i < minhasConsultas.length - 1 && <Divider sx={{ ml: '80px' }} />}
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