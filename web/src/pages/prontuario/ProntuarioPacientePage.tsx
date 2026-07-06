import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Chip, Paper, Typography,
  Alert, useTheme, Avatar, Button, Collapse, Divider,
  TextField, MenuItem, Select, FormControl, InputLabel,
  IconButton, CircularProgress
} from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import MedicationIcon from '@mui/icons-material/Medication';
import PersonIcon from '@mui/icons-material/Person';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import EventNoteIcon from '@mui/icons-material/EventNote';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import BadgeIcon from '@mui/icons-material/Badge';
import ScienceIcon from '@mui/icons-material/Science';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Prontuario, Receita, Triagem, Consulta, Paciente, Exame } from '../../types';

const CATEGORIAS = ['Sangue', 'Imagem', 'Urina', 'Cardiologico', 'Fisico', 'Outro'];

const categoriaLabel: Record<string, string> = {
  Sangue: 'Sangue', Imagem: 'Imagem', Urina: 'Urina',
  Cardiologico: 'Cardiológico', Fisico: 'Físico', Outro: 'Outro',
};

const categoriaCor: Record<string, string> = {
  Sangue: '#c62828', Imagem: '#1565c0', Urina: '#f57c00',
  Cardiologico: '#ad1457', Fisico: '#2e7d32', Outro: '#546e7a',
};

const statusCores: Record<string, string> = {
  Agendada: '#1976d2', EmTriagem: '#ed6c02', AguardandoAtendimento: '#0288d1',
  EmAtendimento: '#7b1fa2', Finalizada: '#2e7d32', Cancelada: '#d32f2f',
};

const statusLabels: Record<string, string> = {
  Agendada: 'Agendada', EmTriagem: 'Em Triagem',
  AguardandoAtendimento: 'Aguardando', EmAtendimento: 'Em Atendimento',
  Finalizada: 'Finalizada', Cancelada: 'Cancelada',
};

function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function dataChave(data: string) {
  return new Date(data).toLocaleDateString('pt-BR');
}

function horaFormatada(data: string) {
  return new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function calcularIdade(dataNascimento?: string): string {
  if (!dataNascimento) return '';
  const hoje = new Date();
  const nasc = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return `${idade} anos`;
}

interface ConsultaAgrupada {
  consulta: Consulta;
  triagem?: Triagem;
  receitas: Receita[];
}

interface GrupoDia {
  chave: string;
  consultas: ConsultaAgrupada[];
}

function agruparPorDia(
  consultas: Consulta[],
  triagens: Triagem[],
  receitas: Receita[]
): GrupoDia[] {
  const triagemPorConsulta = new Map<string, Triagem>(
    triagens.map(t => [t.consultaId, t])
  );
  const receitasPorConsulta = receitas.reduce((acc, r) => {
    acc.set(r.consultaId, [...(acc.get(r.consultaId) ?? []), r]);
    return acc;
  }, new Map<string, Receita[]>());

  const porDia = new Map<string, ConsultaAgrupada[]>();
  const consultasOrdenadas = [...consultas].sort(
    (a, b) => new Date(a.dataConsulta).getTime() - new Date(b.dataConsulta).getTime()
  );

  for (const c of consultasOrdenadas) {
    const chave = dataChave(c.dataConsulta);
    if (!porDia.has(chave)) porDia.set(chave, []);
    porDia.get(chave)!.push({
      consulta: c,
      triagem: triagemPorConsulta.get(c.id),
      receitas: receitasPorConsulta.get(c.id) ?? [],
    });
  }

  return Array.from(porDia.entries())
    .map(([chave, consultas]) => ({ chave, consultas }))
    .sort((a, b) => {
      const parse = (s: string) => {
        const [d, m, y] = s.split('/').map(Number);
        return new Date(y, m - 1, d).getTime();
      };
      return parse(b.chave) - parse(a.chave);
    });
}

const exameVazio = () => ({
  categoria: 'Sangue',
  nome: '',
  descricao: '',
  medicoSolicitante: '',
  dataExame: new Date().toISOString().split('T')[0],
  observacoes: '',
});

export default function ProntuarioPacientePage(): React.ReactElement {
  const { pacienteId } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const isMedico = usuario?.perfil === 'Medico';
  const [prontuario, setProntuario] = useState<Prontuario | null>(null);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [exames, setExames] = useState<Exame[]>([]);
  const [erro, setErro] = useState('');
  const [examesAberto, setExamesAberto] = useState(false);
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [form, setForm] = useState(exameVazio());
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState('');
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const theme = useTheme();

  const isDark = theme.palette.mode === 'dark';
  const paperBg = isDark ? theme.palette.grey[900] : theme.palette.background.paper;
  const timelineBg = isDark ? theme.palette.grey[800] : '#f8faff';
  const timelineBorder = isDark ? theme.palette.grey[700] : '#e3eaf5';
  const diaBg = isDark ? theme.palette.grey[900] : '#f0f4ff';

  useEffect(() => { if (pacienteId) carregar(); }, [pacienteId]);

  async function carregar() {
    try {
      const rProntuario = await api.get(`/api/prontuarios/paciente/${pacienteId}`);
      setProntuario(rProntuario.data);
      const pacienteIdDoProntuario = rProntuario.data.pacienteId;
      if (pacienteIdDoProntuario) {
        const rPaciente = await api.get(`/api/Paciente/${pacienteIdDoProntuario}`);
        setPaciente(rPaciente.data);
      }
      await carregarExames(rProntuario.data.id);
    } catch { setErro('Erro ao carregar prontuário'); }
  }

  async function carregarExames(prontuarioId: string) {
    try {
      const r = await api.get(`/api/exames/prontuario/${prontuarioId}`);
      setExames(r.data);
    } catch { /* silencioso */ }
  }

  async function handleSalvarExame() {
    if (!form.nome.trim()) return setErroForm('Nome é obrigatório');
    if (!form.medicoSolicitante.trim()) return setErroForm('Médico solicitante é obrigatório');
    if (!prontuario) return;

    setSalvando(true);
    setErroForm('');
    try {
      await api.post('/api/exames', {
        prontuarioId: prontuario.id,
        consultaId: null,
        categoria: form.categoria,
        nome: form.nome,
        descricao: form.descricao || null,
        medicoSolicitante: form.medicoSolicitante,
        dataExame: form.dataExame,
        observacoes: form.observacoes || null,
      });
      setForm(exameVazio());
      setFormularioAberto(false);
      await carregarExames(prontuario.id);
    } catch (error: any) {
      setErroForm(error.mensagemBack ?? 'Erro ao salvar exame');
    } finally {
      setSalvando(false);
    }
  }

  async function handleUpload(exameId: string, arquivo: File) {
    setUploadingId(exameId);
    try {
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      await api.post(`/api/exames/${exameId}/arquivo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await carregarExames(prontuario!.id);
    } catch (error: any) {
      setErro(error.mensagemBack ?? 'Erro ao enviar arquivo');
    } finally {
      setUploadingId(null);
    }
  }

  async function handleDownload(exame: Exame) {
    try {
      const r = await api.get(`/api/exames/${exame.id}/arquivo`, { responseType: 'blob' });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = exame.nomeArquivoOriginal ?? 'exame';
      a.click();
      URL.revokeObjectURL(url);
    } catch { setErro('Erro ao baixar arquivo'); }
  }

  if (erro) return <Layout><Alert severity="error">{erro}</Alert></Layout>;
  if (!prontuario) return <Layout><Typography color="text.secondary">Carregando...</Typography></Layout>;

  const nomePaciente = paciente?.nome ?? prontuario.consultas?.[0]?.nomePaciente ?? 'Paciente';
  const grupos = agruparPorDia(prontuario.consultas, prontuario.triagens, prontuario.receitas);

  return (
    <Layout>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/prontuarios')} variant="outlined" size="small">
          Voltar
        </Button>
      </Box>

      {/* Card do paciente */}
      <Card sx={{ mb: 3, borderRadius: 3, background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 64, height: 64, border: '2px solid rgba(255,255,255,0.4)', flexShrink: 0 }}>
              <PersonIcon sx={{ color: 'white', fontSize: 34 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, mb: 0.5 }}>{nomePaciente}</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1.5 }}>
                {[
                  { icon: <EventNoteIcon sx={{ fontSize: 16 }} />, label: `${prontuario.consultas.length} consulta(s)` },
                  { icon: <MonitorHeartIcon sx={{ fontSize: 16 }} />, label: `${prontuario.triagens.length} triagem(ns)` },
                  { icon: <MedicationIcon sx={{ fontSize: 16 }} />, label: `${prontuario.receitas.length} receita(s)` },
                  { icon: <ScienceIcon sx={{ fontSize: 16 }} />, label: `${exames.length} exame(s)` },
                ].map((item, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ color: 'rgba(255,255,255,0.7)' }}>{item.icon}</Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>{item.label}</Typography>
                  </Box>
                ))}
              </Box>
              {paciente && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {paciente.dataNascimento && (
                    <Chip icon={<PersonIcon sx={{ fontSize: 14, color: 'white !important' }} />}
                      label={`${calcularIdade(paciente.dataNascimento)}${paciente.sexo ? ` · ${paciente.sexo}` : ''}`}
                      size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 11 }} />
                  )}
                  {paciente.cpf && (
                    <Chip icon={<BadgeIcon sx={{ fontSize: 14, color: 'white !important' }} />}
                      label={`CPF: ${paciente.cpf}`} size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 11 }} />
                  )}
                  {paciente.cartaoSus && (
                    <Chip label={`SUS: ${paciente.cartaoSus}`} size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 11 }} />
                  )}
                </Box>
              )}
            </Box>
          </Box>
          {paciente?.informacoesAdicionais && (
            <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,152,0,0.25)', border: '1px solid rgba(255,152,0,0.5)', display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <MedicalInformationIcon sx={{ color: '#ffb74d', fontSize: 18, mt: 0.2, flexShrink: 0 }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#ffb74d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>
                  Informações Médicas Adicionais
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.25 }}>
                  {paciente.informacoesAdicionais}
                </Typography>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Seção de Exames */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box
            sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            onClick={() => setExamesAberto(v => !v)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScienceIcon color="primary" fontSize="small" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Exames</Typography>
              <Chip label={exames.length} size="small" color="primary" />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isMedico && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={e => { e.stopPropagation(); setExamesAberto(true); setFormularioAberto(v => !v); }}
                >
                  Adicionar
                </Button>
              )}
              <IconButton size="small">
                {examesAberto ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
          </Box>

          <Collapse in={examesAberto}>
            <Divider />

            {isMedico && (
              <Collapse in={formularioAberto}>
                <Box sx={{ p: 2.5, bgcolor: isDark ? 'grey.900' : '#f8faff', borderBottom: `1px solid ${timelineBorder}` }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
                    Novo Exame
                  </Typography>
                  {erroForm && <Alert severity="error" sx={{ mb: 2 }}>{erroForm}</Alert>}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <FormControl sx={{ flex: '1 1 160px' }} size="small">
                      <InputLabel>Categoria</InputLabel>
                      <Select
                        value={form.categoria}
                        label="Categoria"
                        onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                      >
                        {CATEGORIAS.map(c => <MenuItem key={c} value={c}>{categoriaLabel[c]}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <TextField label="Nome do exame *" size="small" value={form.nome}
                      onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} sx={{ flex: '2 1 200px' }} />
                    <TextField label="Médico solicitante *" size="small" value={form.medicoSolicitante}
                      onChange={e => setForm(f => ({ ...f, medicoSolicitante: e.target.value }))} sx={{ flex: '2 1 200px' }} />
                    <TextField label="Data do exame" type="date" size="small" value={form.dataExame}
                      onChange={e => setForm(f => ({ ...f, dataExame: e.target.value }))}
                      sx={{ flex: '1 1 160px' }} slotProps={{ inputLabel: { shrink: true } }} />
                    <TextField label="Descrição" size="small" value={form.descricao}
                      onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} sx={{ flex: '1 1 100%' }} />
                    <TextField label="Observações / valores relevantes" size="small" multiline rows={2}
                      value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                      sx={{ flex: '1 1 100%' }} placeholder="Ex: Glicose: 95 mg/dL; Colesterol: 180 mg/dL" />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'flex-end' }}>
                    <Button size="small" variant="outlined" onClick={() => { setFormularioAberto(false); setErroForm(''); }}>
                      Cancelar
                    </Button>
                    <Button size="small" variant="contained" onClick={handleSalvarExame} disabled={salvando}>
                      {salvando ? <CircularProgress size={16} /> : 'Salvar'}
                    </Button>
                  </Box>
                </Box>
              </Collapse>
            )}

            <Box sx={{ p: 2.5 }}>
              {exames.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <ScienceIcon sx={{ fontSize: 40, opacity: 0.15, mb: 1 }} />
                  <Typography variant="body2" sx={{ opacity: 0.5 }}>Nenhum exame registrado</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {exames.map(exame => (
                    <Paper key={exame.id} variant="outlined" sx={{
                      p: 2, borderRadius: 2,
                      borderLeft: `4px solid ${categoriaCor[exame.categoria] ?? '#546e7a'}`,
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Chip label={categoriaLabel[exame.categoria] ?? exame.categoria} size="small"
                              sx={{ bgcolor: categoriaCor[exame.categoria] ?? '#546e7a', color: 'white', fontWeight: 600, fontSize: 11 }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{exame.nome}</Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(exame.dataExame + 'T00:00:00').toLocaleDateString('pt-BR')} · Dr(a). {exame.medicoSolicitante}
                          </Typography>
                          {exame.descricao && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{exame.descricao}</Typography>
                          )}
                          {exame.observacoes && (
                            <Box sx={{ mt: 1, p: 1, bgcolor: isDark ? 'grey.800' : '#f5f5f5', borderRadius: 1 }}>
                              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{exame.observacoes}</Typography>
                            </Box>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, alignItems: 'center' }}>
                          {exame.temArquivo ? (
                            <Button size="small" variant="outlined" color="success"
                              startIcon={<DownloadIcon />} onClick={() => handleDownload(exame)}>
                              {exame.nomeArquivoOriginal ?? 'Baixar'}
                            </Button>
                          ) : isMedico ? (
                            <Button size="small" variant="outlined"
                              startIcon={uploadingId === exame.id ? <CircularProgress size={14} /> : <AttachFileIcon />}
                              component="label" disabled={uploadingId === exame.id}>
                              Anexar
                              <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png"
                                onChange={e => { const file = e.target.files?.[0]; if (file) handleUpload(exame.id, file); }} />
                            </Button>
                          ) : null}
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <EventNoteIcon color="primary" fontSize="small" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Histórico de Atendimentos</Typography>
            <Chip label={`${grupos.length} dia(s)`} size="small" color="primary" />
          </Box>

          {grupos.length === 0 ? (
            <Typography color="text.secondary">Nenhum atendimento registrado</Typography>
          ) : (
            <Box sx={{ position: 'relative' }}>
              <Box sx={{ position: 'absolute', left: 19, top: 24, bottom: 0, width: 2, bgcolor: isDark ? 'grey.700' : 'grey.200', zIndex: 0 }} />
              {grupos.map((grupo, grupoIdx) => (
                <Box key={grupo.chave} sx={{ mb: grupoIdx < grupos.length - 1 ? 4 : 0, position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{
                      width: 40, height: 40, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `3px solid ${isDark ? '#1e1e1e' : 'white'}`,
                      boxShadow: '0 0 0 2px #1976d240', zIndex: 2,
                    }}>
                      <EventNoteIcon sx={{ color: 'white', fontSize: 18 }} />
                    </Box>
                    <Box sx={{ flex: 1, px: 2, py: 0.75, bgcolor: diaBg, borderRadius: 2, border: `1px solid ${timelineBorder}` }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>{grupo.chave}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {grupo.consultas.length} consulta(s) · {grupo.consultas.filter(i => i.triagem).length} triagem(ns) · {grupo.consultas.reduce((acc, i) => acc + i.receitas.length, 0)} receita(s)
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ pl: 7, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {grupo.consultas.map(({ consulta: c, triagem: t, receitas }) => {
                      const cor = statusCores[c.status] ?? '#1976d2';
                      return (
                        <Paper key={c.id} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', borderColor: timelineBorder, borderLeft: `4px solid ${cor}` }}>
                          <Box sx={{ p: 2, bgcolor: timelineBg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: '#1565c0', fontSize: 12, fontWeight: 700 }}>
                                {iniciais(c.nomeMedico)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.nomeMedico}</Typography>
                                <Typography variant="caption" color="text.secondary">Consulta às {horaFormatada(c.dataConsulta)}</Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                              <Chip label={statusLabels[c.status] ?? c.status} size="small" sx={{ bgcolor: cor, color: 'white', fontWeight: 600, fontSize: 11 }} />
                              {t && <Chip icon={<MedicalServicesIcon />} label="Triagem" size="small" sx={{ color: '#e65100', borderColor: '#e65100' }} variant="outlined" />}
                              {c.anotacoes && <Chip icon={<EditNoteIcon />} label="Anotações" size="small" color="info" variant="outlined" />}
                              {receitas.length > 0 && <Chip icon={<MedicationIcon />} label={`${receitas.length} receita(s)`} size="small" color="success" variant="outlined" />}
                            </Box>
                          </Box>
                          {t && (
                            <Box sx={{ p: 2, borderTop: `1px solid ${timelineBorder}`, bgcolor: isDark ? '#2d1a00' : '#fffaf5' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                <MedicalServicesIcon sx={{ fontSize: 15, color: '#e65100' }} />
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#e65100', textTransform: 'uppercase', letterSpacing: 0.5 }}>Triagem</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>Por: <strong>{t.nomeEnfermeiro || '—'}</strong></Typography>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 3, mb: t.observacoes ? 1.5 : 0 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                  <FavoriteIcon sx={{ fontSize: 15, color: 'error.main' }} />
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>Pressão</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{t.pressaoArterial}</Typography>
                                  </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                  <ThermostatIcon sx={{ fontSize: 15, color: 'warning.main' }} />
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>Temperatura</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{t.temperatura}°C</Typography>
                                  </Box>
                                </Box>
                              </Box>
                              {t.observacoes && (
                                <Box sx={{ mt: 1.5, p: 1.5, bgcolor: paperBg, borderRadius: 1, borderLeft: '3px solid #e65100' }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>"{t.observacoes}"</Typography>
                                </Box>
                              )}
                            </Box>
                          )}
                          {c.anotacoes && (
                            <Box sx={{ p: 2, borderTop: `1px solid ${timelineBorder}` }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                <EditNoteIcon fontSize="small" color="info" />
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'info.main', textTransform: 'uppercase', letterSpacing: 0.5 }}>Anotações Clínicas</Typography>
                              </Box>
                              <Paper variant="outlined" sx={{ p: 1.5, bgcolor: paperBg, borderRadius: 1 }}>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{c.anotacoes}</Typography>
                              </Paper>
                            </Box>
                          )}
                          {receitas.length > 0 && (
                            <Box sx={{ p: 2, borderTop: `1px solid ${timelineBorder}` }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                                <MedicationIcon fontSize="small" color="success" />
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'success.main', textTransform: 'uppercase', letterSpacing: 0.5 }}>Receitas Prescritas</Typography>
                              </Box>
                              {receitas.map((receita) => (
                                <Box key={receita.id} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                                  {receita.medicamentos.map((m, i) => (
                                    <Box key={i} sx={{ flex: '1 1 180px', maxWidth: { xs: '100%', sm: 'calc(50% - 4px)', md: 'calc(33.33% - 5px)' } }}>
                                      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1, bgcolor: paperBg }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{m.nome}</Typography>
                                        <Typography variant="caption" color="text.secondary">{m.dosagem} · {m.posologia}</Typography>
                                      </Paper>
                                    </Box>
                                  ))}
                                </Box>
                              ))}
                            </Box>
                          )}
                          {!t && !c.anotacoes && receitas.length === 0 && (
                            <Box sx={{ p: 2, borderTop: `1px solid ${timelineBorder}` }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>Nenhuma anotação ou receita registrada.</Typography>
                            </Box>
                          )}
                        </Paper>
                      );
                    })}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}