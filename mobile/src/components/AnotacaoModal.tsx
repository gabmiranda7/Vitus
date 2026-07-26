import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, Text, TextInput, Button } from 'react-native-paper';
import api from '../services/api';

interface Props {
  visible: boolean;
  consultaId: string | null;
  anotacaoAtual?: string;
  onClose: () => void;
  onSucesso: () => void;
}

export default function AnotacaoModal({ visible, consultaId, anotacaoAtual, onClose, onSucesso }: Props) {
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) setTexto(anotacaoAtual ?? '');
  }, [visible, anotacaoAtual]);

  async function salvar() {
    if (!consultaId) return;
    if (!texto.trim()) {
      setErro('Anotação não pode ser vazia');
      return;
    }
    setErro('');
    setLoading(true);
    try {
      await api.patch(`/api/consultas/${consultaId}/anotar`, { anotacoes: texto });
      onSucesso();
    } catch (e: any) {
      setErro(e.mensagemBack ?? 'Erro ao salvar anotação');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.modal}>
        <Text variant="titleLarge" style={styles.titulo}>Anotações Clínicas</Text>
        {erro ? <Text style={styles.erro}>{erro}</Text> : null}
        <TextInput
          label="Anotações da consulta"
          value={texto}
          onChangeText={setTexto}
          multiline
          numberOfLines={8}
          mode="outlined"
          style={styles.input}
        />
        <View style={styles.botoes}>
          <Button onPress={onClose} disabled={loading}>Cancelar</Button>
          <Button mode="contained" onPress={salvar} loading={loading} disabled={loading}>
            Salvar
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