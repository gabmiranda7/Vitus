import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Alert,
  Chip, Divider, CircularProgress,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Layout from '../../components/layout/Layout';
import AvatarUsuario from '../../components/layout/AvatarUsuario';
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

const TAMANHO_MAXIMO = 2 * 1024 * 1024;

export default function PerfilPage() {
  const { usuario, atualizarUsuario, recarregarFoto } = useAuth();
  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
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

  async function handleFoto(arquivo: File) {
    setErro('');
    setSucesso('');

    const extensao = '.' + arquivo.name.split('.').pop()?.toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(extensao)) {
      return setErro('Formato inválido. Envie apenas JPG ou PNG.');
    }
    if (arquivo.size > TAMANHO_MAXIMO) {
      return setErro('Imagem muito grande. Tamanho máximo: 2MB.');
    }

    setEnviandoFoto(true);
    try {
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      await api.post('/api/auth/me/foto', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      atualizarUsuario({ temFoto: true });
      recarregarFoto();
      setSucesso('Foto atualizada com sucesso');
    } catch (error: any) {
      setErro(error.mensagemBack ?? 'Erro ao enviar a foto');
    } finally {
      setEnviandoFoto(false);
    }
  }

  async function handleRemoverFoto() {
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <AccountCircleIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Meu Perfil</Typography>
      </Box>

      {erro && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro('')}>{erro}</Alert>}
      {sucesso && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSucesso('')}>{sucesso}</Alert>}

      <Card sx={{ borderRadius: 3, maxWidth: 640 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', mb: 3 }}>
            <Box sx={{ position: 'relative', display: 'flex' }}>
              <AvatarUsuario size={96} bgcolor={cor} />
              {enviandoFoto && (
                <CircularProgress size={96} sx={{ position: 'absolute', top: 0, left: 0 }} />
              )}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{usuario?.nome}</Typography>
              <Chip
                label={perfilLabels[usuario?.perfil ?? ''] ?? usuario?.perfil}
                size="small"
                sx={{ mt: 0.75, bgcolor: cor, color: 'white', fontWeight: 600 }}
              />
              <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                <Button
                  size="small" variant="outlined" component="label"
                  startIcon={<PhotoCameraIcon />} disabled={enviandoFoto}
                >
                  {usuario?.temFoto ? 'Trocar foto' : 'Adicionar foto'}
                  <input
                    type="file" hidden accept=".jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFoto(file);
                      e.target.value = '';
                    }}
                  />
                </Button>
                {usuario?.temFoto && (
                  <Button
                    size="small" variant="outlined" color="error"
                    startIcon={<DeleteIcon />} disabled={enviandoFoto}
                    onClick={handleRemoverFoto}
                  >
                    Remover
                  </Button>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                JPG ou PNG, até 2MB
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Nome completo" value={nome} fullWidth
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && nomeAlterado && handleSalvarNome()}
              slotProps={{ htmlInput: { maxLength: 200 } }}
            />
            <TextField label="Email" value={usuario?.email ?? ''} fullWidth disabled />
            <TextField
              label="Cargo" value={perfilLabels[usuario?.perfil ?? ''] ?? usuario?.perfil ?? ''}
              fullWidth disabled
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained" startIcon={salvando ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                disabled={!nomeAlterado || salvando} onClick={handleSalvarNome}
              >
                {salvando ? 'Salvando...' : 'Salvar nome'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Layout>
  );
}