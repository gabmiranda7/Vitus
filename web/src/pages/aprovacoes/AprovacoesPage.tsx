import { useEffect, useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Chip, Typography, Avatar, Button, Alert,
  Dialog, DialogActions, DialogContent, CircularProgress, LinearProgress,
  TextField, InputAdornment, Snackbar, alpha,
} from '@mui/material';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

interface UsuarioPendente {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  criadoEm?: string;
}

const perfilInfo: Record<string, { label: string; cor: string; Icon: React.ElementType }> = {
  Medico:        { label: 'Médico',        cor: '#1565c0', Icon: MedicalServicesIcon },
  Enfermeiro:    { label: 'Enfermeiro(a)', cor: '#2e7d32', Icon: VaccinesIcon },
  Recepcionista: { label: 'Recepcionista', cor: '#6a1b9a', Icon: SupportAgentIcon },
};

function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

type Acao = 'aprovar' | 'recusar';

export default function AprovacoesPage() {
  const [pendentes, setPendentes] = useState<UsuarioPendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [feedback, setFeedback] = useState('');
  const [busca, setBusca] = useState('');
  const [filtroPerfil, setFiltroPerfil] = useState('');
  const [selecionado, setSelecionado] = useState<UsuarioPendente | null>(null);
  const [acao, setAcao] = useState<Acao | null>(null);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    carregar(true);
    const intervalo = setInterval(() => carregar(false), 60000);
    return () => clearInterval(intervalo);
  }, []);

  async function carregar(mostrarLoading = true) {
    if (mostrarLoading) setLoading(true);
    try {
      const r = await api.get('/api/auth/pendentes');
      setPendentes(r.data);
    } catch (error: any) {
      setErro(error.mensagemBack ?? 'Erro ao carregar cadastros pendentes');
    } finally {
      if (mostrarLoading) setLoading(false);
    }
  }

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase();
    return pendentes.filter(u =>
      (filtroPerfil === '' || u.perfil === filtroPerfil) &&
      (q === '' || u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    );
  }, [pendentes, busca, filtroPerfil]);

  function pedirConfirmacao(usuario: UsuarioPendente, tipo: Acao) {
    setErro('');
    setSelecionado(usuario);
    setAcao(tipo);
  }

  function fecharConfirmacao() {
    if (processando) return;
    setSelecionado(null);
    setAcao(null);
  }

  async function confirmar() {
    if (!selecionado || !acao) return;
    const nomeAlvo = selecionado.nome;
    const tipoAcao = acao;
    setProcessando(true);
    try {
      await api.patch(`/api/auth/${selecionado.id}/${tipoAcao}`);
      setSelecionado(null);
      setAcao(null);
      setFeedback(
        tipoAcao === 'aprovar'
          ? `Cadastro de ${nomeAlvo} aprovado com sucesso.`
          : `Cadastro de ${nomeAlvo} recusado.`
      );
      await carregar(false);
    } catch (error: any) {
      setErro(error.mensagemBack ?? 'Erro ao processar a solicitação');
      setSelecionado(null);
      setAcao(null);
    } finally {
      setProcessando(false);
    }
  }

  const aprovando = acao === 'aprovar';

  return (
    <Layout>
      {loading && (
        <LinearProgress sx={{ position: 'fixed', top: 64, left: 0, right: 0, zIndex: 9999 }} />
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HowToRegIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Aprovação de Cadastros</Typography>
          <Chip label={pendentes.length} size="small" color="warning" />
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={() => carregar(true)}
          disabled={loading}
        >
          Atualizar
        </Button>
      </Box>

      {erro && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro('')}>{erro}</Alert>}

      {pendentes.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Buscar por nome ou e-mail..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            sx={{ flex: '1 1 240px' }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start"><SearchIcon color="action" fontSize="small" /></InputAdornment>
                )
              }
            }}
          />
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            <Chip
              label="Todos"
              size="small"
              color={filtroPerfil === '' ? 'primary' : 'default'}
              onClick={() => setFiltroPerfil('')}
            />
            {Object.entries(perfilInfo).map(([key, info]) => (
              <Chip
                key={key}
                label={info.label}
                size="small"
                color={filtroPerfil === key ? 'primary' : 'default'}
                onClick={() => setFiltroPerfil(filtroPerfil === key ? '' : key)}
              />
            ))}
          </Box>
        </Box>
      )}

      {!loading && pendentes.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, color: 'text.secondary' }}>
          <HowToRegIcon sx={{ fontSize: 72, opacity: 0.15, mb: 2 }} />
          <Typography variant="h6" sx={{ opacity: 0.5 }}>Nenhum cadastro aguardando aprovação</Typography>
          <Typography variant="body2" sx={{ opacity: 0.4, mt: 1 }}>
            Quando alguém criar uma conta, ela aparece aqui para você aprovar ou recusar.
          </Typography>
        </Box>
      ) : !loading && filtrados.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          <Typography variant="body2">Nenhum cadastro pendente corresponde ao filtro aplicado.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {filtrados.map((u) => {
            const info = perfilInfo[u.perfil] ?? { label: u.perfil, cor: '#546e7a', Icon: HowToRegIcon };
            return (
              <Card key={u.id} sx={{ borderRadius: 3, borderLeft: `4px solid ${info.cor}` }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Avatar sx={{ bgcolor: info.cor, width: 48, height: 48, fontWeight: 700 }}>
                      {iniciais(u.nome)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>{u.nome}</Typography>
                      <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75, flexWrap: 'wrap' }}>
                        <Chip
                          icon={<info.Icon sx={{ fontSize: 14, color: `${info.cor} !important` }} />}
                          label={info.label}
                          size="small"
                          sx={{ bgcolor: alpha(info.cor, 0.12), color: info.cor, fontWeight: 600 }}
                        />
                        {u.criadoEm && (
                          <Typography variant="caption" color="text.secondary">
                            Solicitado em {new Date(u.criadoEm).toLocaleDateString('pt-BR')}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined" color="error" startIcon={<CancelIcon />}
                        onClick={() => pedirConfirmacao(u, 'recusar')}
                        sx={{ borderRadius: 2 }}
                      >
                        Recusar
                      </Button>
                      <Button
                        variant="contained" color="success" startIcon={<CheckCircleIcon />}
                        onClick={() => pedirConfirmacao(u, 'aprovar')}
                        sx={{ borderRadius: 2 }}
                      >
                        Aprovar
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      <Dialog open={!!selecionado} onClose={fecharConfirmacao} maxWidth="xs" fullWidth>
        <Box sx={{
          background: aprovando
            ? 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)'
            : 'linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)',
          p: 3,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48, border: '2px solid rgba(255,255,255,0.4)' }}>
              {aprovando
                ? <CheckCircleIcon sx={{ color: 'white', fontSize: 26 }} />
                : <CancelIcon sx={{ color: 'white', fontSize: 26 }} />}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', lineHeight: 1.2 }}>
                {aprovando ? 'Aprovar cadastro' : 'Recusar cadastro'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                {selecionado?.nome}
              </Typography>
            </Box>
          </Box>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            {aprovando
              ? 'Depois de aprovado, o usuário poderá entrar no sistema com o email e a senha que cadastrou.'
              : 'O usuário não conseguirá entrar no sistema e verá que o cadastro não foi aprovado.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={fecharConfirmacao} variant="outlined" fullWidth disabled={processando}>Voltar</Button>
          <Button
            onClick={confirmar} variant="contained" fullWidth disabled={processando}
            color={aprovando ? 'success' : 'error'}
            startIcon={processando
              ? <CircularProgress size={16} color="inherit" />
              : aprovando ? <CheckCircleIcon /> : <CancelIcon />}
          >
            {aprovando ? 'Sim, aprovar' : 'Sim, recusar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!feedback}
        autoHideDuration={4000}
        onClose={() => setFeedback('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setFeedback('')}>
          {feedback}
        </Alert>
      </Snackbar>
    </Layout>
  );
}