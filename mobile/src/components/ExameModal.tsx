import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, Menu } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import api from '../services/api';

interface Props {
  visible: boolean;
  consultaId: string | null;
  onClose: () => void;
  onSucesso: () => void;
}

const CATEGORIAS = ['Sangue', 'Imagem', 'Urina', 'Cardiologico', 'Fisico', 'Outro'];
const categoriaLabel: Record<string, string> = {
  Sangue: 'Sangue', Imagem: 'Imagem', Urina: 'Urina',
  Cardiologico: 'Cardiológico', Fisico: 'Físico', Outro: 'Outro',
};

export default function ExameModal({ visible, consultaId, onClose, onSucesso }: Props) {
  const [categoria, setCategoria] = useState('Sangue');
  const [menuAberto, setMenuAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [medicoSolicitante, setMedicoSolicitante] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [arquivo, setArquivo] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  function limpar() {
    setCategoria('Sangue'); setNome(''); setDescricao(''); setMedicoSolicitante('');
    setObservacoes(''); setArquivo(null); setErro('');
  }

  async function escolherArquivo() {
    const resultado = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png'],
    });
    if (!resultado.canceled && resultado.assets?.[0]) {
      const asset = resultado.assets[0];
      if (asset.size && asset.size > 10 * 1024 * 1024) {
        setErro('Arquivo muito grande. Tamanho máximo: 10MB.');
        return;
      }
      setErro('');
      setArquivo(asset);
    }
  }

  async function salvar() {
    if (!consultaId) return;
    setErro('');
    if (!nome.trim()) return setErro('Nome do exame é obrigatório');
    if (!medicoSolicitante.trim()) return setErro('Médico solicitante é obrigatório');

    setLoading(true);
    try {
      const rProntuario = await api.get(`/api/prontuarios/consulta/${consultaId}`);
      const rExame = await api.post('/api/exames', {
        prontuarioId: rProntuario.data.id,
        consultaId,
        categoria,
        nome,
        descricao,
        medicoSolicitante,
        dataExame: new Date().toISOString().split('T')[0],
        observacoes,
      });

      if (arquivo) {
        const formData = new FormData();
        formData.append('arquivo', {
          uri: arquivo.uri,
          name: arquivo.name,
          type: arquivo.mimeType ?? 'application/octet-stream',
        } as any);

        await api.post(`/api/exames/${rExame.data.id}/arquivo`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      limpar();
      onSucesso();
    } catch (e: any) {
      setErro(e.mensagemBack ?? 'Erro ao registrar exame');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.modal}>
        <ScrollView>
          <Text variant="titleLarge" style={styles.titulo}>Registrar Exame</Text>
          {erro ? <Text style={styles.erro}>{erro}</Text> : null}

          <Menu
            visible={menuAberto}
            onDismiss={() => setMenuAberto(false)}
            anchor={
              <Button mode="outlined" onPress={() => setMenuAberto(true)} style={styles.input}>
                Categoria: {categoriaLabel[categoria]}
              </Button>
            }
          >
            {CATEGORIAS.map((c) => (
              <Menu.Item key={c} title={categoriaLabel[c]} onPress={() => { setCategoria(c); setMenuAberto(false); }} />
            ))}
          </Menu>

          <TextInput label="Nome do exame *" value={nome} onChangeText={setNome} mode="outlined" style={styles.input} />
          <TextInput label="Médico solicitante *" value={medicoSolicitante} onChangeText={setMedicoSolicitante} mode="outlined" style={styles.input} />
          <TextInput label="Descrição" value={descricao} onChangeText={setDescricao} mode="outlined" style={styles.input} />
          <TextInput
            label="Observações / valores relevantes"
            value={observacoes}
            onChangeText={setObservacoes}
            multiline
            numberOfLines={3}
            mode="outlined"
            style={styles.input}
          />

          <Button
            mode="outlined"
            icon="paperclip"
            onPress={escolherArquivo}
            style={styles.input}
          >
            {arquivo ? arquivo.name : 'Anexar arquivo (opcional)'}
          </Button>

          <View style={styles.botoes}>
            <Button onPress={onClose} disabled={loading}>Cancelar</Button>
            <Button mode="contained" onPress={salvar} loading={loading} disabled={loading}>
              Registrar
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    maxHeight: '85%',
  },
  titulo: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 12,
  },
  botoes: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  erro: {
    color: '#d32f2f',
    marginBottom: 12,
  },
});