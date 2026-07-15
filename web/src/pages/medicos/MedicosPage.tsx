import { useEffect, useState, useMemo } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent,
  TextField, Typography, Alert, InputAdornment, Avatar, Card,
  CardContent, Chip, IconButton, MenuItem, Select, FormControl,
  InputLabel, Paper, useTheme, alpha, Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import SearchIcon from '@mui/icons-material/Search';
import BadgeIcon from '@mui/icons-material/Badge';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { Medico } from '../../types';

const POR_PAGINA = 9;

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
  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [crm, setCrm] = useState('');
  const [erro, setErro] = useState('');
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

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
    } catch (error: any) { setErro(error.mensagemBack ?? 'Erro ao salvar médico'); }
  }

  function fechar() { setModalAberto(false); setNome(''); setEspecialidade(''); setCrm(''); setErro(''); }

  const especialidades = useMemo(() =>
    [...new Set(medicos.map(m => m.especialidade))].filter(Boolean).sort(), [medicos]
  );

  const filtrados = useMemo(() => {
    setPagina(1);
    return medicos.filter(m =>
      m.nome.toLowerCase().includes(busca.toLowerCase()) &&
      (filtroEsp === '' || m.especialidade === filtroEsp)
    );
  }, [medicos, busca, filtroEsp]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  // Estatísticas por especialidade
  const espCount = useMemo(() => {
    const map: Record<string, number> = {};
    medicos.forEach(m => { map[m.especialidade] = (map[m.especialidade] ?? 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [medicos]);

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

      {/* Cards de especialidade */}
      {espCount.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          {espCount.map(([esp, count]) => (
            <Paper
              key={esp}
              onClick={() => setFiltroEsp(filtroEsp === esp ? '' : esp)}
              sx={{
                flex: '1 1 120px',
                p: 2, borderRadius: 3, cursor: 'pointer',
                bgcolor: filtroEsp === esp
                  ? alpha(corEspecialidade(esp), isDark ? 0.25 : 0.12)
                  : alpha(corEspecialidade(esp), isDark ? 0.1 : 0.06),
                border: `1px solid ${alpha(corEspecialidade(esp), filtroEsp === esp ? 0.5 : 0.2)}`,
                transition: '0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 },
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 800, color: corEspecialidade(esp), lineHeight: 1, mb: 0.5 }}>
                {count}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2, display: 'block' }}>
                {esp}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}

      {/* Filtros */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar médico por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>
            }
          }}
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
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {paginaAtual.map((m) => {
              const cor = corEspecialidade(m.especialidade);
              return (
                <Box key={m.id} sx={{ flex: '1 1 260px', maxWidth: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.33% - 11px)' } }}>
                  <Card sx={{
                    borderRadius: 3, height: '100%', overflow: 'hidden',
                    border: `1px solid ${alpha(cor, 0.2)}`,
                    borderTop: `4px solid ${cor}`,
                    transition: '0.2s', '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' }
                  }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{
                          bgcolor: cor, width: 56, height: 56,
                          fontSize: 18, fontWeight: 800,
                          border: `3px solid ${alpha(cor, 0.2)}`,
                        }}>
                          {iniciais(m.nome)}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body1" sx={{
                            fontWeight: 700,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}>
                            {m.nome}
                          </Typography>
                          <Chip
                            label={m.especialidade}
                            size="small"
                            sx={{ mt: 0.5, bgcolor: alpha(cor, 0.12), color: cor, fontWeight: 600, fontSize: 11 }}
                          />
                        </Box>
                      </Box>

                      <Divider sx={{ mb: 1.5 }} />

                      <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 1,
                        p: 1.5, borderRadius: 2,
                        bgcolor: isDark ? 'grey.800' : 'grey.50',
                      }}>
                        <BadgeIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>
                            CRM
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {m.crm}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              );
            })}
          </Box>

          {totalPaginas > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 3 }}>
              <IconButton onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}>
                <NavigateBeforeIcon />
              </IconButton>
              <Typography variant="body2" color="text.secondary">
                Página {pagina} de {totalPaginas} · {filtrados.length} médico(s)
              </Typography>
              <IconButton onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}>
                <NavigateNextIcon />
              </IconButton>
            </Box>
          )}
        </>
      )}

      {/* Modal Novo Médico */}
      <Dialog open={modalAberto} onClose={fechar} fullWidth maxWidth="sm">
        <Box sx={{ background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)', p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 52, height: 52, border: '2px solid rgba(255,255,255,0.4)' }}>
              <MedicalServicesIcon sx={{ color: 'white', fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>Novo Médico</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>Preencha os dados do profissional</Typography>
            </Box>
          </Box>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
          <TextField label="Nome completo" fullWidth value={nome}
            onChange={(e) => setNome(e.target.value)} sx={{ mt: 1, mb: 2 }} />
          <TextField label="Especialidade" fullWidth value={especialidade}
            onChange={(e) => setEspecialidade(e.target.value)} sx={{ mb: 2 }}
            placeholder="ex: Clínico Geral, Cardiologia..." />
          <TextField label="CRM" fullWidth value={crm}
            onChange={(e) => setCrm(e.target.value)}
            placeholder="ex: CRM/MG 123456" />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={fechar} variant="outlined">Cancelar</Button>
          <Button onClick={handleSalvar} variant="contained" startIcon={<LocalHospitalIcon />}>
            Cadastrar Médico
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}