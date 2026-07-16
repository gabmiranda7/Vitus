import { useEffect, useState, useMemo } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  TextField, Typography, Alert, InputAdornment, Avatar, Card,
  CardContent, IconButton, Tooltip, Chip, MenuItem, Select,
  FormControl, InputLabel, FormControlLabel, Checkbox, Divider, Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import InfoIcon from '@mui/icons-material/Info';
import BadgeIcon from '@mui/icons-material/Badge';
import HomeIcon from '@mui/icons-material/Home';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import FilterListIcon from '@mui/icons-material/FilterList';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { Paciente } from '../../types';

const POR_PAGINA = 12;

const SEXOS = ['Masculino', 'Feminino', 'Outro', 'Prefiro não informar'];
const ESTADOS_CIVIS = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União estável'];
const FAIXAS_ETARIAS = [
  { label: 'Todas', min: 0, max: 999 },
  { label: 'Criança (0–12)', min: 0, max: 12 },
  { label: 'Adolescente (13–17)', min: 13, max: 17 },
  { label: 'Adulto (18–59)', min: 18, max: 59 },
  { label: 'Idoso (60+)', min: 60, max: 999 },
];

function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function corAvatar(nome: string) {
  const cores = ['#1976d2', '#388e3c', '#7b1fa2', '#c62828', '#f57c00', '#0097a7', '#5d4037'];
  return cores[nome.charCodeAt(0) % cores.length];
}

function calcularIdade(dataNascimento?: string): number | null {
  if (!dataNascimento) return null;
  const hoje = new Date();
  const nasc = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

function idadeLabel(dataNascimento?: string): string {
  const idade = calcularIdade(dataNascimento);
  return idade !== null ? `${idade} anos` : '';
}

const campoVazio = () => ({
  nome: '', cpf: '', cartaoSus: '', dataNascimento: '', sexo: '',
  nomePai: '', nomeMae: '', endereco: '', profissao: '',
  estadoCivil: '', informacoesAdicionais: '', aceitaTermos: false,
});

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroSexo, setFiltroSexo] = useState('');
  const [filtroFaixa, setFiltroFaixa] = useState('Todas');
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null);
  const [editando, setEditando] = useState<Paciente | null>(null);
  const [form, setForm] = useState(campoVazio());
  const [erro, setErro] = useState('');

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const r = await api.get('/api/Paciente');
    setPacientes(r.data);
  }

  function setField(campo: string, valor: string | boolean) {
    setForm(f => ({ ...f, [campo]: valor }));
  }

  async function handleSalvar() {
    setErro('');
    if (!form.aceitaTermos && !editando) {
      setErro('O paciente precisa aceitar os termos de uso de dados.');
      return;
    }
    try {
      const payload = {
        nome: form.nome, cpf: form.cpf || null, cartaoSus: form.cartaoSus || null,
        dataNascimento: form.dataNascimento || null, sexo: form.sexo || null,
        nomePai: form.nomePai || null, nomeMae: form.nomeMae || null,
        endereco: form.endereco || null, profissao: form.profissao || null,
        estadoCivil: form.estadoCivil || null,
        informacoesAdicionais: form.informacoesAdicionais || null,
        aceitaTermos: form.aceitaTermos,
      };
      if (editando) await api.put(`/api/Paciente/${editando.id}`, payload);
      else await api.post('/api/Paciente', payload);
      fechar(); carregar();
    } catch (error: any) { setErro(error.mensagemBack ?? 'Erro ao salvar paciente'); }
  }

  async function handleDeletar(id: string) {
    if (!confirm('Deseja excluir este paciente?')) return;
    await api.delete(`/api/Paciente/${id}`);
    carregar();
  }

  function abrirCadastro() { setEditando(null); setForm(campoVazio()); setModalAberto(true); }

  function abrirEdicao(p: Paciente) {
    setEditando(p);
    setForm({
      nome: p.nome, cpf: p.cpf ?? '', cartaoSus: p.cartaoSus ?? '',
      dataNascimento: p.dataNascimento?.substring(0, 10) ?? '',
      sexo: p.sexo ?? '', nomePai: p.nomePai ?? '', nomeMae: p.nomeMae ?? '',
      endereco: p.endereco ?? '', profissao: p.profissao ?? '',
      estadoCivil: p.estadoCivil ?? '',
      informacoesAdicionais: p.informacoesAdicionais ?? '',
      aceitaTermos: p.aceitaTermos,
    });
    setModalAberto(true);
  }

  function abrirDetalhes(p: Paciente) { setPacienteSelecionado(p); setModalDetalhes(true); }

  function formatarCpf(cpf: string): string {
    const s = cpf.replace(/\D/g, '').substring(0, 11);
    if (s.length <= 3) return s;
    if (s.length <= 6) return `${s.slice(0,3)}.${s.slice(3)}`;
    if (s.length <= 9) return `${s.slice(0,3)}.${s.slice(3,6)}.${s.slice(6)}`;
    return `${s.slice(0,3)}.${s.slice(3,6)}.${s.slice(6,9)}-${s.slice(9,11)}`;
  }

  function formatarCartaoSus(sus: string): string {
    const s = sus.replace(/\D/g, '').substring(0, 15);
    if (s.length <= 3) return s;
    if (s.length <= 7) return `${s.slice(0,3)}.${s.slice(3)}`;
    if (s.length <= 11) return `${s.slice(0,3)}.${s.slice(3,7)}.${s.slice(7)}`;
    return `${s.slice(0,3)}.${s.slice(3,7)}.${s.slice(7,11)}.${s.slice(11,15)}`;
  }

  function exibirCpf(cpf?: string): string {
    if (!cpf) return '';
    const s = cpf.replace(/\D/g, '');
    if (s.length === 11) return `${s.slice(0,3)}.${s.slice(3,6)}.${s.slice(6,9)}-${s.slice(9,11)}`;
    return cpf;
  }

  function exibirCartaoSus(sus?: string): string {
    if (!sus) return '';
    const s = sus.replace(/\D/g, '');
    if (s.length === 15) return `${s.slice(0,3)}.${s.slice(3,7)}.${s.slice(7,11)}.${s.slice(11,15)}`;
    return sus;
  }

  function fechar() { setModalAberto(false); setEditando(null); setForm(campoVazio()); setErro(''); }

  const temFiltroAtivo = filtroSexo !== '' || filtroFaixa !== 'Todas';

  function limparFiltros() { setFiltroSexo(''); setFiltroFaixa('Todas'); }

  const filtrados = useMemo(() => {
    setPagina(1);
    const q = busca.toLowerCase();
    const faixa = FAIXAS_ETARIAS.find(f => f.label === filtroFaixa) ?? FAIXAS_ETARIAS[0];

    return pacientes.filter(p => {
      const buscaOk = p.nome.toLowerCase().includes(q) ||
        (p.cpf?.replace(/\D/g, '').includes(busca.replace(/\D/g, '')) && busca.length >= 3);
      const sexoOk = filtroSexo === '' || p.sexo === filtroSexo;
      const idade = calcularIdade(p.dataNascimento ?? undefined);
      const faixaOk = filtroFaixa === 'Todas' || (idade !== null && idade >= faixa.min && idade <= faixa.max);
      return buscaOk && sexoOk && faixaOk;
    });
  }, [pacientes, busca, filtroSexo, filtroFaixa]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Pacientes</Typography>
          <Chip label={pacientes.length} size="small" color="primary" />
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={abrirCadastro} sx={{ borderRadius: 2 }}>
          Novo Paciente
        </Button>
      </Box>

      {/* Barra de busca + botão de filtros */}
      <Box sx={{ display: 'flex', gap: 1, mb: filtrosVisiveis ? 2 : 3 }}>
        <TextField fullWidth placeholder="Buscar paciente por nome ou CPF..."
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
            Filtros {temFiltroAtivo && `(${[filtroSexo, filtroFaixa !== 'Todas' ? filtroFaixa : ''].filter(Boolean).length})`}
          </Button>
        </Tooltip>
      </Box>

      {/* Filtros expandíveis */}
      {filtrosVisiveis && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 160 }} size="small">
              <InputLabel>Sexo</InputLabel>
              <Select value={filtroSexo} label="Sexo" onChange={(e) => setFiltroSexo(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                {SEXOS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel>Faixa etária</InputLabel>
              <Select value={filtroFaixa} label="Faixa etária" onChange={(e) => setFiltroFaixa(e.target.value)}>
                {FAIXAS_ETARIAS.map(f => <MenuItem key={f.label} value={f.label}>{f.label}</MenuItem>)}
              </Select>
            </FormControl>
            {temFiltroAtivo && (
              <Button size="small" variant="outlined" color="error" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
              {filtrados.length} de {pacientes.length} paciente(s)
            </Typography>
          </Box>
        </Paper>
      )}

      {filtrados.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <PersonIcon sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
          <Typography variant="h6" sx={{ opacity: 0.5 }}>
            {busca || temFiltroAtivo ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
          </Typography>
          {temFiltroAtivo && (
            <Button size="small" onClick={limparFiltros} sx={{ mt: 1 }}>Limpar filtros</Button>
          )}
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {paginaAtual.map((p) => (
              <Box key={p.id} sx={{ flex: '1 1 220px', maxWidth: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(25% - 12px)' } }}>
                <Card
                  sx={{ borderRadius: 2, height: '100%', transition: '0.2s', cursor: 'pointer', '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' } }}
                  onClick={() => abrirDetalhes(p)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                      <Avatar sx={{ bgcolor: corAvatar(p.nome), width: 48, height: 48, fontSize: 18, fontWeight: 'bold', flexShrink: 0 }}>
                        {iniciais(p.nome)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.nome}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {idadeLabel(p.dataNascimento ?? undefined) || 'Idade não informada'}
                          {p.sexo ? ` · ${p.sexo}` : ''}
                        </Typography>
                      </Box>
                    </Box>
                    {p.cpf && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        CPF: {p.cpf}
                      </Typography>
                    )}
                    {p.informacoesAdicionais && (
                      <Chip label="⚠️ Info adicional" size="small" color="warning" variant="outlined" sx={{ mt: 0.5, fontSize: 11 }} />
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 1 }} onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Editar">
                        <IconButton size="small" color="primary" onClick={() => abrirEdicao(p)}>
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
              </Box>
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

      {/* Modal de Detalhes */}
      <Dialog open={modalDetalhes} onClose={() => setModalDetalhes(false)} fullWidth maxWidth="sm">
        {pacienteSelecionado && (
          <>
            <Box sx={{ background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)', p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: corAvatar(pacienteSelecionado.nome), width: 60, height: 60, fontSize: 22, fontWeight: 'bold', border: '3px solid rgba(255,255,255,0.4)' }}>
                  {iniciais(pacienteSelecionado.nome)}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', lineHeight: 1.2 }}>
                    {pacienteSelecionado.nome}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
                    {[idadeLabel(pacienteSelecionado.dataNascimento ?? undefined), pacienteSelecionado.sexo, pacienteSelecionado.estadoCivil].filter(Boolean).join(' · ')}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <DialogContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {(pacienteSelecionado.cpf || pacienteSelecionado.cartaoSus || pacienteSelecionado.dataNascimento || pacienteSelecionado.profissao) && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <BadgeIcon fontSize="small" color="primary" />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 11 }}>Identificação</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {[
                        { label: 'CPF', value: exibirCpf(pacienteSelecionado.cpf) },
                        { label: 'Cartão SUS', value: exibirCartaoSus(pacienteSelecionado.cartaoSus) },
                        { label: 'Data de Nascimento', value: pacienteSelecionado.dataNascimento ? new Date(pacienteSelecionado.dataNascimento + 'T00:00:00').toLocaleDateString('pt-BR') : null },
                        { label: 'Profissão', value: pacienteSelecionado.profissao },
                      ].filter(item => item.value).map((item, i, arr) => (
                        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.25, borderBottom: i < arr.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                          <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.value}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {(pacienteSelecionado.nomePai || pacienteSelecionado.nomeMae) && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <FamilyRestroomIcon fontSize="small" color="primary" />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 11 }}>Família</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {[{ label: 'Nome do Pai', value: pacienteSelecionado.nomePai }, { label: 'Nome da Mãe', value: pacienteSelecionado.nomeMae }].filter(item => item.value).map((item, i, arr) => (
                        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.25, borderBottom: i < arr.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                          <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.value}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {pacienteSelecionado.endereco && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <HomeIcon fontSize="small" color="primary" />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 11 }}>Endereço</Typography>
                    </Box>
                    <Typography variant="body2">{pacienteSelecionado.endereco}</Typography>
                  </Box>
                )}

                {pacienteSelecionado.informacoesAdicionais && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <MedicalInformationIcon fontSize="small" color="warning" />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'warning.main', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 11 }}>Informações Médicas Adicionais</Typography>
                    </Box>
                    <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'warning.main' }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'warning.dark' }}>⚠️ {pacienteSelecionado.informacoesAdicionais}</Typography>
                    </Box>
                  </Box>
                )}

                {!pacienteSelecionado.cpf && !pacienteSelecionado.cartaoSus && !pacienteSelecionado.dataNascimento && !pacienteSelecionado.profissao && !pacienteSelecionado.nomePai && !pacienteSelecionado.nomeMae && !pacienteSelecionado.endereco && !pacienteSelecionado.informacoesAdicionais && (
                  <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    <PersonIcon sx={{ fontSize: 48, opacity: 0.2, mb: 1 }} />
                    <Typography variant="body2" sx={{ opacity: 0.5 }}>Nenhuma informação adicional cadastrada</Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2.5, gap: 1, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button onClick={() => setModalDetalhes(false)} variant="outlined">Fechar</Button>
              <Button onClick={() => { setModalDetalhes(false); abrirEdicao(pacienteSelecionado); }} variant="contained" startIcon={<EditIcon />}>Editar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Modal de Cadastro/Edição */}
      <Dialog open={modalAberto} onClose={fechar} fullWidth maxWidth="md">
        <Box sx={{ background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)', p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 52, height: 52, border: '2px solid rgba(255,255,255,0.4)' }}>
              <PersonIcon sx={{ color: 'white', fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>{editando ? 'Editar Paciente' : 'Novo Paciente'}</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>Preencha os dados do paciente</Typography>
            </Box>
          </Box>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PersonIcon fontSize="small" color="primary" />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>Dados Pessoais</Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <TextField label="Nome completo *" value={form.nome} onChange={(e) => setField('nome', e.target.value)} sx={{ flex: '1 1 100%' }} />
            <TextField label="CPF" value={form.cpf} onChange={(e) => setField('cpf', formatarCpf(e.target.value))} placeholder="000.000.000-00" sx={{ flex: '1 1 180px' }} slotProps={{ htmlInput: { maxLength: 14 } }} />
            <TextField label="Cartão SUS" value={form.cartaoSus} onChange={(e) => setField('cartaoSus', formatarCartaoSus(e.target.value))} sx={{ flex: '1 1 180px' }} slotProps={{ htmlInput: { maxLength: 19 } }} />
            <TextField label="Data de Nascimento" type="date" value={form.dataNascimento} onChange={(e) => setField('dataNascimento', e.target.value)} sx={{ flex: '1 1 160px' }} slotProps={{ inputLabel: { shrink: true } }} />
            <FormControl sx={{ flex: '1 1 160px' }}>
              <InputLabel>Sexo</InputLabel>
              <Select value={form.sexo} label="Sexo" onChange={(e) => setField('sexo', e.target.value)}>
                <MenuItem value="">Não informado</MenuItem>
                {SEXOS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl sx={{ flex: '1 1 160px' }}>
              <InputLabel>Estado Civil</InputLabel>
              <Select value={form.estadoCivil} label="Estado Civil" onChange={(e) => setField('estadoCivil', e.target.value)}>
                <MenuItem value="">Não informado</MenuItem>
                {ESTADOS_CIVIS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Profissão" value={form.profissao} onChange={(e) => setField('profissao', e.target.value)} sx={{ flex: '1 1 200px' }} />
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FamilyRestroomIcon fontSize="small" color="primary" />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>Família</Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <TextField label="Nome do Pai" value={form.nomePai} onChange={(e) => setField('nomePai', e.target.value)} sx={{ flex: '1 1 200px' }} />
            <TextField label="Nome da Mãe" value={form.nomeMae} onChange={(e) => setField('nomeMae', e.target.value)} sx={{ flex: '1 1 200px' }} />
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <HomeIcon fontSize="small" color="primary" />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>Endereço</Typography>
          </Box>
          <TextField label="Endereço completo" value={form.endereco} onChange={(e) => setField('endereco', e.target.value)} fullWidth sx={{ mb: 3 }} placeholder="Rua, número, bairro, cidade, estado" />

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <MedicalInformationIcon fontSize="small" color="warning" />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'warning.main', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>Informações Médicas Adicionais</Typography>
          </Box>
          <TextField label="Alergias, condições especiais, observações..." value={form.informacoesAdicionais}
            onChange={(e) => setField('informacoesAdicionais', e.target.value)}
            fullWidth multiline rows={3} sx={{ mb: 3 }}
            placeholder="Ex: Alergia à Dipirona, hipertenso, membro amputado..." />

          {!editando && (
            <>
              <Divider sx={{ mb: 2 }} />
              <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
                Os dados coletados são utilizados exclusivamente para fins clínicos e de atendimento médico, em conformidade com a LGPD.
              </Alert>
              <FormControlLabel
                control={<Checkbox checked={form.aceitaTermos} onChange={(e) => setField('aceitaTermos', e.target.checked)} color="primary" />}
                label={<Typography variant="body2">O paciente autoriza o uso dos seus dados pessoais e clínicos para fins de atendimento médico, conforme a <strong>Lei Geral de Proteção de Dados (LGPD)</strong>.</Typography>}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={fechar} variant="outlined">Cancelar</Button>
          <Button onClick={handleSalvar} variant="contained" startIcon={<PersonIcon />}>
            {editando ? 'Salvar Alterações' : 'Cadastrar Paciente'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}