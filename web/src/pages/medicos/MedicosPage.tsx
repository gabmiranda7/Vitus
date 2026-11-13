import { useEffect, useState, useMemo } from 'react';
import {
  Box, TextField, Typography, InputAdornment, Avatar, Chip, IconButton,
  MenuItem, Select, FormControl, InputLabel, Paper, alpha,
} from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import SearchIcon from '@mui/icons-material/Search';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { Medico } from '../../types';

const POR_PAGINA = 10;

function iniciais(nome: string) {
  return nome.replace(/^Dr\.?\s*/i, '').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

const CORES_ESP: Record<string, string> = {
  'Cardiologia': '#c62828', 'Pediatria': '#1565c0', 'Ortopedia': '#2e7d32',
  'Neurologia': '#6a1b9a', 'Dermatologia': '#e65100', 'Ginecologia': '#ad1457',
  'Clínico Geral': '#00695c', 'Oftalmologia': '#0277bd', 'Psiquiatria': '#4527a0',
  'Endocrinologia': '#00838f', 'Urologia': '#558b2f', 'Reumatologia': '#6d4c41',
};

function corEspecialidade(esp: string) {
  return CORES_ESP[esp] ?? '#1976d2';
}

export default function MedicosPage() {
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroEsp, setFiltroEsp] = useState('');
  const [pagina, setPagina] = useState(1);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const r = await api.get('/api/medicos');
    setMedicos(r.data);
  }

  const especialidades = useMemo(() =>
    [...new Set(medicos.map(m => m.especialidade))].filter(Boolean).sort(), [medicos]
  );

  const filtrados = useMemo(() =>
    medicos.filter(m =>
      m.nome.toLowerCase().includes(busca.toLowerCase()) &&
      (filtroEsp === '' || m.especialidade === filtroEsp)
    ), [medicos, busca, filtroEsp]);

  useEffect(() => { setPagina(1); }, [busca, filtroEsp]);

  const resumo = useMemo(() => {
    const map: Record<string, number> = {};
    medicos.forEach(m => { map[m.especialidade] = (map[m.especialidade] ?? 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [medicos]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  return (
    <Layout>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <LocalHospitalIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Médicos</Typography>
        <Chip label={medicos.length} size="small" color="primary" />
      </Box>

      {resumo.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
          {resumo.map(([esp, count]) => {
            const cor = corEspecialidade(esp);
            const ativo = filtroEsp === esp;
            return (
              <Chip
                key={esp}
                label={`${esp} · ${count}`}
                size="small"
                clickable
                onClick={() => setFiltroEsp(ativo ? '' : esp)}
                sx={{
                  fontWeight: 600, fontSize: 12,
                  color: cor,
                  bgcolor: alpha(cor, ativo ? 0.22 : 0.08),
                  border: `1px solid ${alpha(cor, ativo ? 0.6 : 0.25)}`,
                }}
              />
            );
          })}
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar médico por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> } }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Especialidade</InputLabel>
          <Select value={filtroEsp} label="Especialidade" onChange={(e) => setFiltroEsp(e.target.value)}>
            <MenuItem value="">Todas</MenuItem>
            {especialidades.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {filtrados.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <LocalHospitalIcon sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
          <Typography variant="h6" sx={{ opacity: 0.5 }}>
            {busca || filtroEsp ? 'Nenhum médico encontrado' : 'Nenhum médico cadastrado'}
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {paginaAtual.map((m) => {
              const cor = corEspecialidade(m.especialidade);
              return (
                <Paper key={m.id} variant="outlined" sx={{
                  p: 1.5, px: 2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2,
                  borderLeft: `4px solid ${cor}`,
                }}>
                  <Avatar sx={{ bgcolor: cor, width: 40, height: 40, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                    {iniciais(m.nome)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.nome}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">CRM: {m.crm}</Typography>
                  </Box>
                  <Chip
                    label={m.especialidade}
                    size="small"
                    sx={{ bgcolor: alpha(cor, 0.12), color: cor, fontWeight: 600, fontSize: 11, flexShrink: 0 }}
                  />
                </Paper>
              );
            })}
          </Box>

          {totalPaginas > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 3 }}>
              <IconButton onClick={() => setPagina(n => Math.max(1, n - 1))} disabled={pagina === 1}>
                <NavigateBeforeIcon />
              </IconButton>
              <Typography variant="body2" color="text.secondary">
                Página {pagina} de {totalPaginas} · {filtrados.length} médico(s)
              </Typography>
              <IconButton onClick={() => setPagina(n => Math.min(totalPaginas, n + 1))} disabled={pagina === totalPaginas}>
                <NavigateNextIcon />
              </IconButton>
            </Box>
          )}
        </>
      )}
    </Layout>
  );
}