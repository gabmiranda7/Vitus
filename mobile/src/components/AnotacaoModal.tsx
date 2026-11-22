import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Text, TextInput, Button, Chip, useTheme } from "react-native-paper";
import api from "../services/api";
import { cores } from "../theme";
import CabecalhoGradiente from "./CabecalhoGradiente";
import ModalComTeclado from "./ModalComTeclado";

interface Props {
  visible: boolean;
  consultaId: string | null;
  anotacaoAtual?: string;
  onClose: () => void;
  onSucesso: () => void;
}

const SECOES_RAPIDAS = [
  "Queixa principal",
  "História clínica",
  "Exame físico",
  "Hipótese diagnóstica",
  "Conduta",
];

export default function AnotacaoModal({
  visible,
  consultaId,
  anotacaoAtual,
  onClose,
  onSucesso,
}: Props) {
  const theme = useTheme();
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setTexto(anotacaoAtual ?? "");
      setErro("");
    }
  }, [visible, anotacaoAtual]);

  function inserirSecao(titulo: string) {
    const prefixo = texto.trim().length > 0 ? "\n\n" : "";
    setTexto((atual) => `${atual.trimEnd()}${prefixo}${titulo}:\n`);
  }

  async function salvar() {
    if (!consultaId) return;
    if (!texto.trim()) {
      setErro("Anotação não pode ser vazia");
      return;
    }
    setErro("");
    setLoading(true);
    try {
      await api.patch(`/api/consultas/${consultaId}/anotar`, {
        anotacoes: texto,
      });
      onSucesso();
    } catch (e: any) {
      setErro(e.mensagemBack ?? "Erro ao salvar anotação");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalComTeclado visible={visible} onDismiss={onClose}>
      <CabecalhoGradiente
        icone="note-edit"
        titulo="Anotações Clínicas"
        cores={cores.gradienteAzul}
      />

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      <Text
        variant="labelMedium"
        style={[styles.labelAtalhos, { color: theme.colors.onSurfaceVariant }]}
      >
        Inserir tópico rápido:
      </Text>
      <View style={styles.atalhosRow}>
        {SECOES_RAPIDAS.map((secao) => (
          <Chip
            key={secao}
            compact
            icon="plus"
            onPress={() => inserirSecao(secao)}
            style={styles.chipAtalho}
          >
            {secao}
          </Chip>
        ))}
      </View>

      <TextInput
        label="Evolução e conduta clínica"
        placeholder="Descreva os sintomas, exame físico, diagnóstico e orientações..."
        value={texto}
        onChangeText={setTexto}
        multiline
        numberOfLines={10}
        mode="outlined"
        style={styles.input}
      />

      <View style={styles.rodape}>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {texto.length}/2000
        </Text>
        <View style={styles.botoes}>
          <Button onPress={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            mode="contained"
            icon="content-save"
            onPress={salvar}
            loading={loading}
            disabled={loading}
          >
            Salvar
          </Button>
        </View>
      </View>
    </ModalComTeclado>
  );
}

const styles = StyleSheet.create({
  labelAtalhos: {
    marginBottom: 6,
  },
  atalhosRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  chipAtalho: {},
  input: {
    minHeight: 160,
    marginBottom: 10,
  },
  rodape: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  botoes: {
    flexDirection: "row",
    gap: 8,
  },
  erro: {
    color: cores.erro,
    marginBottom: 12,
  },
});
