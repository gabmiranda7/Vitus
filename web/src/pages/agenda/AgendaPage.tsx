import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Chip, Avatar,
  Button, Paper, Divider, LinearProgress, Alert
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

const statusIcons: Record<string, string> = {
  Agendada: '📅', AguardandoAtendimento: '⏳',
  EmAtendimento: '👨‍⚕️', Finalizada: '✅', Cancelada: '❌',
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
    } catch (error: any) { setErro(error.mensagemBack ?? 'Erro ao carregar agenda'); }
    finally { setLoading(false); }
  }

  async function mudarStatus(id: string, acao: string) {
    try {
      await api.patch(`/api/consultas/${id}/${acao}`);
      carregar();
    } catch (error: any) { setErro(error.mensagemBack ?? 'Erro ao atualizar consulta'); }
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

  return (
    <Layout>
      {loading && (
        <LinearProgress sx={{ position: 'fixed', top: 64, left: 0, right: 0, zIndex: 9999 }} />
      )}

      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <CalendarTodayIcon color="primary" />
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Minha Agenda</Typography>
            <Chip label="Hoje" size="small" color="primary" />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Typography>
        </Box>
        <Button size="small" variant="outlined" onClick={carregar}>
          Atualizar
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        {[
          { label: 'Total', valor: minhasConsultas.length, cor: '#1976d2' },
          { label: 'Aguardando', valor: minhasConsultas.filter(c => c.status === 'AguardandoAtendimento').length, cor: '#0288d1' },
          { label: 'Em Atendimento', valor: minhasConsultas.filter(c => c.status === 'EmAtendimento').length, cor: '#7b1fa2' },
          { label: 'Finalizadas', valor: finalizadas, cor: '#2e7d32' },
        ].map(item => (
          <Box key={item.label} sx={{ flex: '1 1 120px' }}>
            <Card sx={{ borderRadius: 2, borderTop: `3px solid ${item.cor}` }}>
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: item.cor }}>{item.valor}</Typography>
                <Typography variant="caption" color="text.secondary">{item.label}</Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      <Card sx={{ borderRadius: 2, mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Progresso do dia</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{progresso}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={progresso} sx={{ height: 8, borderRadius: 4 }} />
        </CardContent>
      </Card>

      {proxima && (
        <Card sx={{
          borderRadius: 2, mb: 3,
          background: proxima.status === 'EmAtendimento'
            ? 'linear-gradient(135deg, #6a1b9a 0%, #7b1fa2 100%)'
            : 'linear-gradient(135deg, #0277bd 0%, #0288d1 100%)'
        }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 }}>
              {proxima.status === 'EmAtendimento' ? '🩺 Em Atendimento Agora' : '⏭️ Próxima Consulta'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1.5 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 52, height: 52, fontSize: 18, fontWeight: 700, border: '2px solid rgba(255,255,255,0.4)' }}>
                {iniciais(proxima.nomePaciente)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                  {proxima.nomePaciente}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  <AccessTimeIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                  {horaFormatada(proxima.dataConsulta)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {proxima.status === 'AguardandoAtendimento' && (
                  <Button size="small" variant="contained"
                    sx={{ bgcolor: 'white', color: '#0288d1', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
                    startIcon={<PersonIcon />}
                    onClick={() => mudarStatus(proxima.id, 'iniciar-atendimento')}>
                    Iniciar
                  </Button>
                )}
                {proxima.status === 'EmAtendimento' && (
                  <>
                    <Button size="small" variant="outlined"
                      sx={{ borderColor: 'rgba(255,255,255,0.6)', color: 'white', '&:hover': { borderColor: 'white' } }}
                      startIcon={<FolderSharedIcon />}
                      onClick={() => navigate(`/prontuario/${proxima.id}`)}>
                      Prontuário
                    </Button>
                    <Button size="small" variant="contained"
                      sx={{ bgcolor: 'white', color: '#2e7d32', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
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

      <Card sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Agenda Completa
          </Typography>

          {minhasConsultas.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
              <CalendarTodayIcon sx={{ fontSize: 56, opacity: 0.15, mb: 2 }} />
              <Typography variant="h6" sx={{ opacity: 0.4 }}>Nenhuma consulta hoje</Typography>
              <Typography variant="body2" sx={{ opacity: 0.3, mt: 0.5 }}>Sua agenda está livre</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {minhasConsultas.map((c, i) => {
                const cor = statusCores[c.status] ?? '#1976d2';
                const finalizada = c.status === 'Finalizada';
                const cancelada = c.status === 'Cancelada';
                return (
                  <Box key={c.id}>
                    <Box sx={{
                      display: 'flex', alignItems: 'center', gap: 2, py: 2,
                      opacity: cancelada ? 0.45 : 1,
                    }}>
                      <Box sx={{ width: 52, textAlign: 'center', flexShrink: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: finalizada ? 'text.disabled' : cor }}>
                          {horaFormatada(c.dataConsulta)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <Box sx={{
                          width: 12, height: 12, borderRadius: '50%',
                          bgcolor: finalizada ? '#2e7d32' : cancelada ? '#d32f2f' : cor,
                          border: `2px solid`,
                          borderColor: finalizada ? '#2e7d32' : cancelada ? '#d32f2f' : cor,
                        }} />
                      </Box>

                      <Avatar sx={{ bgcolor: corAvatar(c.nomePaciente), width: 40, height: 40, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                        {iniciais(c.nomePaciente)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{
                          fontWeight: 600,
                          textDecoration: cancelada ? 'line-through' : 'none',
                          color: finalizada ? 'text.secondary' : 'text.primary',
                        }}>
                          {c.nomePaciente}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {statusIcons[c.status]} {statusLabels[c.status]}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                        {c.status === 'AguardandoAtendimento' && (
                          <Button size="small" variant="contained" color="primary"
                            startIcon={<PersonIcon />}
                            onClick={() => mudarStatus(c.id, 'iniciar-atendimento')}>
                            Iniciar
                          </Button>
                        )}
                        {c.status === 'EmAtendimento' && (
                          <>
                            <Button size="small" variant="outlined" color="secondary"
                              startIcon={<FolderSharedIcon />}
                              onClick={() => navigate(`/prontuario/${c.id}`)}>
                              Prontuário
                            </Button>
                            <Button size="small" variant="outlined" color="info"
                              startIcon={<EditNoteIcon />}
                              onClick={() => navigate('/consultas')}>
                              Anotar
                            </Button>
                            <Button size="small" variant="contained" color="success"
                              startIcon={<CheckCircleIcon />}
                              onClick={() => mudarStatus(c.id, 'finalizar')}>
                              Finalizar
                            </Button>
                          </>
                        )}
                        {c.status === 'Finalizada' && (
                          <Button size="small" variant="outlined" color="secondary"
                            startIcon={<FolderSharedIcon />}
                            onClick={() => navigate(`/prontuario/${c.id}`)}>
                            Prontuário
                          </Button>
                        )}
                      </Box>
                    </Box>
                    {i < minhasConsultas.length - 1 && <Divider />}
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