import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, Text, TextInput, Button } from 'react-native-paper';
import api from '../services/api';

interface Props {
  visible: boolean;
  consultaId: string | null;
  onClose: () => void;
  onSucesso: () => void;
}

export default function TriagemModal({ visible, consultaId, onClose, onSucesso }: Props) {
  const [pressao, setPressao] = useState('');
  const [temperatura, setTemperatura] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  function limpar() {
    setPressao(''); setTemperatura(''); setObservacoes(''); setErro('');
  }

  async function salvar() {
    if (!consultaId) return;
    setErro('');
    if (!pressao.trim() || !temperatura.trim()) {
      setErro('Preencha pressão arterial e temperatura');
      return;
    }
    setLoading(true);
    try {
      await api.patch(`/api/consultas/${consultaId}/iniciar-triagem`);
      await api.post('/api/triagens', {
        consultaId,
        pressaoArterial: pressao,
        temperatura: parseFloat(temperatura),
        observacoes,
      });
      await api.patch(`/api/consultas/${consultaId}/aguardar-atendimento`);
      limpar();
      onSucesso();
    } catch (e: any) {
      setErro(e.mensagemBack ?? 'Erro ao registrar triagem');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.modal}>
        <Text variant="titleLarge" style={styles.titulo}>Triagem</Text>
        {erro ? <Text style={styles.erro}>{erro}</Text> : null}
        <TextInput
          label="Pressão Arterial"
          value={pressao}
          onChangeText={setPressao}
          placeholder="ex: 120/80"
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Temperatura (°C)"
          value={temperatura}
          onChangeText={setTemperatura}
          placeholder="ex: 36.5"
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Observações"
          value={observacoes}
          onChangeText={setObservacoes}
          multiline
          numberOfLines={3}
          mode="outlined"
          style={styles.input}
        />
        <View style={styles.botoes}>
          <Button onPress={onClose} disabled={loading}>Cancelar</Button>
          <Button mode="contained" onPress={salvar} loading={loading} disabled={loading}>
            Registrar
          </Button>
        </View>
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