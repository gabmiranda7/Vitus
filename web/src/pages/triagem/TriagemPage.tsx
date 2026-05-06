import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Chip, Typography, Avatar, Grid,
  Button, LinearProgress, Alert
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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

function corEspera(min: number): 'success' | 'warning' | 'error' {
  if (min < 15) return 'success';
  if (min < 30) return 'warning';
  return 'error';
}

function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export default function TriagemPage() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [, setTick] = useState(0);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    carregar();
    const reload = setInterval(carregar, 60000);
    const tick = setInterval(() => setTick(t => t + 1), 30000);
    return () => { clearInterval(reload); clearInterval(tick); };
  }, []);

  async function carregar() {
    const r = await api.get('/api/consultas');
    setConsultas(r.data.filter((c: Consulta) => c.status === 'EmTriagem'));
  }

  async function handleAguardar(id: string) {
    setLoadingId(id);
    try {
      await api.patch(`/api/consultas/${id}/aguardar-atendimento`);
      carregar();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MedicalServicesIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Triagem</Typography>
          <Chip label={consultas.length} size="small" color="warning" />
        </Box>
        <Chip icon={<AccessTimeIcon />} label="Atualiza a cada minuto" size="small" variant="outlined" />
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Para registrar os dados de triagem, use o botão <strong>Iniciar Triagem</strong> na tela de <strong>Consultas</strong>. Aqui você acompanha os pacientes em espera e pode enviá-los para atendimento.
      </Alert>

      {consultas.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, color: 'text.secondary' }}>
          <MedicalServicesIcon sx={{ fontSize: 72, opacity: 0.15, mb: 2 }} />
          <Typography variant="h6" sx={{ opacity: 0.4 }}>Nenhum paciente aguardando triagem</Typography>
          <Typography variant="body2" sx={{ opacity: 0.3, mt: 1 }}>A lista atualiza automaticamente</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {consultas.map((c) => {
            const min = minutosEspera(c.dataConsulta);
            const cor = corEspera(min);
            const progresso = Math.min((min / 30) * 100, 100);
            return (
              <Grid item xs={12} sm={6} md={4} key={c.id}>
                <Card sx={{
                  borderRadius: 2,
                  borderLeft: 5,
                  borderColor: cor === 'success' ? 'success.main' : cor === 'warning' ? 'warning.main' : 'error.main',
                  transition: '0.2s',
                  '&:hover': { boxShadow: 6 }
                }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Avatar sx={{ bgcolor: '#1976d2', width: 44, height: 44, fontWeight: 'bold' }}>
                        {iniciais(c.nomePaciente)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.nomePaciente}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{c.nomeMedico}</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Chip
                        icon={<AccessTimeIcon />}
                        label={`Esperando ${tempoLabel(min)}`}
                        color={cor}
                        size="small"
                        variant="outlined"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(c.dataConsulta).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={progresso}
                      color={cor}
                      sx={{ borderRadius: 1, height: 5, mb: 2 }}
                    />

                    <Button
                      fullWidth
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      disabled={loadingId === c.id}
                      onClick={() => handleAguardar(c.id)}
                    >
                      Enviar para Atendimento
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Layout>
  );
}