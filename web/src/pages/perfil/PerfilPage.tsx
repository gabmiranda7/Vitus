import { useRef, useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Alert,
  Chip, Divider, CircularProgress, IconButton, Dialog, DialogActions,
  DialogContent, alpha,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import Layout from '../../components/layout/Layout';
import AvatarUsuario from '../../components/layout/AvatarUsuario';
import CortarFotoDialog from '../../components/perfil/CortarFotoDialog';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const perfilLabels: Record<string, string> = {
  Medico: 'Médico', Enfermeiro: 'Enfermeiro(a)',
  Recepcionista: 'Recepcionista', Administrador: 'Administrador',
};

const perfilCores: Record<string, string> = {
  Medico: '#1565c0', Enfermeiro: '#2e7d32',
  Recepcionista: '#6a1b9a', Administrador: '#37474f',
};

const TAMANHO_MAXIMO_ORIGINAL = 10 * 1024 * 1024;

export default function PerfilPage() {
  const { usuario, atualizarUsuario, recarregarFoto } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [arquivoParaCortar, setArquivoParaCortar] = useState<File | null>(null);
  const [confirmarRemocao, setConfirmarRemocao] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const cor = perfilCores[usuario?.perfil ?? ''] ?? '#1976d2';
  const nomeAlterado = nome.trim() !== '' && nome.trim() !== usuario?.nome;

  async function handleSalvarNome() {
    setErro('');
    setSucesso('');
    if (!nome.trim()) return setErro('Nome é obrigatório');

    setSalvando(true);
    try {
      const r = await api.put('/api/auth/me', { nome: nome.trim() });
      atualizarUsuario({
        token: r.data.token,
        nome: r.data.nome,
        medicoId: r.data.medicoId ?? undefined,
        temFoto: r.data.temFoto,
      });
      setNome(r.data.nome);
      setSucesso('Nome atualizado com sucesso');
    } catch (error: any) {
      setErro(error.mensagemBack ?? 'Erro ao atualizar o nome');
    } finally {
      setSalvando(false);
    }
  }

  function handleEscolherArquivo(arquivo: File) {
    setErro('');
    setSucesso('');

    const extensao = '.' + arquivo.name.split('.').pop()?.toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(extensao)) {
      return setErro('Formato inválido. Escolha uma imagem JPG ou PNG.');
    }
    if (arquivo.size > TAMANHO_MAXIMO_ORIGINAL) {
      return setErro('Imagem muito grande. Escolha uma de até 10MB.');
    }
    setArquivoParaCortar(arquivo);
  }

  async function handleEnviarFoto(foto: File) {
    setEnviandoFoto(true);
    try {
      const formData = new FormData();
      formData.append('arquivo', foto);
      await api.post('/api/auth/me/foto', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      atualizarUsuario({ temFoto: true });
      recarregarFoto();
      setArquivoParaCortar(null);
      setSucesso('Foto atualizada com sucesso');
    } catch (error: any) {
      setArquivoParaCortar(null);
      setErro(error.mensagemBack ?? 'Erro ao enviar a foto');
    } finally {
      setEnviandoFoto(false);
    }
  }

  async function handleRemoverFoto() {
    setConfirmarRemocao(false);
    setErro('');
    setSucesso('');
    setEnviandoFoto(true);
    try {
      await api.delete('/api/auth/me/foto');
      atualizarUsuario({ temFoto: false });
      setSucesso('Foto removida');
    } catch (error: any) {
      setErro(error.mensagemBack ?? 'Erro ao remover a foto');
    } finally {
      setEnviandoFoto(false);
    }
  }

  return (
    <Layout>
      <Box sx={{ maxWidth: 520, mx: 'auto' }}>
        {erro && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro('')}>{erro}</Alert>}
        {sucesso && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSucesso('')}>{sucesso}</Alert>}

        <Card sx={{ borderRadius: 4, overflow: 'hidden' }}>
          <Box sx={{ height: 110, background: `linear-gradient(135deg, ${cor} 0%, ${alpha(cor, 0.65)} 100%)` }} />

          <CardContent sx={{ pt: 0, px: 4, pb: 4, textAlign: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-flex', mt: -7, mb: 1.5 }}>
              <Box sx={{
                display: 'flex', borderRadius: '50%',
                border: '4px solid', borderColor: 'background.paper',
              }}>
                <AvatarUsuario size={112} bgcolor={cor} />
              </Box>
              {enviandoFoto && (
                <CircularProgress size={120} sx={{ position: 'absolute', top: -4, left: -4 }} />
              )}
              <IconButton
                size="small" disabled={enviandoFoto}
                onClick={() => inputRef.current?.click()}
                sx={{
                  position: 'absolute', bottom: 2, right: 2,
                  bgcolor: 'primary.main', color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                }}
              >
                <PhotoCameraIcon fontSize="small" />
              </IconButton>
            </Box>

            <input
              ref={inputRef} type="file" hidden accept=".jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleEscolherArquivo(file);
                e.target.value = '';
              }}
            />

            <Typography variant="h5" sx={{ fontWeight: 800 }}>{usuario?.nome}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{usuario?.email}</Typography>
            <Chip
              label={perfilLabels[usuario?.perfil ?? ''] ?? usuario?.perfil}
              size="small"
              sx={{ bgcolor: cor, color: 'white', fontWeight: 600 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
              <Button
                size="small" variant="outlined" startIcon={<PhotoCameraIcon />}
                disabled={enviandoFoto} onClick={() => inputRef.current?.click()}
              >
                {usuario?.temFoto ? 'Trocar foto' : 'Adicionar foto'}
              </Button>
              {usuario?.temFoto && (
                <Button
                  size="small" variant="outlined" color="error" startIcon={<DeleteIcon />}
                  disabled={enviandoFoto} onClick={() => setConfirmarRemocao(true)}
                >
                  Remover
                </Button>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              JPG ou PNG. Você poderá ajustar o enquadramento antes de salvar.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
              <TextField
                label="Nome completo" value={nome} fullWidth
                onChange={(e) => setNome(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && nomeAlterado && handleSalvarNome()}
                slotProps={{ htmlInput: { maxLength: 200 } }}
              />
              <TextField
                label="Cargo" fullWidth disabled
                value={perfilLabels[usuario?.perfil ?? ''] ?? usuario?.perfil ?? ''}
              />
              <Button
                variant="contained" size="large" fullWidth
                startIcon={salvando ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                disabled={!nomeAlterado || salvando} onClick={handleSalvarNome}
                sx={{ borderRadius: 3, fontWeight: 'bold' }}
              >
                {salvando ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <CortarFotoDialog
        arquivo={arquivoParaCortar}
        onCancelar={() => setArquivoParaCortar(null)}
        onConfirmar={handleEnviarFoto}
      />

      <Dialog open={confirmarRemocao} onClose={() => setConfirmarRemocao(false)} maxWidth="xs" fullWidth>
        <Box sx={{ background: 'linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)', p: 3 }}>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>Remover foto</Typography>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Tem certeza que deseja remover sua foto de perfil? Suas iniciais voltarão a ser exibidas no lugar.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setConfirmarRemocao(false)} variant="outlined" fullWidth>Voltar</Button>
          <Button onClick={handleRemoverFoto} variant="contained" color="error" fullWidth startIcon={<DeleteIcon />}>
            Sim, remover
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}