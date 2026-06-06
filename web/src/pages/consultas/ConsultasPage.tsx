import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, InputLabel, MenuItem, Paper, Select, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
  Alert, Tooltip, Tabs, Tab, Avatar, Divider, InputAdornment
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
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { Consulta, Medico, Paciente } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const statusCores: Record<string, 'default' | 'primary' | 'warning' | 'success' | 'error' | 'info'> = {
  Agendada: 'primary', EmTriagem: 'warning', AguardandoAtendimento: 'info',
  EmAtendimento: 'warning', Finalizada: 'success', Cancelada: 'error',
};

const statusLabels: Record<string, string> = {
  Agendada: 'Agendada', EmTriagem: 'Em Triagem',
  AguardandoAtendimento: 'Aguardando', EmAtendimento: 'Em Atendimento',
  Finalizada: 'Finalizada', Cancelada: 'Cancelada',
};

const statusIcons: Record<string, string> = {
  Agendada: '📅', EmTriagem: '🩺', AguardandoAtendimento: '⏳',
  EmAtendimento: '👨‍⚕️', Finalizada: '✅', Cancelada: '❌',
};

const ordemStatus: Record<string, number> = {
  EmAtendimento: 0, AguardandoAtendimento: 1, EmTriagem: 2, Agendada: 3,
};

const statusAtivos = ['Agendada', 'EmTriagem', 'AguardandoAtendimento', 'EmAtendimento'];
const statusHistorico = ['Finalizada', 'Cancelada'];

function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function corAvatar(nome: string) {
  const cores = ['#1976d2', '#388e3c', '#7b1fa2', '#c62828', '#f57c00', '#0097a7'];
  return cores[nome.charCodeAt(0) % cores.length];
}

export default function ConsultasPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [aba, setAba] = useState(0);
  const [busca, setBusca] = useState('');
  const [modalNova, setModalNova] = useState(false);
  const [modalAnotacao, setModalAnotacao] = useState(false);
  const [modalTriagem, setModalTriagem] = useState(false);
  const [consultaSelecionada, setConsultaSelecionada] = useState<Consulta | null>(null);
  const [pacienteId, setPacienteId] = useState('');
  const [medicoId, setMedicoId] = useState('');
  const [dataConsulta, setDataConsulta] = useState('');
  const [anotacoes, setAnotacoes] = useState('');
  const [pressaoArterial, setPressaoArterial] = useState('');
  const [temperatura, setTemperatura] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [erro, setErro] = useState('');
  const [modalConfirm, setModalConfirm] = useState(false);
  const [confirmAcao, setConfirmAcao] = useState<{
    id: string; acao: string; label: string; cor: 'error' | 'success' | 'warning';
  } | null>(null);

  useEffect(() => {
    carregar();
    if (usuario?.perfil === 'Recepcionista') { carregarPacientes(); carregarMedicos(); }
  }, []);

  async function carregar() { const r = await api.get('/api/consultas'); setConsultas(r.data); }
  async function carregarPacientes() { const r = await api.get('/api/Paciente'); setPacientes(r.data); }
  async function carregarMedicos() { const r = await api.get('/api/medicos'); setMedicos(r.data); }

  async function handleSalvarConsulta() {
    setErro('');
    try {
      const dataUtc = new Date(dataConsulta).toISOString();
      await api.post('/api/consultas', { pacienteId, medicoId, dataConsulta: dataUtc });
      fecharNova(); carregar();
    } catch (error: any) { setErro(error.mensagemBack ?? 'Erro ao agendar consulta'); }
  }

  function pedirConfirmacao(id: string, acao: string, label: string, cor: 'error' | 'success' | 'warning') {
    setConfirmAcao({ id, acao, label, cor });
    setModalConfirm(true);
  }

  async function confirmarAcao() {
    if (!confirmAcao) return;
    await api.patch(`/api/consultas/${confirmAcao.id}/${confirmAcao.acao}`);
    setModalConfirm(false);
    setConfirmAcao(null);
    carregar();
  }

async function handleSalvarAnotacao() {
    if (!consultaSelecionada) return;
    setErro('');
    try {
      await api.patch(`/api/consultas/${consultaSelecionada.id}/anotar`, { anotacoes });
      fecharAnotacao(); carregar();
    } catch (error: any) { setErro(error.mensagemBack ?? 'Erro ao salvar anotação'); }
}

async function handleSalvarTriagem() {
    if (!consultaSelecionada) return;
    setErro('');
    try {
      await api.patch(`/api/consultas/${consultaSelecionada.id}/iniciar-triagem`);
      await api.post('/api/triagens', {
        consultaId: consultaSelecionada.id,
        pressaoArterial, temperatura: parseFloat(temperatura), observacoes,
      });
      await api.patch(`/api/consultas/${consultaSelecionada.id}/aguardar-atendimento`);
      fecharTriagem(); carregar();
    } catch (error: any) { setErro(error.mensagemBack ?? 'Erro ao registrar triagem'); }
}

  function abrirAnotacao(c: Consulta) { setConsultaSelecionada(c); setAnotacoes(c.anotacoes ?? ''); setModalAnotacao(true); }
  function abrirTriagem(c: Consulta) { setConsultaSelecionada(c); setModalTriagem(true); }
  function fecharNova() { setModalNova(false); setPacienteId(''); setMedicoId(''); setDataConsulta(''); setErro(''); }
  function fecharAnotacao() { setModalAnotacao(false); setConsultaSelecionada(null); setAnotacoes(''); setErro(''); }
  function fecharTriagem() { setModalTriagem(false); setConsultaSelecionada(null); setPressaoArterial(''); setTemperatura(''); setObservacoes(''); setErro(''); }

  const podeVerProntuario = usuario?.perfil === 'Medico' || usuario?.perfil === 'Enfermeiro';

  const consultasAtivas = useMemo(() =>
    consultas.filter(c => statusAtivos.includes(c.status))
      .sort((a, b) => (ordemStatus[a.status] ?? 99) - (ordemStatus[b.status] ?? 99)),
    [consultas]
  );

  const consultasHistorico = useMemo(() =>
    consultas.filter(c => statusHistorico.includes(c.status))
      .sort((a, b) => new Date(b.dataConsulta).getTime() - new Date(a.dataConsulta).getTime()),
    [consultas]
  );

  const consultasFiltradas = useMemo(() => {
    const lista = aba === 0 ? consultasAtivas : consultasHistorico;
    if (!busca.trim()) return lista;
    const q = busca.toLowerCase();
    return lista.filter(c =>
      c.nomePaciente.toLowerCase().includes(q) ||
      c.nomeMedico.toLowerCase().includes(q) ||
      new Date(c.dataConsulta).toLocaleDateString('pt-BR').includes(q) ||
      statusLabels[c.status]?.toLowerCase().includes(q)
    );
  }, [aba, consultasAtivas, consultasHistorico, busca]);

  function renderTabela(lista: Consulta[]) {
    return (
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Paciente</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Médico</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Data</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lista.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    <EventNoteIcon sx={{ fontSize: 48, opacity: 0.2, mb: 1, display: 'block', mx: 'auto' }} />
                    <Typography variant="body2">Nenhuma consulta encontrada</Typography>
                  </TableCell>
                </TableRow>
              ) : lista.map((c) => (
                <TableRow key={c.id} hover sx={{ '& td': { py: 1.5 } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 36, height: 36, fontSize: 13, fontWeight: 'bold', bgcolor: corAvatar(c.nomePaciente) }}>
                        {iniciais(c.nomePaciente)}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{c.nomePaciente}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 36, height: 36, fontSize: 13, fontWeight: 'bold', bgcolor: '#1565c0' }}>
                        {iniciais(c.nomeMedico)}
                      </Avatar>
                      <Typography variant="body2">{c.nomeMedico}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{new Date(c.dataConsulta).toLocaleDateString('pt-BR')}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(c.dataConsulta).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${statusIcons[c.status] ?? ''} ${statusLabels[c.status] ?? c.status}`}
                      color={statusCores[c.status] ?? 'default'}
                      size="small" sx={{ fontWeight: 500 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                      {podeVerProntuario && (
                        <Tooltip title="Ver prontuário">
                          <Button size="small" variant="outlined" color="secondary"
                            startIcon={<FolderSharedIcon />}
                            onClick={() => navigate(`/prontuario/${c.id}`)}>
                            Prontuário
                          </Button>
                        </Tooltip>
                      )}
                      {usuario?.perfil === 'Enfermeiro' && c.status === 'Agendada' && (
                        <Button size="small" variant="outlined" color="warning"
                          startIcon={<MedicalServicesIcon />} onClick={() => abrirTriagem(c)}>
                          Iniciar Triagem
                        </Button>
                      )}
                      {usuario?.perfil === 'Enfermeiro' && c.status === 'EmTriagem' && (
                        <Button size="small" variant="outlined"
                          onClick={() => api.patch(`/api/consultas/${c.id}/aguardar-atendimento`).then(carregar)}>
                          Aguardar
                        </Button>
                      )}
                      {usuario?.perfil === 'Medico' && c.status === 'AguardandoAtendimento' && (
                        <Button size="small" variant="contained" color="primary"
                          startIcon={<PersonIcon />}
                          onClick={() => api.patch(`/api/consultas/${c.id}/iniciar-atendimento`).then(carregar)}>
                          Iniciar
                        </Button>
                      )}
                      {usuario?.perfil === 'Medico' && c.status === 'EmAtendimento' && (
                        <>
                          <Button size="small" variant="outlined" color="info"
                            startIcon={<EditNoteIcon />} onClick={() => abrirAnotacao(c)}>
                            Anotar
                          </Button>
                          <Button size="small" variant="contained" color="success"
                            onClick={() => pedirConfirmacao(c.id, 'finalizar', `Finalizar consulta de ${c.nomePaciente}?`, 'success')}>
                            Finalizar
                          </Button>
                        </>
                      )}
                      {(['Recepcionista', 'Medico'].includes(usuario?.perfil ?? '')) &&
                        !['Finalizada', 'Cancelada'].includes(c.status) && (
                          <Button size="small" variant="outlined" color="error"
                            onClick={() => pedirConfirmacao(c.id, 'cancelar', `Cancelar consulta de ${c.nomePaciente}?`, 'error')}>
                            Cancelar
                          </Button>
                        )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
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
        <Tabs value={aba} onChange={(_, v) => { setAba(v); setBusca(''); }}>
          <Tab label={`Ativas (${consultasAtivas.length})`} />
          <Tab label={`Histórico (${consultasHistorico.length})`} />
        </Tabs>
      </Box>

      <TextField fullWidth
        placeholder="Buscar por paciente, médico, data ou status..."
        value={busca} onChange={(e) => setBusca(e.target.value)} sx={{ mb: 2 }}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> } }}
      />

      {renderTabela(consultasFiltradas)}

      {/* Modal Nova Consulta */}
      <Dialog open={modalNova} onClose={fecharNova} fullWidth maxWidth="sm">
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EventNoteIcon /> Nova Consulta
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
          <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
            <InputLabel>Paciente</InputLabel>
            <Select value={pacienteId} label="Paciente" onChange={(e) => setPacienteId(e.target.value)}>
              {pacientes.map((p) => <MenuItem key={p.id} value={p.id}>{p.nome}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Médico</InputLabel>
            <Select value={medicoId} label="Médico" onChange={(e) => setMedicoId(e.target.value)}>
              {medicos.map((m) => <MenuItem key={m.id} value={m.id}>{m.nome} — {m.especialidade}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Data da Consulta" type="datetime-local" fullWidth
            value={dataConsulta} onChange={(e) => setDataConsulta(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={fecharNova} variant="outlined">Cancelar</Button>
          <Button onClick={handleSalvarConsulta} variant="contained">Agendar</Button>
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
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>{consultaSelecionada?.nomePaciente}</Typography>
            </Box>
          </Box>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>
            Sinais Vitais
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <TextField label="Pressão Arterial" fullWidth value={pressaoArterial}
                onChange={(e) => setPressaoArterial(e.target.value)} placeholder="ex: 120/80"
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><FavoriteIcon sx={{ fontSize: 18, color: 'error.main' }} /></InputAdornment> } }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField label="Temperatura (°C)" type="number" fullWidth value={temperatura}
                onChange={(e) => setTemperatura(e.target.value)} placeholder="ex: 36.5"
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><ThermostatIcon sx={{ fontSize: 18, color: 'warning.main' }} /></InputAdornment> } }} />
            </Box>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>
            Observações
          </Typography>
          <TextField label="Queixa principal / observações" fullWidth multiline rows={4}
            value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Descreva a queixa principal do paciente, sintomas relatados, etc." />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={fecharTriagem} variant="outlined" fullWidth>Cancelar</Button>
          <Button onClick={handleSalvarTriagem} variant="contained" color="warning" fullWidth startIcon={<MedicalServicesIcon />}>
            Registrar Triagem
          </Button>
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
                {consultaSelecionada?.nomePaciente} · {consultaSelecionada && new Date(consultaSelecionada.dataConsulta).toLocaleDateString('pt-BR')}
              </Typography>
            </Box>
            <Box sx={{ ml: 'auto' }}>
              <Chip label={`👨‍⚕️ ${consultaSelecionada?.nomeMedico}`}
                sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 500 }} size="small" />
            </Box>
          </Box>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
          <Alert severity="info" sx={{ mb: 2 }} icon={<MonitorHeartIcon />}>
            As anotações ficam vinculadas ao prontuário e visíveis para médicos e enfermeiros.
          </Alert>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>
            Registro Clínico
          </Typography>
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
          <Button onClick={handleSalvarAnotacao} variant="contained" color="info" startIcon={<EditNoteIcon />}>
            Salvar Anotação
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Confirmação */}
      <Dialog open={modalConfirm} onClose={() => setModalConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{
          bgcolor: confirmAcao?.cor === 'error' ? 'error.main' : 'success.main',
          color: 'white'
        }}>
          {confirmAcao?.cor === 'error' ? '⚠️ Confirmar Cancelamento' : '✅ Confirmar Finalização'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1">{confirmAcao?.label}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {confirmAcao?.cor === 'error'
              ? 'Esta ação não pode ser desfeita. A consulta será marcada como cancelada.'
              : 'A consulta será marcada como finalizada e o prontuário será encerrado.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setModalConfirm(false)} variant="outlined" fullWidth>
            Voltar
          </Button>
          <Button
            onClick={confirmarAcao}
            variant="contained"
            color={confirmAcao?.cor ?? 'primary'}
            fullWidth
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}