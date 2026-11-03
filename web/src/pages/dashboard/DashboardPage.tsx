import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Chip, Avatar,
  LinearProgress, Button, Paper, useTheme, alpha,
} from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNote';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import PeopleIcon from '@mui/icons-material/People';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
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

const statusAtivos = ['EmAtendimento', 'AguardandoAtendimento', 'EmTriagem', 'Agendada'];

const LIMITE_LISTA = 5;

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
      const r = await api.get('/api/consultas');
      setConsultas(r.data);
    } finally {
      setLoading(false);
    }
  }

  const ativas = consultas
    .filter(c => statusAtivos.includes(c.status))
    .filter(c => !isMedico || c.medicoId === usuario?.medicoId)
    .sort((a, b) => statusAtivos.indexOf(a.status) - statusAtivos.indexOf(b.status));

  const atalhos = [
    ...(isRecepcionista ? [
      { label: 'Pacientes', sublabel: 'Cadastro e edição', cor: '#1976d2', icon: <PeopleIcon />, rota: '/pacientes' },
      { label: 'Médicos', sublabel: 'Equipe médica', cor: '#1565c0', icon: <LocalHospitalIcon />, rota: '/medicos' },
      { label: 'Consultas', sublabel: 'Agendar e acompanhar', cor: '#7b1fa2', icon: <EventNoteIcon />, rota: '/consultas' },
    ] : []),
    ...(isMedico ? [
      { label: 'Consultas', sublabel: 'Atender e anotar', cor: '#1976d2', icon: <EventNoteIcon />, rota: '/consultas' },
      { label: 'Prontuários', sublabel: 'Histórico de pacientes', cor: '#7b1fa2', icon: <PeopleIcon />, rota: '/prontuarios' },
      { label: 'Receitas', sublabel: 'Emitir receitas', cor: '#2e7d32', icon: <MedicationIcon />, rota: '/receitas' },
    ] : []),
    ...(isEnfermeiro ? [
      { label: 'Triagem', sublabel: 'Registrar sinais vitais', cor: '#ed6c02', icon: <MedicalServicesIcon />, rota: '/triagem' },
      { label: 'Consultas', sublabel: 'Acompanhar a fila', cor: '#1976d2', icon: <EventNoteIcon />, rota: '/consultas' },
      { label: 'Prontuários', sublabel: 'Histórico de pacientes', cor: '#7b1fa2', icon: <ScienceIcon />, rota: '/prontuarios' },
    ] : []),
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

      {atalhos.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          {atalhos.map((a) => (
            <Paper
              key={a.label}
              onClick={() => navigate(a.rota)}
              sx={{
                flex: '1 1 180px',
                p: 2.5, borderRadius: 3,
                cursor: 'pointer',
                border: `1px solid ${alpha(a.cor, 0.2)}`,
                bgcolor: alpha(a.cor, isDark ? 0.1 : 0.05),
                transition: '0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 3, bgcolor: alpha(a.cor, isDark ? 0.18 : 0.1) },
              }}
            >
              <Box sx={{ color: a.cor, mb: 1 }}>{a.icon}</Box>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>{a.label}</Typography>
              <Typography variant="caption" color="text.secondary">{a.sublabel}</Typography>
            </Paper>
          ))}
        </Box>
      )}

      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {isMedico ? 'Minhas consultas ativas' : 'Ativas agora'}
              </Typography>
              {ativas.length > 0 && <Chip label={ativas.length} size="small" color="primary" />}
            </Box>
            <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/consultas')}>
              Ver todas
            </Button>
          </Box>

          {ativas.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
              <EventNoteIcon sx={{ fontSize: 44, opacity: 0.15, mb: 1 }} />
              <Typography variant="body2" sx={{ opacity: 0.5 }}>Nenhuma consulta ativa no momento</Typography>
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
              {ativas.length > LIMITE_LISTA && (
                <Typography
                  variant="caption" color="text.secondary"
                  sx={{ textAlign: 'center', pt: 1, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                  onClick={() => navigate('/consultas')}
                >
                  +{ativas.length - LIMITE_LISTA} consultas, ver todas
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}