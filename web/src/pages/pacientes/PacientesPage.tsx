import { useEffect, useState, useMemo } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  TextField, Typography, Alert, InputAdornment, Avatar, Card,
  CardContent, IconButton, Tooltip, Grid, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { Paciente } from '../../types';

function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function corAvatar(nome: string) {
  const cores = ['#1976d2', '#388e3c', '#7b1fa2', '#c62828', '#f57c00', '#0097a7', '#5d4037'];
  const idx = nome.charCodeAt(0) % cores.length;
  return cores[idx];
}

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [editando, setEditando] = useState<Paciente | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const r = await api.get('/api/Paciente');
    setPacientes(r.data);
  }

  async function handleSalvar() {
    setErro('');
    try {
      if (editando) await api.put(`/api/Paciente/${editando.id}`, { nome });
      else await api.post('/api/Paciente', { nome });
      fechar(); carregar();
    } catch { setErro('Erro ao salvar paciente'); }
  }

  async function handleDeletar(id: string) {
    if (!confirm('Deseja excluir este paciente?')) return;
    await api.delete(`/api/Paciente/${id}`);
    carregar();
  }

  function editar(p: Paciente) { setEditando(p); setNome(p.nome); setModalAberto(true); }
  function fechar() { setModalAberto(false); setNome(''); setEditando(null); setErro(''); }

  const pacientesFiltrados = useMemo(() =>
    pacientes.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase())),
    [pacientes, busca]
  );

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Pacientes</Typography>
          <Chip label={pacientes.length} size="small" color="primary" />
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalAberto(true)} sx={{ borderRadius: 2 }}>
          Novo Paciente
        </Button>
      </Box>

      <TextField
        fullWidth
        placeholder="Buscar paciente por nome..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
        }}
      />

      {pacientesFiltrados.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <PersonIcon sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
          <Typography variant="h6" sx={{ opacity: 0.5 }}>
            {busca ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {pacientesFiltrados.map((p) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={p.id}>
              <Card sx={{ borderRadius: 2, height: '100%', transition: '0.2s', '&:hover': { boxShadow: 6 } }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                  <Avatar sx={{ bgcolor: corAvatar(p.nome), width: 48, height: 48, fontSize: 18, fontWeight: 'bold', flexShrink: 0 }}>
                    {iniciais(p.nome)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.nome}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Paciente</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                    <Tooltip title="Editar">
                      <IconButton size="small" color="primary" onClick={() => editar(p)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton size="small" color="error" onClick={() => handleDeletar(p.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={modalAberto} onClose={fechar} fullWidth maxWidth="sm">
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          {editando ? 'Editar Paciente' : 'Novo Paciente'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
          <TextField label="Nome completo" fullWidth value={nome} onChange={(e) => setNome(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={fechar} variant="outlined">Cancelar</Button>
          <Button onClick={handleSalvar} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}