import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Chip, Avatar,
  LinearProgress, Button, Paper
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import EventNoteIcon from '@mui/icons-material/EventNote';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassIcon from '@mui/icons-material/HourglassEmpty';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Consulta } from '../../types';

const statusCores: Record<string, string> = {
  Agendada: '#1976d2', EmTriagem: '#ed6c02', AguardandoAtendimento: '#0288d1',
  EmAtendimento: '#7b1fa2', Finalizada: '#2e7d32', Cancelada: '#d32f2f',
};

const statusLabels: Record<string, string> = {
  Agendada: 'Agendada', EmTriagem: 'Em Triagem',
  AguardandoAtendimento: 'Aguardando', EmAtendimento: 'Em Atendimento',
  Finalizada: 'Finalizada', Cancelada: 'Cancelada',
};

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function corAvatar(nome: string) {
  const cores = ['#1976d2', '#388e3c', '#7b1fa2', '#c62828', '#f57c00', '#0097a7'];
  return cores[nome.charCodeAt(0) % cores.length];
}

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function dataHoje() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

interface StatCard {
  label: string;
  valor: number;
  cor: string;
  icon: React.ReactNode;
  descricao: string;
}

export default function DashboardPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [totalPacientes, setTotalPacientes] = useState(0);
  const [totalMedicos, setTotalMedicos] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregar();
    const interval = setInterval(carregar, 60000);
    return () => clearInterval(interval);
  }, []);

  async function carregar() {
    try {
      const promises: Promise<any>[] = [api.get('/api/consultas')];
      if (usuario?.perfil === 'Recepcionista') {
        promises.push(api.get('/api/Paciente'), api.get('/api/medicos'));
      }
      const [rConsultas, rPacientes, rMedicos] = await Promise.all(promises);
      setConsultas(rConsultas.data);
      if (rPacientes) setTotalPacientes(rPacientes.data.length);
      if (rMedicos) setTotalMedicos(rMedicos.data.length);
    } finally {
      setLoading(false);
    }
  }

  const hoje = new Date().toDateString();
  const consultasHoje = consultas.filter(c =>
    new Date(c.dataConsulta).toDateString() === hoje
  );

  const ativas = consultas.filter(c =>
    ['Agendada', 'EmTriagem', 'AguardandoAtendimento', 'EmAtendimento'].includes(c.status)
  );
  const emTriagem = consultas.filter(c => c.status === 'EmTriagem');
  const aguardando = consultas.filter(c => c.status === 'AguardandoAtendimento');
  const emAtendimento = consultas.filter(c => c.status === 'EmAtendimento');
  const finalizadas = consultas.filter(c => c.status === 'Finalizada');
  const canceladas = consultas.filter(c => c.status === 'Cancelada');
  const finalizadasHoje = finalizadas.filter(c =>
    new Date(c.dataConsulta).toDateString() === hoje
  );

  const progressoHoje = consultasHoje.length > 0
    ? Math.round((finalizadasHoje.length / consultasHoje.length) * 100)
    : 0;

  const dadosSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = DIAS_SEMANA[d.getDay()];
    const dateStr = d.toDateString();
    const total = consultas.filter(c =>
      new Date(c.dataConsulta).toDateString() === dateStr
    ).length;
    const finalizadasDia = consultas.filter(c =>
      new Date(c.dataConsulta).toDateString() === dateStr && c.status === 'Finalizada'
    ).length;
    return { label, total, finalizadas: finalizadasDia };
  });

  const dadosPizza = [
    { name: 'Agendada', value: consultas.filter(c => c.status === 'Agendada').length, cor: '#1976d2' },
    { name: 'Em Triagem', value: emTriagem.length, cor: '#ed6c02' },
    { name: 'Aguardando', value: aguardando.length, cor: '#0288d1' },
    { name: 'Em Atendimento', value: emAtendimento.length, cor: '#7b1fa2' },
    { name: 'Finalizada', value: finalizadas.length, cor: '#2e7d32' },
    { name: 'Cancelada', value: canceladas.length, cor: '#d32f2f' },
  ].filter(d => d.value > 0);

  const statCards: StatCard[] = [
    { label: 'Consultas Ativas', valor: ativas.length, cor: '#1976d2', icon: <EventNoteIcon />, descricao: 'Em andamento agora' },
    { label: 'Em Triagem', valor: emTriagem.length, cor: '#ed6c02', icon: <MedicalServicesIcon />, descricao: 'Aguardando triagem' },
    { label: 'Aguardando', valor: aguardando.length, cor: '#0288d1', icon: <HourglassIcon />, descricao: 'Aguardando atendimento' },
    { label: 'Em Atendimento', valor: emAtendimento.length, cor: '#7b1fa2', icon: <LocalHospitalIcon />, descricao: 'Com médico agora' },
    { label: 'Finalizadas Hoje', valor: finalizadasHoje.length, cor: '#2e7d32', icon: <CheckCircleIcon />, descricao: 'Concluídas no dia' },
    { label: 'Canceladas', valor: canceladas.length, cor: '#d32f2f', icon: <CancelIcon />, descricao: 'Total canceladas' },
  ];

  return (
    <Layout>
      {loading && (
        <LinearProgress sx={{ position: 'fixed', top: 64, left: 0, right: 0, zIndex: 9999 }} />
      )}

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
          {saudacao()}, {usuario?.nome?.split(' ')[0]}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
          {dataHoje()}
        </Typography>
      </Box>

      {/* Cards de estatísticas */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        {statCards.map((s) => (
          <Box key={s.label} sx={{ flex: '1 1 150px', minWidth: 130 }}>
            <Card sx={{
              borderRadius: 3, height: '100%',
              borderTop: `4px solid ${s.cor}`,
              transition: '0.2s', '&:hover': { boxShadow: 6 }
            }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${s.cor}18` }}>
                    <Box sx={{ color: s.cor, display: 'flex' }}>{s.icon}</Box>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: s.cor }}>{s.valor}</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{s.label}</Typography>
                <Typography variant="caption" color="text.secondary">{s.descricao}</Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Gráficos */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <Box sx={{ flex: '2 1 400px' }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <TrendingUpIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Consultas — Últimos 7 Dias</Typography>
              </Box>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dadosSemana} barGap={4}>
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: 8, fontSize: 13 }}
                    formatter={(value, name) => [value, name === 'total' ? 'Total' : 'Finalizadas']}
                  />
                  <Bar dataKey="total" fill="#1976d220" radius={[4, 4, 0, 0]} name="total" />
                  <Bar dataKey="finalizadas" fill="#1976d2" radius={[4, 4, 0, 0]} name="finalizadas" />
                </BarChart>
              </ResponsiveContainer>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: '#1976d220', border: '1px solid #1976d2' }} />
                  <Typography variant="caption" color="text.secondary">Total agendadas</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: '#1976d2' }} />
                  <Typography variant="caption" color="text.secondary">Finalizadas</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 280px' }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Distribuição de Status</Typography>
              {dadosPizza.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <Typography variant="body2" sx={{ opacity: 0.5 }}>Nenhuma consulta</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={dadosPizza}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {dadosPizza.map((entry, index) => (
                        <Cell key={index} fill={entry.cor} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ borderRadius: 8, fontSize: 13 }}
                      formatter={(value, name) => [value, name]}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span style={{ fontSize: 11 }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 300px' }}>
          <Card sx={{ borderRadius: 3, mb: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUpIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Progresso do Dia</Typography>
                </Box>
                <Chip label={`${consultasHoje.length} hoje`} size="small" color="primary" variant="outlined" />
              </Box>
              <Box sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">Consultas finalizadas</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{progressoHoje}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={progressoHoje} sx={{ height: 8, borderRadius: 4 }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                {[
                  { label: 'Agendadas', valor: consultasHoje.filter(c => c.status === 'Agendada').length, cor: '#1976d2' },
                  { label: 'Em andamento', valor: consultasHoje.filter(c => ['EmTriagem', 'AguardandoAtendimento', 'EmAtendimento'].includes(c.status)).length, cor: '#ed6c02' },
                  { label: 'Finalizadas', valor: finalizadasHoje.length, cor: '#2e7d32' },
                ].map(item => (
                  <Box key={item.label} sx={{
                    flex: 1, textAlign: 'center', p: 1.5, borderRadius: 2,
                    bgcolor: `${item.cor}10`, border: `1px solid ${item.cor}30`
                  }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: item.cor }}>{item.valor}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

          {usuario?.perfil === 'Recepcionista' && (
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Base de Dados</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ flex: 1, p: 2, borderRadius: 2, bgcolor: 'primary.main', textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => navigate('/pacientes')}>
                    <PeopleIcon sx={{ color: 'white', fontSize: 28, mb: 0.5 }} />
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 800 }}>{totalPacientes}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Pacientes</Typography>
                  </Box>
                  <Box sx={{ flex: 1, p: 2, borderRadius: 2, bgcolor: '#1565c0', textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => navigate('/medicos')}>
                    <LocalHospitalIcon sx={{ color: 'white', fontSize: 28, mb: 0.5 }} />
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 800 }}>{totalMedicos}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Médicos</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>

        <Box sx={{ flex: '1 1 300px' }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTimeIcon color="warning" />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Ativas Agora</Typography>
                </Box>
                <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/consultas')}>
                  Ver todas
                </Button>
              </Box>

              {ativas.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                  <EventNoteIcon sx={{ fontSize: 48, opacity: 0.2, mb: 1 }} />
                  <Typography variant="body2" sx={{ opacity: 0.5 }}>Nenhuma consulta ativa</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 380, overflowY: 'auto' }}>
                  {ativas.slice(0, 8).map((c) => {
                    const cor = statusCores[c.status] ?? '#1976d2';
                    return (
                      <Paper key={c.id} variant="outlined" sx={{
                        p: 1.5, borderRadius: 2, borderLeft: `4px solid ${cor}`,
                        cursor: 'pointer', transition: '0.15s',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                        onClick={() => navigate('/consultas')}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 36, height: 36, fontSize: 13, fontWeight: 700, bgcolor: corAvatar(c.nomePaciente), flexShrink: 0 }}>
                            {iniciais(c.nomePaciente)}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.nomePaciente}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">{c.nomeMedico}</Typography>
                          </Box>
                          <Chip
                            label={statusLabels[c.status]}
                            size="small"
                            sx={{ bgcolor: cor, color: 'white', fontWeight: 600, fontSize: 10, flexShrink: 0 }}
                          />
                        </Box>
                      </Paper>
                    );
                  })}
                  {ativas.length > 8 && (
                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', pt: 1 }}>
                      +{ativas.length - 8} consultas — ver todas
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Layout>
  );
}