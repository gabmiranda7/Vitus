import React, { useEffect, useRef } from "react";
import { Animated, View, StyleSheet } from "react-native";
import { Modal, Portal, Text, Button, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {
  visible: boolean;
  titulo: string;
  mensagem: string;
  corBotao: string;
  onClose: () => void;
  onConfirmar: () => void;
  loading?: boolean;
  confirmarLabel?: string;
  icone?: keyof typeof MaterialCommunityIcons.glyphMap;
}

export default function ConfirmModal({
  visible,
  titulo,
  mensagem,
  corBotao,
  onClose,
  onConfirmar,
  loading,
  confirmarLabel = "Confirmar",
  icone = "alert-circle-outline",
}: Props) {
  const theme = useTheme();
  const escala = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (visible) {
      escala.setValue(0.6);
      Animated.spring(escala, {
        toValue: 1,
        friction: 5,
        tension: 140,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, escala]);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={loading ? undefined : onClose}
        contentContainerStyle={[
          styles.modal,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <Animated.View
          style={[
            styles.icone,
            {
              backgroundColor: `${corBotao}1f`,
              transform: [{ scale: escala }],
            },
          ]}
        >
          <MaterialCommunityIcons name={icone} size={30} color={corBotao} />
        </Animated.View>

        <Text variant="titleLarge" style={styles.titulo}>
          {titulo}
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.mensagem, { color: theme.colors.onSurfaceVariant }]}
        >
          {mensagem}
        </Text>

        <View style={styles.botoes}>
          <Button
            mode="outlined"
            onPress={onClose}
            disabled={loading}
            style={styles.botao}
            contentStyle={styles.botaoConteudo}
          >
            Voltar
          </Button>
          <Button
            mode="contained"
            buttonColor={corBotao}
            onPress={onConfirmar}
            loading={loading}
            disabled={loading}
            style={styles.botao}
            contentStyle={styles.botaoConteudo}
          >
            {confirmarLabel}
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    marginHorizontal: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    borderRadius: 24,
    alignItems: "center",
  },
  icone: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  titulo: {
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  mensagem: {
    textAlign: "center",
    marginBottom: 24,
  },
  botoes: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  botao: {
    flex: 1,
    borderRadius: 12,
  },
  botaoConteudo: {
    paddingVertical: 4,
  },
});
