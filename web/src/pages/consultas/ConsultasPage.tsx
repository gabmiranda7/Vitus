import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent,
  FormControl, InputLabel, MenuItem, Select, TextField, Typography,
  Alert, Tabs, Tab, Avatar, Divider, InputAdornment, useTheme,
  IconButton, CircularProgress, Paper, Drawer, alpha, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditNoteIcon from '@mui/icons-material/EditNote';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import EventNoteIcon from '@mui/icons-material/EventNote';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import PersonIcon from '@mui/icons-material/Person';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MedicationIcon from '@mui/icons-material/Medication';
import ScienceIcon from '@mui/icons-material/Science';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FilterListIcon from '@mui/icons-material/FilterList';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { Consulta, Medico, Paciente, Medicamento } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const statusCores: Record<string, string> = {
  Agendada: '#1976d2', EmTriagem: '#ed6c02', AguardandoAtendimento: '#0288d1',
  EmAtendimento: '#7b1fa2', Finalizada: '#2e7d32', Cancelada: '#d32f2f',
};

const statusLabels: Record<string, string> = {
  Agendada: 'Agendada', EmTriagem: 'Em Triagem',
  AguardandoAtendimento: 'Aguardando', EmAtendimento: 'Em Atendimento',
  Finalizada: 'Finalizada', Cancelada: 'Cancelada',
};

const ordemStatus: Record<string, number> = {
  EmAtendimento: 0, AguardandoAtendimento: 1, EmTriagem: 2, Agendada: 3,
};

const statusAtivos = ['Agendada', 'EmTriagem', 'AguardandoAtendimento', 'EmAtendimento'];
const statusHistorico = ['Finalizada', 'Cancelada'];

const CATEGORIAS = ['Sangue', 'Imagem', 'Urina', 'Cardiologico', 'Fisico', 'Outro'];
const categoriaLabel: Record<string, string> = {
  Sangue: 'Sangue', Imagem: 'Imagem', Urina: 'Urina',
  Cardiologico: 'Cardiológico', Fisico: 'Físico', Outro: 'Outro',
};
const TIPOS_RECEITA = [
  { value: 'Comum', label: 'Receita Comum (1 via)' },
  { value: 'Especial', label: 'Receita Especial (2 vias — controlados)' },
];
const TIPOS_USO = [
  { value: 'Oral', label: 'Uso Oral' },
  { value: 'Interno', label: 'Uso Interno' },
  { value: 'Externo', label: 'Uso Externo' },
];

const medVazio = (): Medicamento => ({ nome: '', dosagem: '', posologia: '', quantidade: '' });
const exameVazio = () => ({
  categoria: 'Sangue', nome: '', descricao: '',
  medicoSolicitante: '', dataExame: new Date().toISOString().split('T')[0], observacoes: '',
});

function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}
function corAvatar(nome: string) {
  const cores = ['#1976d2', '#388e3c', '#7b1fa2', '#c62828', '#f57c00', '#0097a7'];
  return cores[nome.charCodeAt(0) % cores.length];
}
function dataHojeLocal() {
  const agora = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}T${pad(agora.getHours())}:${pad(agora.getMinutes())}`;
}

export default function ConsultasPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [aba, setAba] = useState(0);
  const [busca, setBusca] = useState('');

  // Filtros
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(false);
  const [filtroMedico, setFiltroMedico] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  // Drawer
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [consultaDrawer, setConsultaDrawer] = useState<Consulta | null>(null);

  // Modais
  const [modalNova, setModalNova] = useState(false);
  const [modalAnotacao, setModalAnotacao] = useState(false);
  const [modalTriagem, setModalTriagem] = useState(false);
  const [modalConfirm, setModalConfirm] = useState(false);
  const [modalReceita, setModalReceita] = useState(false);
  const [modalExame, setModalExame] = useState(false);
  const [confirmAcao, setConfirmAcao] = useState<{
    id: string; acao: string; label: string; cor: 'error' | 'success';
  } | null>(null);

  // Campos
  const [pacienteId, setPacienteId] = useState('');
  const [medicoId, setMedicoId] = useState('');
  const [dataConsulta, setDataConsulta] = useState(dataHojeLocal());
  const [anotacoes, setAnotacoes] = useState('');
  const [pressaoArterial, setPressaoArterial] = useState('');
  const [temperatura, setTemperatura] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [tipoReceita, setTipoReceita] = useState('Comum');
  const [tipoUso, setTipoUso] = useState('Oral');
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([medVazio()]);
  const [gerando, setGerando] = useState(false);
  const [formExame, setFormExame] = useState(exameVazio());
  const [arquivoExame, setArquivoExame] = useState<File | null>(null);
  const [salvandoExame, setSalvandoExame] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregar();
    if (usuario?.perfil === 'Recepcionista') { carregarPacientes(); carregarMedicos(); }
    else { carregarMedicos(); } // médicos para o filtro
  }, []);

  async function carregar() { const r = await api.get('/api/consultas'); setConsultas(r.data); }
  async function carregarPacientes() { const r = await api.get('/api/Paciente'); setPacientes(r.data); }
  async function carregarMedicos() { const r = await api.get('/api/medicos'); setMedicos(r.data); }

  function abrirDrawer(c: Consulta) { setConsultaDrawer(c); setDrawerAberto(true); }
  function fecharDrawer() { setDrawerAberto(false); }

  const temFiltroAtivo = filtroMedico !== '' || filtroStatus !== '' || filtroDataInicio !== '' || filtroDataFim !== '';
  const qtdFiltrosAtivos = [filtroMedico, filtroStatus, filtroDataInicio || filtroDataFim].filter(Boolean).length;

  function limparFiltros() { setFiltroMedico(''); setFiltroStatus(''); setFiltroDataInicio(''); setFiltroDataFim(''); }

  async function handleSalvarConsulta() {
    setErro('');
    try {
      await api.post('/api/consultas', { pacienteId, medicoId, dataConsulta: new Date(dataConsulta).toISOString() });
      fecharNova(); carregar();
    } catch (e: any) { setErro(e.mensagemBack ?? 'Erro ao agendar consulta'); }
  }

  function pedirConfirmacao(id: string, acao: string, label: string, cor: 'error' | 'success') {
    fecharDrawer();
    setConfirmAcao({ id, acao, label, cor });
    setModalConfirm(true);
  }

  async function confirmarAcao() {
    if (!confirmAcao) return;
    await api.patch(`/api/consultas/${confirmAcao.id}/${confirmAcao.acao}`);
    setModalConfirm(false); setConfirmAcao(null); carregar();
  }

  async function handleSalvarAnotacao() {
    if (!consultaDrawer) return;
    setErro('');
    try {
      await api.patch(`/api/consultas/${consultaDrawer.id}/anotar`, { anotacoes });
      fecharAnotacao(); carregar();
    } catch (e: any) { setErro(e.mensagemBack ?? 'Erro ao salvar anotação'); }
  }

  async function handleSalvarTriagem() {
    if (!consultaDrawer) return;
    setErro('');
    try {
      await api.patch(`/api/consultas/${consultaDrawer.id}/iniciar-triagem`);
      await api.post('/api/triagens', {
        consultaId: consultaDrawer.id,
        pressaoArterial, temperatura: parseFloat(temperatura), observacoes,
      });
      await api.patch(`/api/consultas/${consultaDrawer.id}/aguardar-atendimento`);
      fecharTriagem(); carregar();
    } catch (e: any) { setErro(e.mensagemBack ?? 'Erro ao registrar triagem'); }
  }

  async function handleGerarReceita() {
    if (!consultaDrawer) return;
    setErro('');
    if (medicamentos.some(m => !m.nome.trim())) return setErro('Preencha o nome de todos os medicamentos');
    setGerando(true);
    try {
      const r = await api.post('/api/receitas/gerar', {
        consultaId: consultaDrawer.id, tipoReceita, tipoUso, medicamentos,
      }, { responseType: 'blob' });
      const cd = r.headers['content-disposition'] ?? '';
      const match = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      const nome = match ? match[1].replace(/['"]/g, '') : `Receita_${tipoReceita}.docx`;
      const url = URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a'); a.href = url; a.download = nome; a.click();
      URL.revokeObjectURL(url);
      fecharReceita(); carregar();
    } catch (e: any) {
      let msg = 'Erro ao gerar receita';
      if (e.response?.data instanceof Blob) {
        const txt = await e.response.data.text();
        try { const j = JSON.parse(txt); msg = j.Messages?.[0] ?? j.mensagem ?? msg; } catch { msg = txt; }
      }
      setErro(msg);
    } finally { setGerando(false); }
  }

  async function handleSalvarExame() {
    if (!consultaDrawer) return;
    setErro('');
    if (!formExame.nome.trim()) return setErro('Nome do exame é obrigatório');
    if (!formExame.medicoSolicitante.trim()) return setErro('Médico solicitante é obrigatório');
    setSalvandoExame(true);
    try {
      const rProntuario = await api.get(`/api/prontuarios/consulta/${consultaDrawer.id}`);
      const rExame = await api.post('/api/exames', {
        prontuarioId: rProntuario.data.id,
        consultaId: consultaDrawer.id, ...formExame,
      });
      if (arquivoExame) {
        const fd = new FormData(); fd.append('arquivo', arquivoExame);
        await api.post(`/api/exames/${rExame.data.id}/arquivo`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      fecharExame(); carregar();
    } catch (e: any) {
      if (!e.response) {
        setErro('Não foi possível enviar o arquivo. Verifique o tamanho (máx. 10MB) e sua conexão.');
      } else {
        setErro(e.mensagemBack ?? 'Erro ao registrar exame');
      }
    }
    finally { setSalvandoExame(false); }
  }

  function fecharNova() { setModalNova(false); setPacienteId(''); setMedicoId(''); setDataConsulta(dataHojeLocal()); setErro(''); }
  function fecharAnotacao() { setModalAnotacao(false); setAnotacoes(''); setErro(''); }
  function fecharTriagem() { setModalTriagem(false); setPressaoArterial(''); setTemperatura(''); setObservacoes(''); setErro(''); }
  function fecharReceita() { setModalReceita(false); setTipoReceita('Comum'); setTipoUso('Oral'); setMedicamentos([medVazio()]); setErro(''); }
  function fecharExame() { setModalExame(false); setFormExame(exameVazio()); setArquivoExame(null); setErro(''); }

  const podeVerProntuario = usuario?.perfil === 'Medico' || usuario?.perfil === 'Enfermeiro';

  const consultasAtivas = useMemo(() =>
    consultas.filter(c => statusAtivos.includes(c.status))
      .sort((a, b) => (ordemStatus[a.status] ?? 99) - (ordemStatus[b.status] ?? 99)),
    [consultas]);

  const consultasHistorico = useMemo(() =>
    consultas.filter(c => statusHistorico.includes(c.status))
      .sort((a, b) => new Date(b.dataConsulta).getTime() - new Date(a.dataConsulta).getTime()),
    [consultas]);

  const consultasFiltradas = useMemo(() => {
    const lista = aba === 0 ? consultasAtivas : consultasHistorico;
    return lista.filter(c => {
      const q = busca.toLowerCase();
      const buscaOk = !busca.trim() ||
        c.nomePaciente.toLowerCase().includes(q) ||
        c.nomeMedico.toLowerCase().includes(q) ||
        new Date(c.dataConsulta).toLocaleDateString('pt-BR').includes(q) ||
        statusLabels[c.status]?.toLowerCase().includes(q);

      const medicoOk = filtroMedico === '' || c.nomeMedico === filtroMedico;
      const statusOk = filtroStatus === '' || c.status === filtroStatus;

      const dataC = new Date(c.dataConsulta);
      const inicioOk = filtroDataInicio === '' || dataC >= new Date(filtroDataInicio);
      const fimOk = filtroDataFim === '' || dataC <= new Date(filtroDataFim + 'T23:59:59');

      return buscaOk && medicoOk && statusOk && inicioOk && fimOk;
    });
  }, [aba, consultasAtivas, consultasHistorico, busca, filtroMedico, filtroStatus, filtroDataInicio, filtroDataFim]);

  // Médicos que aparecem nas consultas (para o filtro)
  const medicosNasConsultas = useMemo(() => {
    const lista = aba === 0 ? consultasAtivas : consultasHistorico;
    return [...new Set(lista.map(c => c.nomeMedico))].sort();
  }, [aba, consultasAtivas, consultasHistorico]);

  const statusNaAba = aba === 0 ? statusAtivos : statusHistorico;

  function renderCards(lista: Consulta[]) {
    if (lista.length === 0) return (
      <Box sx={{ textAlign: 'center', py: 10, color: 'text.secondary' }}>
        <EventNoteIcon sx={{ fontSize: 64, opacity: 0.15, mb: 2 }} />
        <Typography variant="h6" sx={{ opacity: 0.4 }}>Nenhuma consulta encontrada</Typography>
        {temFiltroAtivo && (
          <Button size="small" onClick={limparFiltros} sx={{ mt: 1 }}>Limpar filtros</Button>
        )}
      </Box>
    );

    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {lista.map((c) => {
          const cor = statusCores[c.status] ?? '#1976d2';
          return (
            <Paper key={c.id} onClick={() => abrirDrawer(c)} sx={{
              flex: '1 1 280px',
              maxWidth: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.33% - 11px)' },
              borderRadius: 3, overflow: 'hidden', cursor: 'pointer',
              border: `1px solid ${alpha(cor, 0.25)}`,
              borderTop: `4px solid ${cor}`,
              transition: '0.2s',
              '&:hover': { transform: 'translateY(-3px)', boxShadow: 4 },
            }}>
              <Box sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Chip label={statusLabels[c.status]} size="small"
                    sx={{ bgcolor: alpha(cor, 0.12), color: cor, fontWeight: 700, fontSize: 11 }} />
                  <ChevronRightIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Avatar sx={{ width: 42, height: 42, fontSize: 14, fontWeight: 700, bgcolor: corAvatar(c.nomePaciente), flexShrink: 0 }}>
                    {iniciais(c.nomePaciente)}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.nomePaciente}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Paciente</Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 1.5 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Avatar sx={{ width: 28, height: 28, fontSize: 11, bgcolor: '#1565c0', flexShrink: 0 }}>
                    {iniciais(c.nomeMedico)}
                  </Avatar>
                  <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.nomeMedico}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarMonthIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(c.dataConsulta).toLocaleDateString('pt-BR')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(c.dataConsulta).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                </Box>
                {c.anotacoes && (
                  <Box sx={{ mt: 1.5, p: 1, borderRadius: 1, bgcolor: isDark ? 'grey.800' : 'grey.50', borderLeft: `3px solid ${alpha('#0288d1', 0.4)}` }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {c.anotacoes}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          );
        })}
      </Box>
    );
  }

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventNoteIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Consultas</Typography>
          <Chip label={consultasAtivas.length} size="small" color="primary" />
        </Box>
        {usuario?.perfil === 'Recepcionista' && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalNova(true)} sx={{ borderRadius: 2 }}>
            Nova Consulta
          </Button>
        )}
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={aba} onChange={(_, v) => { setAba(v); setBusca(''); limparFiltros(); }}>
          <Tab label={`Ativas (${consultasAtivas.length})`} />
          <Tab label={`Histórico (${consultasHistorico.length})`} />
        </Tabs>
      </Box>

      {/* Busca + botão filtros */}
      <Box sx={{ display: 'flex', gap: 1, mb: filtrosVisiveis ? 2 : 3 }}>
        <TextField fullWidth placeholder="Buscar por paciente, médico, data ou status..."
          value={busca} onChange={(e) => setBusca(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> } }}
        />
        <Tooltip title={filtrosVisiveis ? 'Ocultar filtros' : 'Mostrar filtros'}>
          <Button
            variant={temFiltroAtivo ? 'contained' : 'outlined'}
            color={temFiltroAtivo ? 'primary' : 'inherit'}
            onClick={() => setFiltrosVisiveis(v => !v)}
            startIcon={filtrosVisiveis ? <FilterListOffIcon /> : <FilterListIcon />}
            sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}
          >
            Filtros {qtdFiltrosAtivos > 0 && `(${qtdFiltrosAtivos})`}
          </Button>
        </Tooltip>
      </Box>

      {/* Filtros expandíveis */}
      {filtrosVisiveis && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel>Médico</InputLabel>
              <Select value={filtroMedico} label="Médico" onChange={(e) => setFiltroMedico(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                {medicosNasConsultas.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 180 }} size="small">
              <InputLabel>Status</InputLabel>
              <Select value={filtroStatus} label="Status" onChange={(e) => setFiltroStatus(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                {statusNaAba.map(s => <MenuItem key={s} value={s}>{statusLabels[s]}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Data início" type="date" size="small" value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: 160 }} />
            <TextField label="Data fim" type="date" size="small" value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: 160 }} />
            {temFiltroAtivo && (
              <Button size="small" variant="outlined" color="error" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
              {consultasFiltradas.length} de {(aba === 0 ? consultasAtivas : consultasHistorico).length} consulta(s)
            </Typography>
          </Box>
        </Paper>
      )}

      {renderCards(consultasFiltradas)}

      {/* Drawer de Ações */}
      <Drawer anchor="right" open={drawerAberto} onClose={fecharDrawer}
        PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, borderRadius: '16px 0 0 16px' } }}>
        {consultaDrawer && (() => {
          const cor = statusCores[consultaDrawer.status] ?? '#1976d2';
          return (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ background: `linear-gradient(135deg, ${cor}dd, ${cor})`, p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Chip label={statusLabels[consultaDrawer.status]} size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} />
                  <IconButton size="small" onClick={fecharDrawer} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)' }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 56, height: 56, fontSize: 18, fontWeight: 700, bgcolor: 'rgba(255,255,255,0.25)', border: '2px solid rgba(255,255,255,0.4)' }}>
                    {iniciais(consultaDrawer.nomePaciente)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 800, lineHeight: 1.2 }}>
                      {consultaDrawer.nomePaciente}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      {consultaDrawer.nomeMedico}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarMonthIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      {new Date(consultaDrawer.dataConsulta).toLocaleDateString('pt-BR')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      {new Date(consultaDrawer.dataConsulta).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>Ações disponíveis</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1.5 }}>
                  {podeVerProntuario && (
                    <Button fullWidth variant="outlined" color="secondary" size="large"
                      startIcon={<FolderSharedIcon />}
                      onClick={() => { fecharDrawer(); navigate(`/prontuario/${consultaDrawer.id}`); }}
                      sx={{ borderRadius: 2, justifyContent: 'flex-start', px: 2 }}>
                      Ver Prontuário
                    </Button>
                  )}
                  {usuario?.perfil === 'Enfermeiro' && consultaDrawer.status === 'Agendada' && (
                    <Button fullWidth variant="contained" color="warning" size="large"
                      startIcon={<MedicalServicesIcon />}
                      onClick={() => { fecharDrawer(); setModalTriagem(true); }}
                      sx={{ borderRadius: 2, justifyContent: 'flex-start', px: 2 }}>
                      Iniciar Triagem
                    </Button>
                  )}
                  {usuario?.perfil === 'Enfermeiro' && consultaDrawer.status === 'EmTriagem' && (
                    <Button fullWidth variant="contained" size="large"
                      onClick={() => api.patch(`/api/consultas/${consultaDrawer.id}/aguardar-atendimento`).then(() => { fecharDrawer(); carregar(); })}
                      sx={{ borderRadius: 2, justifyContent: 'flex-start', px: 2 }}>
                      Mover para Aguardando
                    </Button>
                  )}
                  {usuario?.perfil === 'Medico' && consultaDrawer.status === 'AguardandoAtendimento' && (
                    <Button fullWidth variant="contained" color="primary" size="large"
                      startIcon={<PersonIcon />}
                      onClick={() => api.patch(`/api/consultas/${consultaDrawer.id}/iniciar-atendimento`).then(() => { fecharDrawer(); carregar(); })}
                      sx={{ borderRadius: 2, justifyContent: 'flex-start', px: 2 }}>
                      Iniciar Atendimento
                    </Button>
                  )}
                  {usuario?.perfil === 'Medico' && consultaDrawer.status === 'EmAtendimento' && (<>
                    <Button fullWidth variant="outlined" color="info" size="large"
                      startIcon={<EditNoteIcon />}
                      onClick={() => { setAnotacoes(consultaDrawer.anotacoes ?? ''); setModalAnotacao(true); }}
                      sx={{ borderRadius: 2, justifyContent: 'flex-start', px: 2 }}>
                      Anotações Clínicas
                    </Button>
                    <Button fullWidth variant="outlined" color="success" size="large"
                      startIcon={<MedicationIcon />}
                      onClick={() => setModalReceita(true)}
                      sx={{ borderRadius: 2, justifyContent: 'flex-start', px: 2 }}>
                      Emitir Receita
                    </Button>
                    <Button fullWidth variant="outlined" color="secondary" size="large"
                      startIcon={<ScienceIcon />}
                      onClick={() => setModalExame(true)}
                      sx={{ borderRadius: 2, justifyContent: 'flex-start', px: 2 }}>
                      Registrar Exame
                    </Button>
                    <Divider sx={{ my: 1 }} />
                    <Button fullWidth variant="contained" color="success" size="large"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => pedirConfirmacao(consultaDrawer.id, 'finalizar', consultaDrawer.nomePaciente, 'success')}
                      sx={{ borderRadius: 2, justifyContent: 'flex-start', px: 2 }}>
                      Finalizar Consulta
                    </Button>
                  </>)}
                  {['Recepcionista', 'Medico'].includes(usuario?.perfil ?? '') &&
                    !['Finalizada', 'Cancelada'].includes(consultaDrawer.status) && (
                      <Button fullWidth variant="outlined" color="error" size="large"
                        startIcon={<CancelIcon />}
                        onClick={() => pedirConfirmacao(consultaDrawer.id, 'cancelar', consultaDrawer.nomePaciente, 'error')}
                        sx={{ borderRadius: 2, justifyContent: 'flex-start', px: 2 }}>
                        Cancelar Consulta
                      </Button>
                    )}
                  {['Finalizada', 'Cancelada'].includes(consultaDrawer.status) && !podeVerProntuario && (
                    <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      <Typography variant="body2" sx={{ opacity: 0.5 }}>Nenhuma ação disponível</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          );
        })()}
      </Drawer>

      {/* Modal Nova Consulta */}
      <Dialog open={modalNova} onClose={fecharNova} fullWidth maxWidth="sm">
        <Box sx={{ background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)', p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 52, height: 52, border: '2px solid rgba(255,255,255,0.4)' }}>
              <EventNoteIcon sx={{ color: 'white', fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>Nova Consulta</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>Preencha os dados para agendar</Typography>
            </Box>
          </Box>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
          <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
            <InputLabel>Paciente</InputLabel>
            <Select value={pacienteId} label="Paciente" onChange={(e) => setPacienteId(e.target.value)}>
              {pacientes.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 28, height: 28, fontSize: 11, bgcolor: corAvatar(p.nome) }}>{iniciais(p.nome)}</Avatar>
                    {p.nome}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Médico</InputLabel>
            <Select value={medicoId} label="Médico" onChange={(e) => setMedicoId(e.target.value)}>
              {medicos.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 28, height: 28, fontSize: 11, bgcolor: '#1565c0' }}>{iniciais(m.nome)}</Avatar>
                    {m.nome} — {m.especialidade}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Data" type="date" sx={{ flex: 1 }}
              value={dataConsulta.split('T')[0]}
              onChange={(e) => setDataConsulta(`${e.target.value}T${dataConsulta.split('T')[1] ?? '08:00'}`)}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: new Date().toISOString().split('T')[0] } }} />
            <TextField label="Horário" type="time" sx={{ flex: 1 }}
              value={dataConsulta.split('T')[1]?.substring(0, 5) ?? '08:00'}
              onChange={(e) => setDataConsulta(`${dataConsulta.split('T')[0]}T${e.target.value}`)}
              slotProps={{ inputLabel: { shrink: true } }} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={fecharNova} variant="outlined">Cancelar</Button>
          <Button onClick={handleSalvarConsulta} variant="contained" startIcon={<CalendarMonthIcon />}>Agendar Consulta</Button>
        </DialogActions>
      </Dialog>

      {/* Modal Triagem */}
      <Dialog open={modalTriagem} onClose={fecharTriagem} fullWidth maxWidth="sm">
        <Box sx={{ background: 'linear-gradient(135deg, #e65100 0%, #f57c00 100%)', p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 52, height: 52, border: '2px solid rgba(255,255,255,0.4)' }}>
              <MedicalServicesIcon sx={{ color: 'white', fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>Triagem</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>{consultaDrawer?.nomePaciente}</Typography>
            </Box>
          </Box>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>Sinais Vitais</Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField label="Pressão Arterial" fullWidth value={pressaoArterial}
              onChange={(e) => setPressaoArterial(e.target.value)} placeholder="ex: 120/80"
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><FavoriteIcon sx={{ fontSize: 18, color: 'error.main' }} /></InputAdornment> } }} />
            <TextField label="Temperatura (°C)" type="number" fullWidth value={temperatura}
              onChange={(e) => setTemperatura(e.target.value)} placeholder="ex: 36.5"
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><ThermostatIcon sx={{ fontSize: 18, color: 'warning.main' }} /></InputAdornment> } }} />
          </Box>
          <Divider sx={{ mb: 2 }} />
          <TextField label="Queixa principal / observações" fullWidth multiline rows={4}
            value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Descreva a queixa principal do paciente..." />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={fecharTriagem} variant="outlined" fullWidth>Cancelar</Button>
          <Button onClick={handleSalvarTriagem} variant="contained" color="warning" fullWidth startIcon={<MedicalServicesIcon />}>Registrar Triagem</Button>
        </DialogActions>
      </Dialog>

      {/* Modal Anotações */}
      <Dialog open={modalAnotacao} onClose={fecharAnotacao} fullWidth maxWidth="md">
        <Box sx={{ background: 'linear-gradient(135deg, #0277bd 0%, #0288d1 100%)', p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 52, height: 52, border: '2px solid rgba(255,255,255,0.4)' }}>
              <EditNoteIcon sx={{ color: 'white', fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>Anotações Clínicas</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                {consultaDrawer?.nomePaciente} · {consultaDrawer && new Date(consultaDrawer.dataConsulta).toLocaleDateString('pt-BR')}
              </Typography>
            </Box>
            <Box sx={{ ml: 'auto' }}>
              <Chip label={`👨‍⚕️ ${consultaDrawer?.nomeMedico}`}
                sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 500 }} size="small" />
            </Box>
          </Box>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
          <Alert severity="info" sx={{ mb: 2 }} icon={<MonitorHeartIcon />}>
            As anotações ficam vinculadas ao prontuário e visíveis para médicos e enfermeiros.
          </Alert>
          <TextField label="Anotações da consulta" fullWidth multiline rows={10}
            value={anotacoes} onChange={(e) => setAnotacoes(e.target.value)}
            placeholder={`Ex:\n• Queixa principal: dor lombar há 3 dias\n• Exame físico: PA 130/85, FC 78bpm\n• Hipótese diagnóstica: lombalgia mecânica\n• Conduta: analgésico + repouso relativo`}
            sx={{ '& .MuiInputBase-root': { fontFamily: 'monospace', fontSize: 14, lineHeight: 1.7 } }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">{anotacoes.length} caracteres</Typography>
            <Typography variant="caption" color="text.secondary">Ctrl+Enter para salvar</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={fecharAnotacao} variant="outlined">Cancelar</Button>
          <Button onClick={handleSalvarAnotacao} variant="contained" color="info" startIcon={<EditNoteIcon />}>Salvar Anotação</Button>
        </DialogActions>
      </Dialog>

      {/* Modal Receita */}
      <Dialog open={modalReceita} onClose={fecharReceita} fullWidth maxWidth="md">
        <Box sx={{ background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)', p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 52, height: 52, border: '2px solid rgba(255,255,255,0.4)' }}>
              <MedicationIcon sx={{ color: 'white', fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>Nova Receita</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                {consultaDrawer?.nomePaciente} · {consultaDrawer?.nomeMedico}
              </Typography>
            </Box>
          </Box>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <FormControl sx={{ flex: 1 }}>
              <InputLabel>Tipo de Receita</InputLabel>
              <Select value={tipoReceita} label="Tipo de Receita" onChange={(e) => setTipoReceita(e.target.value)}>
                {TIPOS_RECEITA.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl sx={{ flex: 1 }}>
              <InputLabel>Tipo de Uso</InputLabel>
              <Select value={tipoUso} label="Tipo de Uso" onChange={(e) => setTipoUso(e.target.value)}>
                {TIPOS_USO.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          {tipoReceita === 'Especial' && (
            <Alert severity="info" sx={{ mb: 2 }}>Receita especial — será gerado um documento com 2 vias para impressão.</Alert>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Medicamentos</Typography>
            <Button size="small" startIcon={<AddIcon />} variant="outlined"
              onClick={() => setMedicamentos([...medicamentos, medVazio()])}>Adicionar</Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          {medicamentos.map((med, i) => (
            <Paper key={i} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Medicamento {i + 1}
                </Typography>
                {medicamentos.length > 1 && (
                  <IconButton size="small" color="error"
                    onClick={() => setMedicamentos(medicamentos.filter((_, idx) => idx !== i))}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <TextField label="Nome" value={med.nome} size="small" sx={{ flex: '2 1 160px' }}
                  onChange={(e) => { const n = [...medicamentos]; n[i].nome = e.target.value; setMedicamentos(n); }} />
                <TextField label="Dosagem" value={med.dosagem} size="small" sx={{ flex: '1 1 80px' }}
                  onChange={(e) => { const n = [...medicamentos]; n[i].dosagem = e.target.value; setMedicamentos(n); }}
                  placeholder="ex: 50mg" />
                <TextField label="Quantidade" value={med.quantidade} size="small" sx={{ flex: '1 1 80px' }}
                  onChange={(e) => { const n = [...medicamentos]; n[i].quantidade = e.target.value; setMedicamentos(n); }}
                  placeholder="ex: 60 cps." />
                <TextField label="Posologia" value={med.posologia} size="small" sx={{ flex: '2 1 160px' }}
                  onChange={(e) => { const n = [...medicamentos]; n[i].posologia = e.target.value; setMedicamentos(n); }}
                  placeholder="ex: 1 cp. ao dia" />
              </Box>
            </Paper>
          ))}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={fecharReceita} variant="outlined" disabled={gerando}>Cancelar</Button>
          <Button onClick={handleGerarReceita} variant="contained"
            startIcon={gerando ? <CircularProgress size={16} color="inherit" /> : <MedicationIcon />}
            disabled={gerando}>
            {gerando ? 'Gerando...' : 'Gerar e Baixar Receita'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Exame */}
      <Dialog open={modalExame} onClose={fecharExame} fullWidth maxWidth="sm">
        <Box sx={{ background: 'linear-gradient(135deg, #4a148c 0%, #7b1fa2 100%)', p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 52, height: 52, border: '2px solid rgba(255,255,255,0.4)' }}>
              <ScienceIcon sx={{ color: 'white', fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>Registrar Exame</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>{consultaDrawer?.nomePaciente}</Typography>
            </Box>
          </Box>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <FormControl sx={{ flex: '1 1 160px' }} size="small">
              <InputLabel>Categoria</InputLabel>
              <Select value={formExame.categoria} label="Categoria"
                onChange={(e) => setFormExame(f => ({ ...f, categoria: e.target.value }))}>
                {CATEGORIAS.map(c => <MenuItem key={c} value={c}>{categoriaLabel[c]}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Nome do exame *" size="small" value={formExame.nome} sx={{ flex: '2 1 200px' }}
              onChange={(e) => setFormExame(f => ({ ...f, nome: e.target.value }))} />
            <TextField label="Médico solicitante *" size="small" value={formExame.medicoSolicitante} sx={{ flex: '2 1 200px' }}
              onChange={(e) => setFormExame(f => ({ ...f, medicoSolicitante: e.target.value }))} />
            <TextField label="Data do exame" type="date" size="small" value={formExame.dataExame} sx={{ flex: '1 1 160px' }}
              onChange={(e) => setFormExame(f => ({ ...f, dataExame: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Descrição" size="small" value={formExame.descricao} sx={{ flex: '1 1 100%' }}
              onChange={(e) => setFormExame(f => ({ ...f, descricao: e.target.value }))} />
            <TextField label="Observações / valores relevantes" size="small" multiline rows={2}
              value={formExame.observacoes} sx={{ flex: '1 1 100%' }}
              onChange={(e) => setFormExame(f => ({ ...f, observacoes: e.target.value }))}
              placeholder="Ex: Glicose: 95 mg/dL; Colesterol: 180 mg/dL" />
            <Box sx={{ flex: '1 1 100%' }}>
              <Button variant="outlined" component="label" size="small" startIcon={<AttachFileIcon />}>
                {arquivoExame ? arquivoExame.name : 'Anexar arquivo (opcional)'}
                <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const extensoesValidas = ['.pdf', '.jpg', '.jpeg', '.png'];
                    const extensao = '.' + file.name.split('.').pop()?.toLowerCase();

                    if (!extensoesValidas.includes(extensao)) {
                      setErro('Formato inválido. Envie apenas PDF, JPG ou PNG.');
                      e.target.value = '';
                      return;
                    }
                    if (file.size > 10 * 1024 * 1024) {
                      setErro('Arquivo muito grande. Tamanho máximo: 10MB.');
                      e.target.value = '';
                      return;
                    }
                    setErro('');
                    setArquivoExame(file);
                  }} />
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={fecharExame} variant="outlined" disabled={salvandoExame}>Cancelar</Button>
          <Button onClick={handleSalvarExame} variant="contained" color="secondary"
            startIcon={salvandoExame ? <CircularProgress size={16} color="inherit" /> : <ScienceIcon />}
            disabled={salvandoExame}>
            {salvandoExame ? 'Salvando...' : 'Registrar Exame'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Confirmação */}
      <Dialog open={modalConfirm} onClose={() => setModalConfirm(false)} maxWidth="xs" fullWidth>
        <Box sx={{
          background: confirmAcao?.cor === 'error'
            ? 'linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)'
            : 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
          p: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48, border: '2px solid rgba(255,255,255,0.4)' }}>
              {confirmAcao?.cor === 'error'
                ? <CancelIcon sx={{ color: 'white', fontSize: 26 }} />
                : <CheckCircleIcon sx={{ color: 'white', fontSize: 26 }} />}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', lineHeight: 1.2 }}>
                {confirmAcao?.cor === 'error' ? 'Cancelar Consulta' : 'Finalizar Consulta'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>{confirmAcao?.label}</Typography>
            </Box>
          </Box>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            {confirmAcao?.cor === 'error'
              ? 'Tem certeza que deseja cancelar esta consulta? Esta ação não pode ser desfeita.'
              : 'Tem certeza que deseja finalizar esta consulta? O prontuário será encerrado.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setModalConfirm(false)} variant="outlined" fullWidth>Voltar</Button>
          <Button onClick={confirmarAcao} variant="contained" color={confirmAcao?.cor ?? 'primary'} fullWidth
            startIcon={confirmAcao?.cor === 'error' ? <CancelIcon /> : <CheckCircleIcon />}>
            {confirmAcao?.cor === 'error' ? 'Sim, cancelar' : 'Sim, finalizar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}