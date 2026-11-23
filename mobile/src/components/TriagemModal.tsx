import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text, TextInput, Button, useTheme } from "react-native-paper";
import api from "../services/api";
import CabecalhoGradiente from "./CabecalhoGradiente";
import { cores } from "../theme";
import ModalComTeclado from "./ModalComTeclado";

interface Props {
  visible: boolean;
  consultaId: string | null;
  statusConsulta?: string;
  onClose: () => void;
  onSucesso: () => void;
}

const PRESSAO_REGEX = /^\d{2,3}\/\d{2,3}$/;

export default function TriagemModal({
  visible,
  consultaId,
  statusConsulta,
  onClose,
  onSucesso,
}: Props) {
  const theme = useTheme();
  const [pressao, setPressao] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [glicemia, setGlicemia] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [iniciada, setIniciada] = useState(false);
  const [registrada, setRegistrada] = useState(false);

  function limpar() {
    setPressao("");
    setTemperatura("");
    setGlicemia("");
    setObservacoes("");
    setErro("");
    setIniciada(false);
    setRegistrada(false);
  }

  // Sempre começa limpo, para os dados de um paciente não aparecerem no seguinte
  useEffect(() => {
    if (visible) limpar();
  }, [visible, consultaId]);

  async function salvar() {
    if (!consultaId) return;
    setErro("");

    const pressaoLimpa = pressao.trim();
    if (!PRESSAO_REGEX.test(pressaoLimpa)) {
      return setErro("Informe a pressão arterial no formato 120/80");
    }

    const temp = parseFloat(temperatura.replace(",", "."));
    if (Number.isNaN(temp) || temp < 30 || temp > 45) {
      return setErro("Temperatura deve estar entre 30 e 45 °C");
    }

    let glicemiaNum: number | null = null;
    if (glicemia.trim()) {
      glicemiaNum = parseInt(glicemia, 10);
      if (Number.isNaN(glicemiaNum) || glicemiaNum < 20 || glicemiaNum > 600) {
        return setErro("Glicemia deve estar entre 20 e 600 mg/dL");
      }
    }

    setLoading(true);
    try {
      // Cada etapa roda uma única vez, mesmo que o usuário tente de novo depois de uma falha
      if (statusConsulta !== "EmTriagem" && !iniciada) {
        await api.patch(`/api/consultas/${consultaId}/iniciar-triagem`);
        setIniciada(true);
      }
      if (!registrada) {
        try {
          await api.post("/api/triagens", {
            consultaId,
            pressaoArterial: pressaoLimpa,
            temperatura: temp,
            glicemia: glicemiaNum,
            observacoes,
          });
        } catch (e: any) {
          // 409: a consulta já tem triagem (registro anterior que não chegou a encaminhar)
          if (e?.response?.status !== 409) throw e;
        }
        setRegistrada(true);
      }
      await api.patch(`/api/consultas/${consultaId}/aguardar-atendimento`);
      onSucesso();
    } catch (e: any) {
      setErro(e.mensagemBack ?? "Erro ao registrar triagem");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalComTeclado visible={visible} onDismiss={onClose}>
      <CabecalhoGradiente
        icone="stethoscope"
        titulo="Triagem"
        cores={cores.gradienteLaranja}
      />
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
      <TextInput
        label="Pressão Arterial"
        value={pressao}
        onChangeText={setPressao}
        placeholder="ex: 120/80"
        maxLength={7}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Temperatura (°C)"
        value={temperatura}
        onChangeText={setTemperatura}
        placeholder="ex: 36.5"
        keyboardType="decimal-pad"
        maxLength={5}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Glicemia (mg/dL) — opcional"
        value={glicemia}
        onChangeText={(v) => setGlicemia(v.replace(/\D/g, ""))}
        placeholder="ex: 95"
        keyboardType="numeric"
        maxLength={3}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Observações"
        value={observacoes}
        onChangeText={setObservacoes}
        multiline
        numberOfLines={3}
        maxLength={500}
        mode="outlined"
        style={styles.input}
      />
      <Text
        variant="bodySmall"
        style={[styles.contador, { color: theme.colors.onSurfaceVariant }]}
      >
        {observacoes.length}/500
      </Text>
      <View style={styles.botoes}>
        <Button onPress={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          mode="contained"
          onPress={salvar}
          loading={loading}
          disabled={loading}
        >
          Registrar
        </Button>
      </View>
    </ModalComTeclado>
  );
}

const styles = StyleSheet.create({
  input: {
    marginBottom: 12,
  },
  contador: {
    textAlign: "right",
    marginTop: -8,
    marginBottom: 8,
  },
  botoes: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  erro: {
    color: "#d32f2f",
    marginBottom: 12,
  },
});
