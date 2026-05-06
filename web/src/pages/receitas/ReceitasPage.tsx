import { useEffect, useState } from 'react';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, FormControl, IconButton, InputLabel, MenuItem, Paper, Select,
  TextField, Typography, Alert, Tabs, Tab, Grid, Card, CardContent, Avatar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MedicationIcon from '@mui/icons-material/Medication';
import PersonIcon from '@mui/icons-material/Person';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { Consulta, Medicamento } from '../../types';

function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function corAvatar(nome: string) {
  const cores = ['#1976d2', '#388e3c', '#7b1fa2', '#c62828', '#f57c00', '#0097a7'];
  return cores[nome.charCodeAt(0) % cores.length];
}

export default function ReceitasPage() {
  const [consultasAtivas, setConsultasAtivas] = useState<Consulta[]>([]);
  const [historico, setHistorico] = useState<Consulta[]>([]);
  const [aba, setAba] = useState(0);
  const [modalAberto, setModalAberto] = useState(false);
  const [consultaId, setConsultaId] = useState('');
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([{ nome: '', dosagem: '', posologia: '' }]);
  const [erro, setErro] = useState('');

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const r = await api.get('/api/consultas');
    setConsultasAtivas(r.data.filter((c: Consulta) => c.status === 'EmAtendimento'));
    setHistorico(r.data.filter((c: Consulta) => c.status === 'Finalizada'));
  }

  function addMed() { setMedicamentos([...medicamentos, { nome: '', dosagem: '', posologia: '' }]); }
  function removeMed(i: number) { setMedicamentos(medicamentos.filter((_, idx) => idx !== i)); }
  function changeMed(i: number, campo: keyof Medicamento, valor: string) {
    const novos = [...medicamentos]; novos[i][campo] = valor; setMedicamentos(novos);
  }

  async function handleSalvar() {
    setErro('');
    try {
      await api.post('/api/receitas', { consultaId, medicamentos });
      fechar(); carregar();
    } catch { setErro('Erro ao criar receita'); }
  }

  function fechar() {
    setModalAberto(false);
    setConsultaId('');
    setMedicamentos([{ nome: '', dosagem: '', posologia: '' }]);
    setErro('');
  }

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MedicationIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Receitas</Typography>
          <Chip label={consultasAtivas.length} size="small" color="primary" />
        </Box>
        {aba === 0 && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalAberto(true)} sx={{ borderRadius: 2 }}>
            Nova Receita
          </Button>
        )}
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={aba} onChange={(_, v) => setAba(v)}>
          <Tab label={`Em Atendimento (${consultasAtivas.length})`} />
          <Tab label={`Histórico (${historico.length})`} />
        </Tabs>
      </Box>

      {/* Aba Em Atendimento — cards */}
      {aba === 0 && (
        consultasAtivas.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <MedicationIcon sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
            <Typography variant="h6" sx={{ opacity: 0.5 }}>Nenhuma consulta em atendimento</Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {consultasAtivas.map((c) => (
              <Grid item xs={12} sm={6} md={4} key={c.id}>
                <Card sx={{ borderRadius: 2, borderLeft: 4, borderColor: 'warning.main', '&:hover': { boxShadow: 4 }, transition: '0.2s' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Avatar sx={{ bgcolor: corAvatar(c.nomePaciente), width: 44, height: 44, fontWeight: 'bold' }}>
                        {iniciais(c.nomePaciente)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.nomePaciente}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{c.nomeMedico}</Typography>
                      </Box>
                    </Box>
                    <Chip label="Em Atendimento" color="warning" size="small" sx={{ fontWeight: 500 }} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )
      )}

      {/* Aba Histórico — cards com medicamentos */}
      {aba === 1 && (
        historico.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <MedicationIcon sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
            <Typography variant="h6" sx={{ opacity: 0.5 }}>Nenhuma consulta finalizada</Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {historico.map((c) => (
              <Grid item xs={12} md={6} key={c.id}>
                <Card sx={{ borderRadius: 2, '&:hover': { boxShadow: 4 }, transition: '0.2s' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Avatar sx={{ bgcolor: corAvatar(c.nomePaciente), width: 44, height: 44, fontWeight: 'bold' }}>
                        {iniciais(c.nomePaciente)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{c.nomePaciente}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {c.nomeMedico} · {new Date(c.dataConsulta).toLocaleDateString('pt-BR')}
                        </Typography>
                      </Box>
                      <Chip label="Finalizada" color="success" size="small" />
                    </Box>

                    {c.anotacoes && (
                      <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1, borderLeft: 3, borderColor: 'info.main' }}>
                        <Typography variant="caption" color="info.main" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                          Anotações
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{c.anotacoes}</Typography>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                      <MedicationIcon fontSize="small" color="success" />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'success.main' }}>
                        Medicamentos prescritos
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Ver prontuário para detalhes das receitas
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )
      )}

      {/* Modal Nova Receita */}
      <Dialog open={modalAberto} onClose={fechar} fullWidth maxWidth="md">
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>Nova Receita</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
          <FormControl fullWidth sx={{ mt: 1, mb: 3 }}>
            <InputLabel>Consulta</InputLabel>
            <Select value={consultaId} label="Consulta" onChange={(e) => setConsultaId(e.target.value)}>
              {consultasAtivas.map((c) => <MenuItem key={c.id} value={c.id}>{c.nomePaciente} — {c.nomeMedico}</MenuItem>)}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Medicamentos</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={addMed}>Adicionar</Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          {medicamentos.map((med, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
              <TextField label="Nome" value={med.nome} onChange={(e) => changeMed(i, 'nome', e.target.value)} sx={{ flex: 2 }} />
              <TextField label="Dosagem" value={med.dosagem} onChange={(e) => changeMed(i, 'dosagem', e.target.value)} sx={{ flex: 1 }} />
              <TextField label="Posologia" value={med.posologia} onChange={(e) => changeMed(i, 'posologia', e.target.value)} sx={{ flex: 2 }} />
              {medicamentos.length > 1 && (
                <IconButton color="error" onClick={() => removeMed(i)}><DeleteIcon /></IconButton>
              )}
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={fechar} variant="outlined">Cancelar</Button>
          <Button onClick={handleSalvar} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}