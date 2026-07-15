import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Chip, Avatar,
  LinearProgress, Button, Paper, useTheme, alpha,
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer,
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
import MedicationIcon from '@mui/icons-material/Medication';
import ScienceIcon from '@mui/icons-material/Science';
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
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function DashboardPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [totalPacientes, setTotalPacientes] = useState(0);
  const [totalMedicos, setTotalMedicos] = useState(0);
  const [loading, setLoading] = useState(true);

  const isMedico = usuario?.perfil === 'Medico';
  const isEnfermeiro = usuario?.perfil === 'Enfermeiro';
  const isRecepcionista = usuario?.perfil === 'Recepcionista';

  useEffect(() => {
    carregar();
    const interval = setInterval(carregar, 60000);
    return () => clearInterval(interval);
  }, []);

  async function carregar() {
    try {
      const promises: Promise<any>[] = [api.get('/api/consultas')];
      if (isRecepcionista) {
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
  const consultasHoje = consultas.filter(c => new Date(c.dataConsulta).toDateString() === hoje);
  const ativas = consultas.filter(c =>
    ['Agendada', 'EmTriagem', 'AguardandoAtendimento', 'EmAtendimento'].includes(c.status)
  );
  const emTriagem = consultas.filter(c => c.status === 'EmTriagem');
  const aguardando = consultas.filter(c => c.status === 'AguardandoAtendimento');
  const emAtendimento = consultas.filter(c => c.status === 'EmAtendimento');
  const finalizadas = consultas.filter(c => c.status === 'Finalizada');
  const canceladas = consultas.filter(c => c.status === 'Cancelada');
  const finalizadasHoje = finalizadas.filter(c => new Date(c.dataConsulta).toDateString() === hoje);
  const progressoHoje = consultasHoje.length > 0
    ? Math.round((finalizadasHoje.length / consultasHoje.length) * 100)
    : 0;

  // Consultas relevantes por perfil
  const consultasDoMedico = isMedico
    ? ativas.filter(c => c.nomeMedico === usuario?.nome)
    : ativas;

  const dadosSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = DIAS_SEMANA[d.getDay()];
    const dateStr = d.toDateString();
    const total = consultas.filter(c => new Date(c.dataConsulta).toDateString() === dateStr).length;
    const fin = consultas.filter(c =>
      new Date(c.dataConsulta).toDateString() === dateStr && c.status === 'Finalizada'
    ).length;
    return { label, total, finalizadas: fin };
  });

  const miniStats = [
    { label: 'Ativas',      valor: ativas.length,         cor: '#1976d2', icon: <EventNoteIcon sx={{ fontSize: 14 }} /> },
    { label: 'Em Triagem',  valor: emTriagem.length,       cor: '#ed6c02', icon: <MedicalServicesIcon sx={{ fontSize: 14 }} /> },
    { label: 'Aguardando',  valor: aguardando.length,      cor: '#0288d1', icon: <HourglassIcon sx={{ fontSize: 14 }} /> },
    { label: 'Atendimento', valor: emAtendimento.length,   cor: '#7b1fa2', icon: <LocalHospitalIcon sx={{ fontSize: 14 }} /> },
    { label: 'Finalizadas', valor: finalizadasHoje.length, cor: '#2e7d32', icon: <CheckCircleIcon sx={{ fontSize: 14 }} /> },
    { label: 'Canceladas',  valor: canceladas.length,      cor: '#d32f2f', icon: <CancelIcon sx={{ fontSize: 14 }} /> },
  ];

  // Atalhos por perfil
  const atalhos = [
    ...(isRecepcionista ? [
      { label: 'Pacientes', sublabel: `${totalPacientes} cadastrados`, cor: '#1976d2', icon: <PeopleIcon />, rota: '/pacientes' },
      { label: 'Médicos', sublabel: `${totalMedicos} cadastrados`, cor: '#1565c0', icon: <LocalHospitalIcon />, rota: '/medicos' },
      { label: 'Consultas', sublabel: `${ativas.length} ativas`, cor: '#7b1fa2', icon: <EventNoteIcon />, rota: '/consultas' },
    ] : []),
    ...(isMedico ? [
      { label: 'Consultas', sublabel: `${consultasDoMedico.length} ativas`, cor: '#1976d2', icon: <EventNoteIcon />, rota: '/consultas' },
      { label: 'Prontuários', sublabel: 'Histórico de pacientes', cor: '#7b1fa2', icon: <PeopleIcon />, rota: '/prontuarios' },
      { label: 'Receitas', sublabel: 'Emitir receitas', cor: '#2e7d32', icon: <MedicationIcon />, rota: '/receitas' },
    ] : []),
    ...(isEnfermeiro ? [
      { label: 'Consultas', sublabel: `${emTriagem.length} em triagem`, cor: '#ed6c02', icon: <MedicalServicesIcon />, rota: '/consultas' },
      { label: 'Triagem', sublabel: 'Registrar sinais vitais', cor: '#0288d1', icon: <ScienceIcon />, rota: '/triagem' },
      { label: 'Prontuários', sublabel: 'Histórico de pacientes', cor: '#7b1fa2', icon: <PeopleIcon />, rota: '/prontuarios' },
    ] : []),
  ];

  return (
    <Layout>
      {loading && (
        <LinearProgress sx={{ position: 'fixed', top: 64, left: 0, right: 0, zIndex: 9999 }} />
      )}

      {/* Cabeçalho */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
          {saudacao()}, {usuario?.nome?.split(' ')[0]}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
          {dataHoje()}
        </Typography>
      </Box>

      {/* Mini chips de stat — fix de alinhamento vertical */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        {miniStats.map((s) => (
          <Box key={s.label} sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1.5,
            py: 0.75,
            borderRadius: 2,
            bgcolor: alpha(s.cor, isDark ? 0.15 : 0.08),
            border: `1px solid ${alpha(s.cor, 0.2)}`,
            lineHeight: 1,
          }}>
            <Box sx={{ color: s.cor, display: 'flex', alignItems: 'center', lineHeight: 1 }}>{s.icon}</Box>
            <Typography
              component="span"
              sx={{ fontWeight: 700, color: s.cor, fontSize: 14, lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}
            >
              {s.valor}
            </Typography>
            <Typography
              component="span"
              sx={{ color: 'text.secondary', fontSize: 12, lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}
            >
              {s.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Atalhos por perfil */}
      {atalhos.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          {atalhos.map((a) => (
            <Paper
              key={a.label}
              onClick={() => navigate(a.rota)}
              sx={{
                flex: '1 1 140px',
                p: 2, borderRadius: 3,
                cursor: 'pointer',
                border: `1px solid ${alpha(a.cor, 0.2)}`,
                bgcolor: alpha(a.cor, isDark ? 0.1 : 0.05),
                transition: '0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 3, bgcolor: alpha(a.cor, isDark ? 0.18 : 0.1) },
              }}
            >
              <Box sx={{ color: a.cor, mb: 1 }}>{a.icon}</Box>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{a.label}</Typography>
              <Typography variant="caption" color="text.secondary">{a.sublabel}</Typography>
            </Paper>
          ))}
        </Box>
      )}

      {/* Ativas Agora */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTimeIcon color="warning" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {isMedico ? 'Minhas Consultas Ativas' : 'Ativas Agora'}
              </Typography>
              {consultasDoMedico.length > 0 && (
                <Chip label={consultasDoMedico.length} size="small" color="warning" />
              )}
            </Box>
            <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/consultas')}>
              Ver todas
            </Button>
          </Box>

          {consultasDoMedico.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
              <EventNoteIcon sx={{ fontSize: 44, opacity: 0.15, mb: 1 }} />
              <Typography variant="body2" sx={{ opacity: 0.5 }}>Nenhuma consulta ativa no momento</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {consultasDoMedico.slice(0, 8).map((c) => {
                const cor = statusCores[c.status] ?? '#1976d2';
                return (
                  <Paper
                    key={c.id}
                    variant="outlined"
                    onClick={() => navigate('/consultas')}
                    sx={{
                      p: 2, borderRadius: 2,
                      borderLeft: `4px solid ${cor}`,
                      cursor: 'pointer', transition: '0.15s',
                      '&:hover': { bgcolor: 'action.hover', transform: 'translateX(2px)' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{
                        width: 40, height: 40, fontSize: 13, fontWeight: 700,
                        bgcolor: corAvatar(c.nomePaciente), flexShrink: 0,
                      }}>
                        {iniciais(c.nomePaciente)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{
                          fontWeight: 600,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {c.nomePaciente}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {c.nomeMedico} · {new Date(c.dataConsulta).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                      <Chip
                        label={statusLabels[c.status]}
                        size="small"
                        sx={{ bgcolor: alpha(cor, 0.12), color: cor, fontWeight: 600, fontSize: 11, flexShrink: 0 }}
                      />
                    </Box>
                  </Paper>
                );
              })}
              {consultasDoMedico.length > 8 && (
                <Typography
                  variant="caption" color="text.secondary"
                  sx={{ textAlign: 'center', pt: 1, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                  onClick={() => navigate('/consultas')}
                >
                  +{consultasDoMedico.length - 8} consultas — ver todas
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Gráfico + Progresso do dia */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <Box sx={{ flex: '2 1 380px' }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <TrendingUpIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Últimos 7 Dias</Typography>
              </Box>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dadosSemana} barGap={4}>
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: 8, fontSize: 13 }}
                    formatter={(value, name) => [value, name === 'total' ? 'Total' : 'Finalizadas']}
                  />
                  <Bar dataKey="total" fill={alpha('#1976d2', 0.15)} radius={[4, 4, 0, 0]} name="total" />
                  <Bar dataKey="finalizadas" fill="#1976d2" radius={[4, 4, 0, 0]} name="finalizadas" />
                </BarChart>
              </ResponsiveContainer>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 1 }}>
                {[
                  { label: 'Total agendadas', color: alpha('#1976d2', 0.15), border: true },
                  { label: 'Finalizadas', color: '#1976d2', border: false },
                ].map(item => (
                  <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: item.color, border: item.border ? `1px solid #1976d2` : 'none' }} />
                    <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 200px' }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, height: '100%', boxSizing: 'border-box' }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <TrendingUpIcon color="primary" fontSize="small" />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Progresso</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">Hoje</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{progressoHoje}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={progressoHoje} sx={{ height: 8, borderRadius: 5 }} />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {[
                  { label: 'Agendadas', valor: consultasHoje.filter(c => c.status === 'Agendada').length, cor: '#1976d2' },
                  { label: 'Em andamento', valor: consultasHoje.filter(c => ['EmTriagem', 'AguardandoAtendimento', 'EmAtendimento'].includes(c.status)).length, cor: '#ed6c02' },
                  { label: 'Finalizadas', valor: finalizadasHoje.length, cor: '#2e7d32' },
                ].map(item => (
                  <Box key={item.label} sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    px: 1.5, py: 0.875, borderRadius: 2,
                    bgcolor: alpha(item.cor, isDark ? 0.15 : 0.07),
                  }}>
                    <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: item.cor }}>{item.valor}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Layout>
  );
}