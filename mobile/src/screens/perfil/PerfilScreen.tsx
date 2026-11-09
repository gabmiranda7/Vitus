import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text, Button, Chip, TextInput } from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { cores } from '../../theme';
import AvatarUsuario from '../../components/AvatarUsuario';
import ConfirmModal from '../../components/ConfirmModal';

const perfilLabels: Record<string, string> = {
  Medico: 'Médico', Enfermeiro: 'Enfermeiro(a)',
  Recepcionista: 'Recepcionista', Administrador: 'Administrador',
};

const perfilCores: Record<string, string> = {
  Medico: cores.primariaEscura, Enfermeiro: cores.sucesso,
  Recepcionista: cores.secundaria, Administrador: '#37474f',
};

const TAMANHO_MAXIMO = 2 * 1024 * 1024;

export default function PerfilScreen() {
  const { usuario, logout, atualizarUsuario, recarregarFoto } = useAuth();
  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [confirmarRemocao, setConfirmarRemocao] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const cor = perfilCores[usuario?.perfil ?? ''] ?? cores.primaria;
  const nomeAlterado = nome.trim() !== '' && nome.trim() !== usuario?.nome;

  async function escolherFoto() {
    setErro('');
    setSucesso('');

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (resultado.canceled || !resultado.assets?.[0]) return;
    const asset = resultado.assets[0];

    if (asset.fileSize && asset.fileSize > TAMANHO_MAXIMO) {
      setErro('Imagem muito grande (máx. 2MB). Escolha outra ou recorte uma área menor.');
      return;
    }

    const ehPng = (asset.mimeType ?? '').includes('png') || asset.uri.toLowerCase().endsWith('.png');

    setEnviandoFoto(true);
    try {
      const formData = new FormData();
      formData.append('arquivo', {
        uri: asset.uri,
        name: ehPng ? 'perfil.png' : 'perfil.jpg',
        type: ehPng ? 'image/png' : 'image/jpeg',
      } as any);

      await api.post('/api/auth/me/foto', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await atualizarUsuario({ temFoto: true });
      recarregarFoto();
      setSucesso('Foto atualizada com sucesso');
    } catch (e: any) {
      setErro(e.mensagemBack ?? 'Erro ao enviar a foto');
    } finally {
      setEnviandoFoto(false);
    }
  }

  async function removerFoto() {
    setConfirmarRemocao(false);
    setErro('');
    setSucesso('');
    setEnviandoFoto(true);
    try {
      await api.delete('/api/auth/me/foto');
      await atualizarUsuario({ temFoto: false });
      setSucesso('Foto removida');
    } catch (e: any) {
      setErro(e.mensagemBack ?? 'Erro ao remover a foto');
    } finally {
      setEnviandoFoto(false);
    }
  }

  async function salvarNome() {
    setErro('');
    setSucesso('');
    if (!nome.trim()) {
      setErro('Nome é obrigatório');
      return;
    }

    setSalvando(true);
    try {
      const response = await api.put('/api/auth/me', { nome: nome.trim() });
      await atualizarUsuario(
        {
          nome: response.data.nome,
          medicoId: response.data.medicoId ?? undefined,
          temFoto: !!response.data.temFoto,
        },
        response.data.token
      );
      setNome(response.data.nome);
      setSucesso('Nome atualizado com sucesso');
    } catch (e: any) {
      setErro(e.mensagemBack ?? 'Erro ao atualizar o nome');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.conteudo}
      >
        <View style={[styles.faixa, { backgroundColor: cor }]} />

        <View style={styles.cartao}>
          <TouchableOpacity onPress={escolherFoto} disabled={enviandoFoto} style={styles.avatarArea}>
            <View style={styles.avatarBorda}>
              <AvatarUsuario size={112} cor={cor} />
            </View>
            <View style={styles.cameraBadge}>
              {enviandoFoto
                ? <ActivityIndicator size={14} color="white" />
                : <MaterialCommunityIcons name="camera" size={16} color="white" />}
            </View>
          </TouchableOpacity>

          <Text variant="headlineSmall" style={styles.nome}>{usuario?.nome}</Text>
          <Text variant="bodyMedium" style={styles.email}>{usuario?.email}</Text>
          <Chip compact style={[styles.chip, { backgroundColor: cor }]} textStyle={{ color: 'white', fontWeight: 'bold' }}>
            {perfilLabels[usuario?.perfil ?? ''] ?? usuario?.perfil}
          </Chip>

          <View style={styles.botoesFoto}>
            <Button mode="outlined" icon="camera" compact onPress={escolherFoto} disabled={enviandoFoto}>
              {usuario?.temFoto ? 'Trocar foto' : 'Adicionar foto'}
            </Button>
            {usuario?.temFoto && (
              <Button
                mode="outlined" icon="delete" compact textColor={cores.erro}
                onPress={() => setConfirmarRemocao(true)} disabled={enviandoFoto}
              >
                Remover
              </Button>
            )}
          </View>
          <Text variant="bodySmall" style={styles.dica}>
            Você poderá ajustar o enquadramento antes de salvar.
          </Text>

          {erro ? <Text style={styles.erro}>{erro}</Text> : null}
          {sucesso ? <Text style={styles.sucesso}>{sucesso}</Text> : null}

          <View style={styles.form}>
            <TextInput
              label="Nome completo"
              value={nome}
              onChangeText={setNome}
              mode="outlined"
              maxLength={200}
              autoCapitalize="words"
              autoCorrect={false}
              spellCheck={false}
              style={styles.input}
            />
            <TextInput
              label="Cargo"
              value={perfilLabels[usuario?.perfil ?? ''] ?? usuario?.perfil ?? ''}
              mode="outlined"
              disabled
              style={styles.input}
            />
            <Button
              mode="contained" icon="content-save"
              onPress={salvarNome} loading={salvando} disabled={!nomeAlterado || salvando}
            >
              Salvar alterações
            </Button>
          </View>
        </View>

        <Button
          mode="outlined" icon="logout" textColor={cores.erro}
          onPress={logout} style={styles.sair}
        >
          Sair da conta
        </Button>
      </KeyboardAwareScrollView>

      <ConfirmModal
        visible={confirmarRemocao}
        titulo="Remover foto"
        mensagem="Tem certeza que deseja remover sua foto de perfil? Suas iniciais voltarão a ser exibidas no lugar."
        corBotao={cores.erro}
        onClose={() => setConfirmarRemocao(false)}
        onConfirmar={removerFoto}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: 16, paddingBottom: 32 },
  faixa: { height: 90, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  cartao: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  avatarArea: { marginTop: -56, marginBottom: 12 },
  avatarBorda: { borderWidth: 4, borderColor: 'white', borderRadius: 60 },
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  nome: { fontWeight: 'bold', textAlign: 'center' },
  email: { color: cores.textoSecundario, marginTop: 2, marginBottom: 8, textAlign: 'center' },
  chip: { alignSelf: 'center' },
  botoesFoto: { flexDirection: 'row', gap: 8, marginTop: 16 },
  dica: { color: cores.textoDesabilitado, marginTop: 8, textAlign: 'center' },
  erro: { color: cores.erro, marginTop: 12, textAlign: 'center' },
  sucesso: { color: cores.sucesso, marginTop: 12, textAlign: 'center' },
  form: { alignSelf: 'stretch', marginTop: 20 },
  input: { marginBottom: 12 },
  sair: { marginTop: 16, borderColor: cores.erro },
});