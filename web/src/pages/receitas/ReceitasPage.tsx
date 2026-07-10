import { useEffect, useState, useMemo } from 'react';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent,
  Divider, FormControl, IconButton, InputLabel, MenuItem, Select,
  TextField, Typography, Alert, Card, CardContent,
  Avatar, InputAdornment, Paper, CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MedicationIcon from '@mui/icons-material/Medication';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PersonIcon from '@mui/icons-material/Person';
import DownloadIcon from '@mui/icons-material/Download';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { Consulta, Medicamento, Paciente, Prontuario } from '../../types';

const POR_PAGINA = 12;

function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function corAvatar(nome: string) {
  const cores = ['#1976d2', '#388e3c', '#7b1fa2', '#c62828', '#f57c00', '#0097a7'];
  return cores[nome.charCodeAt(0) % cores.length];
}

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

export default function ReceitasPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [consultasAtivas, setConsultasAtivas] = useState<Consulta[]>([]);
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null);
  const [prontuario, setProntuario] = useState<Prontuario | null>(null);
  const [loadingProntuario, setLoadingProntuario] = useState(false);
  const [erroProntuario, setErroProntuario] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [consultaId, setConsultaId] = useState('');
  const [tipoReceita, setTipoReceita] = useState('Comum');
  const [tipoUso, setTipoUso] = useState('Oral');
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([medVazio()]);
  const [erro, setErro] = useState('');
  const [gerando, setGerando] = useState(false);

  useEffect(() => { carregar(); }, []);

  useEffect(() => {
    if (consultasAtivas.length > 0) {
      setConsultaId(prev =>
        prev && consultasAtivas.some(c => c.id === prev) ? prev : consultasAtivas[0].id
      );
    }
  }, [consultasAtivas]);

  async function carregar() {
    const [rPacientes, rConsultas] = await Promise.all([
      api.get('/api/Paciente'),
      api.get('/api/consultas'),
    ]);
    setPacientes(rPacientes.data);
    setConsultasAtivas(rConsultas.data.filter((c: Consulta) => c.status === 'EmAtendimento'));
  }

  async function abrirPaciente(p: Paciente) {
    setPacienteSelecionado(p);
    setProntuario(null);
    setErroProntuario('');
    setLoadingProntuario(true);
    try {
      const r = await api.get(`/api/prontuarios/paciente/${p.id}`);
      setProntuario(r.data);
    } catch {
      setErroProntuario('Não foi possível carregar as receitas deste paciente.');
    } finally {
      setLoadingProntuario(false);
    }
  }

  function voltar() {
    setPacienteSelecionado(null);
    setProntuario(null);
    setErroProntuario('');
  }

  function addMed() { setMedicamentos([...medicamentos, medVazio()]); }
  function removeMed(i: number) { setMedicamentos(medicamentos.filter((_, idx) => idx !== i)); }
  function changeMed(i: number, campo: keyof Medicamento, valor: string) {
    const novos = [...medicamentos]; novos[i][campo] = valor; setMedicamentos(novos);
  }

  async function handleGerar() {
    setErro('');
    if (!consultaId) return setErro('Selecione uma consulta');
    if (medicamentos.some(m => !m.nome.trim())) return setErro('Preencha o nome de todos os medicamentos');

    setGerando(true);
    try {
      const r = await api.post('/api/receitas/gerar', {
        consultaId,
        tipoReceita,
        tipoUso,
        medicamentos,
      }, { responseType: 'blob' });

      const contentDisposition = r.headers['content-disposition'] ?? '';
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      const nomeArquivo = match ? match[1].replace(/['"]/g, '') : `Receita_${tipoReceita}.docx`;

      const url = URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = nomeArquivo;
      a.click();
      URL.revokeObjectURL(url);

      fechar();
      carregar();
      if (pacienteSelecionado) await abrirPaciente(pacienteSelecionado);
    } catch (error: any) {
      let mensagem = 'Erro ao gerar receita';
      if (error.response?.data instanceof Blob) {
        const texto = await error.response.data.text();
        try {
          const json = JSON.parse(texto);
          mensagem = json.Messages?.[0] ?? json.mensagem ?? json.title ?? mensagem;
        } catch { mensagem = texto; }
      } else {
        mensagem = error.response?.data?.mensagem ?? mensagem;
      }
      setErro(mensagem);
    } finally {
      setGerando(false);
    }
  }

  function fechar() {
    setModalAberto(false);
    setTipoReceita('Comum');
    setTipoUso('Oral');
    setMedicamentos([medVazio()]);
    setErro('');
  }

  const filtrados = useMemo(() => {
    setPagina(1);
    const q = busca.toLowerCase();
    return pacientes.filter(p =>
      p.nome.toLowerCase().includes(q) ||
      (p.cpf?.replace(/\D/g, '').includes(busca.replace(/\D/g, '')) && busca.length >= 3)
    );
  }, [pacientes, busca]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const receitas = prontuario?.receitas ?? [];

  const modalReceita = (
    <Dialog open={modalAberto} onClose={fechar} fullWidth maxWidth="md">
      <Box sx={{ background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)', p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 52, height: 52, border: '2px solid rgba(255,255,255,0.4)' }}>
            <MedicationIcon sx={{ color: 'white', fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>Nova Receita</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              O documento Word será gerado automaticamente
            </Typography>
          </Box>
        </Box>
      </Box>
      <DialogContent sx={{ pt: 3 }}>
        {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

        <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
          <InputLabel>Consulta</InputLabel>
          <Select value={consultaId} label="Consulta" onChange={(e) => setConsultaId(e.target.value)}>
            {consultasAtivas.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.nomePaciente} — {c.nomeMedico}</MenuItem>
            ))}
          </Select>
        </FormControl>

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
          <Alert severity="info" sx={{ mb: 2 }}>
            Receita especial — será gerado um documento com 2 vias para impressão.
          </Alert>
        )}

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
                <IconButton size="small" color="error" onClick={() => removeMed(i)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <TextField label="Nome" value={med.nome}
                onChange={(e) => changeMed(i, 'nome', e.target.value)}
                sx={{ flex: '2 1 160px' }} size="small" />
              <TextField label="Dosagem" value={med.dosagem}
                onChange={(e) => changeMed(i, 'dosagem', e.target.value)}
                sx={{ flex: '1 1 80px' }} size="small" placeholder="ex: 50mg" />
              <TextField label="Quantidade" value={med.quantidade}
                onChange={(e) => changeMed(i, 'quantidade', e.target.value)}
                sx={{ flex: '1 1 80px' }} size="small" placeholder="ex: 60 cps." />
              <TextField label="Posologia" value={med.posologia}
                onChange={(e) => changeMed(i, 'posologia', e.target.value)}
                sx={{ flex: '2 1 160px' }} size="small" placeholder="ex: 1 cp. ao dia" />
            </Box>
          </Paper>
        ))}
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={fechar} variant="outlined" disabled={gerando}>Cancelar</Button>
        <Button onClick={handleGerar} variant="contained"
          startIcon={gerando ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
          disabled={gerando}>
          {gerando ? 'Gerando...' : 'Gerar e Baixar Receita'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (pacienteSelecionado) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={voltar} variant="outlined" size="small">
              Voltar
            </Button>
            <Avatar sx={{ bgcolor: corAvatar(pacienteSelecionado.nome), width: 36, height: 36, fontSize: 13, fontWeight: 700 }}>
              {iniciais(pacienteSelecionado.nome)}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{pacienteSelecionado.nome}</Typography>
              <Typography variant="caption" color="text.secondary">Histórico de receitas</Typography>
            </Box>
          </Box>
          {consultasAtivas.length > 0 && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalAberto(true)} sx={{ borderRadius: 2 }}>
              Nova Receita
            </Button>
          )}
        </Box>

        {loadingProntuario && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {erroProntuario && <Alert severity="error">{erroProntuario}</Alert>}

        {!loadingProntuario && !erroProntuario && receitas.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 10, color: 'text.secondary' }}>
            <MedicationIcon sx={{ fontSize: 64, opacity: 0.15, mb: 2 }} />
            <Typography variant="h6" sx={{ opacity: 0.4 }}>Nenhuma receita registrada</Typography>
            <Typography variant="body2" sx={{ opacity: 0.3, mt: 0.5 }}>
              As receitas aparecem aqui após serem emitidas em uma consulta
            </Typography>
          </Box>
        )}

        {!loadingProntuario && receitas.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {receitas.map((receita) => {
              const consulta = prontuario?.consultas.find(c => c.id === receita.consultaId);
              return (
                <Card key={receita.id} sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MedicationIcon color="success" fontSize="small" />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {consulta
                            ? `Consulta de ${new Date(consulta.dataConsulta).toLocaleDateString('pt-BR')} · ${consulta.nomeMedico}`
                            : 'Receita'}
                        </Typography>
                      </Box>
                      <Chip label={`${receita.medicamentos.length} medicamento(s)`} size="small" color="success" variant="outlined" />
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                      {receita.medicamentos.map((m, i) => (
                        <Paper key={i} variant="outlined" sx={{
                          p: 1.5, borderRadius: 2, flex: '1 1 180px',
                          maxWidth: { xs: '100%', sm: 'calc(50% - 6px)', md: 'calc(33.33% - 8px)' },
                          borderLeft: '3px solid #2e7d32',
                        }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{m.nome}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {m.dosagem && `${m.dosagem} · `}{m.posologia}
                          </Typography>
                        </Paper>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}

        {modalReceita}
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MedicationIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Receitas</Typography>
          <Chip label={pacientes.length} size="small" color="primary" />
        </Box>
        {consultasAtivas.length > 0 && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalAberto(true)} sx={{ borderRadius: 2 }}>
            Nova Receita
          </Button>
        )}
      </Box>

      <TextField fullWidth placeholder="Buscar paciente por nome ou CPF..."
        value={busca} onChange={(e) => setBusca(e.target.value)} sx={{ mb: 3 }}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> } }}
      />

      {filtrados.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <PersonIcon sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
          <Typography variant="h6" sx={{ opacity: 0.5 }}>
            {busca ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {paginaAtual.map((p) => (
              <Card key={p.id}
                sx={{ borderRadius: 2, cursor: 'pointer', transition: '0.2s', '&:hover': { boxShadow: 4, transform: 'translateY(-1px)' } }}
                onClick={() => abrirPaciente(p)}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: corAvatar(p.nome), width: 48, height: 48, fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                      {iniciais(p.nome)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{p.nome}</Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 0.25 }}>
                        {p.dataNascimento && (
                          <Typography variant="caption" color="text.secondary">
                            {new Date(p.dataNascimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </Typography>
                        )}
                        {p.cpf && <Typography variant="caption" color="text.secondary">CPF: {p.cpf}</Typography>}
                      </Box>
                    </Box>
                    <Chip icon={<MedicationIcon />} label="Ver receitas" size="small" color="primary" variant="outlined" sx={{ fontSize: 11 }} />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>

          {totalPaginas > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 3 }}>
              <IconButton onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}>
                <NavigateBeforeIcon />
              </IconButton>
              <Typography variant="body2" color="text.secondary">
                Página {pagina} de {totalPaginas} · {filtrados.length} paciente(s)
              </Typography>
              <IconButton onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}>
                <NavigateNextIcon />
              </IconButton>
            </Box>
          )}
        </>
      )}

      {modalReceita}
    </Layout>
  );
}