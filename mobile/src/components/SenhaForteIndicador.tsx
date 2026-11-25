import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, ProgressBar, useTheme } from "react-native-paper";
import { avaliarSenha } from "../utils/senha";
import { cores } from "../theme";

export default function SenhaForteIndicador({ senha }: { senha: string }) {
  const theme = useTheme();
  if (!senha) return null;

  const requisitos = avaliarSenha(senha);
  const atendidos = requisitos.filter((r) => r.ok).length;
  const cor =
    atendidos <= 2
      ? cores.erro
      : atendidos < requisitos.length
        ? cores.aviso
        : cores.sucesso;
  const texto =
    atendidos <= 2
      ? "Fraca"
      : atendidos < requisitos.length
        ? "Média"
        : "Forte";

  return (
    <View style={styles.container}>
      <View style={styles.linha}>
        <ProgressBar
          progress={atendidos / requisitos.length}
          color={cor}
          style={styles.barra}
        />
        <Text variant="labelSmall" style={{ color: cor, fontWeight: "700" }}>
          {texto}
        </Text>
      </View>
      {requisitos.map((r) => (
        <Text
          key={r.label}
          variant="bodySmall"
          style={{
            color: r.ok ? cores.sucesso : theme.colors.onSurfaceVariant,
          }}
        >
          {r.ok ? "✓" : "○"} {r.label}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  linha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 6,
  },
  barra: { flex: 1, height: 6, borderRadius: 3 },
});
