import { useEffect, useState, useMemo } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  TextField, Typography, Alert, InputAdornment, Avatar, Card,
  CardContent, Grid, Chip, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import SearchIcon from '@mui/icons-material/Search';
import BadgeIcon from '@mui/icons-material/Badge';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { Medico } from '../../types';

function iniciais(nome: string) {
  return nome.replace(/^Dr\.?\s*/i, '').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function corEspecialidade(esp: string) {
  const mapa: Record<string, string> = {
    'Cardiologia': '#c62828', 'Pediatria': '#1565c0', 'Ortopedia': '#2e7d32',
    'Neurologia': '#6a1b9a', 'Dermatologia': '#e65100', 'Ginecologia': '#ad1457',
    'Clínico Geral': '#00695c', 'Oftalmologia': '#0277bd', 'Psiquiatria': '#4527a0',
  };
  return mapa[esp] ?? '#1976d2';
}

export default function MedicosPage() {
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroEspecialidade, setFiltroEspecialidade] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [crm, setCrm] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const r = await api.get('/api/medicos');
    setMedicos(r.data);
  }

  async function handleSalvar() {
    setErro('');
    try {
      await api.post('/api/medicos', { nome, especialidade, crm });
      fechar(); carregar();
    } catch { setErro('Erro ao salvar médico'); }
  }

  function fechar() { setModalAberto(false); setNome(''); setEspecialidade(''); setCrm(''); setErro(''); }

  const especialidades = useMemo(() =>
    [...new Set(medicos.map(m => m.especialidade))].sort(), [medicos]
  );

  const medicosFiltrados = useMemo(() =>
    medicos.filter(m =>
      m.nome.toLowerCase().includes(busca.toLowerCase()) &&
      (filtroEspecialidade === '' || m.especialidade === filtroEspecialidade)
    ), [medicos, busca, filtroEspecialidade]
  );

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalHospitalIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Médicos</Typography>
          <Chip label={medicos.length} size="small" color="primary" />
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalAberto(true)} sx={{ borderRadius: 2 }}>
          Novo Médico
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar médico por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <FormControl sx={{ minWidth: 220 }}>
          <InputLabel>Especialidade</InputLabel>
          <Select value={filtroEspecialidade} label="Especialidade" onChange={(e) => setFiltroEspecialidade(e.target.value)}>
            <MenuItem value="">Todas</MenuItem>
            {especialidades.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {medicosFiltrados.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <LocalHospitalIcon sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
          <Typography variant="h6" sx={{ opacity: 0.5 }}>
            {busca || filtroEspecialidade ? 'Nenhum médico encontrado' : 'Nenhum médico cadastrado'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {medicosFiltrados.map((m) => (
            <Grid item xs={12} sm={6} md={4} key={m.id}>
              <Card sx={{ borderRadius: 2, height: '100%', transition: '0.2s', '&:hover': { boxShadow: 6 } }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                    <Avatar sx={{ bgcolor: corEspecialidade(m.especialidade), width: 52, height: 52, fontSize: 18, fontWeight: 'bold' }}>
                      {iniciais(m.nome)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.nome}
                      </Typography>
                      <Chip label={m.especialidade} size="small" sx={{ mt: 0.5, bgcolor: corEspecialidade(m.especialidade), color: 'white', fontWeight: 500, fontSize: 11 }} />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                    <BadgeIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">{m.crm}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={modalAberto} onClose={fechar} fullWidth maxWidth="sm">
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>Novo Médico</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
          <TextField label="Nome completo" fullWidth value={nome} onChange={(e) => setNome(e.target.value)} sx={{ mt: 1, mb: 2 }} />
          <TextField label="Especialidade" fullWidth value={especialidade} onChange={(e) => setEspecialidade(e.target.value)} sx={{ mb: 2 }} />
          <TextField label="CRM" fullWidth value={crm} onChange={(e) => setCrm(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={fechar} variant="outlined">Cancelar</Button>
          <Button onClick={handleSalvar} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}