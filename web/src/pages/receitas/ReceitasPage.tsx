import { useEffect, useState, useMemo } from 'react';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent,
  Divider, FormControl, IconButton, InputLabel, MenuItem, Select,
  TextField, Typography, Alert, Tabs, Tab, Card, CardContent,
  Avatar, InputAdornment, Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MedicationIcon from '@mui/icons-material/Medication';
import SearchIcon from '@mui/icons-material/Search';
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
  const [busca, setBusca] = useState('');
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
    setModalAberto(false); setConsultaId('');
    setMedicamentos([{ nome: '', dosagem: '', posologia: '' }]); setErro('');
  }

  const ativasFiltradas = useMemo(() => {
    if (!busca.trim()) return consultasAtivas;
    const q = busca.toLowerCase();
    return consultasAtivas.filter(c =>
      c.nomePaciente.toLowerCase().includes(q) || c.nomeMedico.toLowerCase().includes(q)
    );
  }, [consultasAtivas, busca]);

  const historicoFiltrado = useMemo(() => {
    if (!busca.trim()) return historico;
    const q = busca.toLowerCase();
    return historico.filter(c =>
      c.nomePaciente.toLowerCase().includes(q) ||
      c.nomeMedico.toLowerCase().includes(q) ||
      new Date(c.dataConsulta).toLocaleDateString('pt-BR').includes(q)
    );
  }, [historico, busca]);

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

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={aba} onChange={(_, v) => { setAba(v); setBusca(''); }}>
          <Tab label={`Em Atendimento (${consultasAtivas.length})`} />
          <Tab label={`Histórico (${historico.length})`} />
        </Tabs>
      </Box>

      <TextField fullWidth
        placeholder={aba === 0 ? 'Buscar por paciente ou médico...' : 'Buscar por paciente, médico ou data...'}
        value={busca} onChange={(e) => setBusca(e.target.value)} sx={{ mb: 3 }}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> } }}
      />

      {aba === 0 && (
        ativasFiltradas.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <MedicationIcon sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
            <Typography variant="h6" sx={{ opacity: 0.5 }}>
              {busca ? 'Nenhum resultado' : 'Nenhuma consulta em atendimento'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {ativasFiltradas.map((c) => (
              <Box key={c.id} sx={{ flex: '1 1 280px', maxWidth: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.33% - 11px)' } }}>
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip label="Em Atendimento" color="warning" size="small" sx={{ fontWeight: 500 }} />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(c.dataConsulta).toLocaleDateString('pt-BR')}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        )
      )}

      {aba === 1 && (
        historicoFiltrado.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <MedicationIcon sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
            <Typography variant="h6" sx={{ opacity: 0.5 }}>
              {busca ? 'Nenhum resultado' : 'Nenhuma consulta finalizada'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {historicoFiltrado.map((c) => (
              <Box key={c.id} sx={{ flex: '1 1 400px', maxWidth: { xs: '100%', md: 'calc(50% - 8px)' } }}>
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
                      <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1, borderLeft: 3, borderColor: 'info.main' }}>
                        <Typography variant="caption" color="info.main" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                          Anotações
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{c.anotacoes}</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        )
      )}

      <Dialog open={modalAberto} onClose={fechar} fullWidth maxWidth="md">
        <Box sx={{ background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)', p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 52, height: 52, border: '2px solid rgba(255,255,255,0.4)' }}>
              <MedicationIcon sx={{ color: 'white', fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>Nova Receita</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>Prescreva medicamentos para a consulta</Typography>
            </Box>
          </Box>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
          <FormControl fullWidth sx={{ mt: 1, mb: 3 }}>
            <InputLabel>Consulta</InputLabel>
            <Select value={consultaId} label="Consulta" onChange={(e) => setConsultaId(e.target.value)}>
              {consultasAtivas.map((c) => <MenuItem key={c.id} value={c.id}>{c.nomePaciente} — {c.nomeMedico}</MenuItem>)}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Medicamentos</Typography>
              <Typography variant="caption" color="text.secondary">{medicamentos.length} item(s)</Typography>
            </Box>
            <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={addMed}>Adicionar</Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          {medicamentos.map((med, i) => (
            <Paper key={i} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Medicamento {i + 1}
                </Typography>
                {medicamentos.length > 1 && (
                  <IconButton size="small" color="error" onClick={() => removeMed(i)}><DeleteIcon fontSize="small" /></IconButton>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <TextField label="Nome" value={med.nome} onChange={(e) => changeMed(i, 'nome', e.target.value)} sx={{ flex: 2 }} size="small" />
                <TextField label="Dosagem" value={med.dosagem} onChange={(e) => changeMed(i, 'dosagem', e.target.value)} sx={{ flex: 1 }} size="small" placeholder="ex: 500mg" />
                <TextField label="Posologia" value={med.posologia} onChange={(e) => changeMed(i, 'posologia', e.target.value)} sx={{ flex: 2 }} size="small" placeholder="ex: 1 cp 8/8h" />
              </Box>
            </Paper>
          ))}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={fechar} variant="outlined">Cancelar</Button>
          <Button onClick={handleSalvar} variant="contained" startIcon={<MedicationIcon />}>Emitir Receita</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}