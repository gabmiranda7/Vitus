import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, Text, Button, useTheme } from 'react-native-paper';

interface Props {
  visible: boolean;
  titulo: string;
  mensagem: string;
  corBotao: string;
  onClose: () => void;
  onConfirmar: () => void;
  loading?: boolean;
}

export default function ConfirmModal({ visible, titulo, mensagem, corBotao, onClose, onConfirmar, loading }: Props) {
  const theme = useTheme();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <Text variant="titleLarge" style={styles.titulo}>{titulo}</Text>
        <Text variant="bodyMedium" style={[styles.mensagem, { color: theme.colors.onSurfaceVariant }]}>
          {mensagem}
        </Text>
        <View style={styles.botoes}>
          <Button onPress={onClose} disabled={loading}>Voltar</Button>
          <Button mode="contained" buttonColor={corBotao} onPress={onConfirmar} loading={loading} disabled={loading}>
            Confirmar
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  titulo: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  mensagem: {
    marginBottom: 20,
  },
  botoes: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});