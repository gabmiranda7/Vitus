import React, { useMemo, useState } from "react";
import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import {
  Text,
  Card,
  Avatar,
  Searchbar,
  ActivityIndicator,
  Chip,
  useTheme,
} from "react-native-paper";
import api from "../../services/api";
import { useAtualizacaoAutomatica } from "../../hooks/useAtualizacaoAutomatica";
import { Consulta, Medico } from "../../types";
import { cores } from "../../theme";

function iniciais(nome: string) {
  return nome
    .replace(/^Dr\.?\s*/i, "")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const CORES_ESP: Record<string, string> = {
  Cardiologia: "#c62828",
  Pediatria: "#1565c0",
  Ortopedia: "#2e7d32",
  Neurologia: "#6a1b9a",
  Dermatologia: "#e65100",
  Ginecologia: "#ad1457",
  "Clínico Geral": "#00695c",
  Oftalmologia: "#0277bd",
  Psiquiatria: "#4527a0",
};

function corEspecialidade(esp: string) {
  return CORES_ESP[esp] ?? cores.primaria;
}

const STATUS_PENDENTES = ["Agendada", "EmTriagem", "AguardandoAtendimento"];

function mesmoDia(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatarProxima(data: Date) {
  const hora = data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (mesmoDia(data, new Date())) return `Hoje, ${hora}`;
  const dia = data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
  return `${dia}, ${hora}`;
}

export default function MedicosScreen() {
  const theme = useTheme();
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState("");

  useAtualizacaoAutomatica(carregar, 60000);

  async function carregar() {
    try {
      const [rMedicos, rConsultas] = await Promise.all([
        api.get("/api/medicos"),
        api.get("/api/consultas").catch(() => ({ data: [] })),
      ]);
      setMedicos(rMedicos.data);
      setConsultas(rConsultas.data);
      setErro("");
    } catch (e: any) {
      setErro(e.mensagemBack ?? "Erro ao carregar médicos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    carregar();
  }

  // Situação de cada médico, calculada a partir das consultas já carregadas
  const situacao = useMemo(() => {
    const agora = new Date();
    const mapa = new Map<
      string,
      { hoje: number; emAtendimento: boolean; proxima: Consulta | null }
    >();
    for (const m of medicos) {
      const dele = consultas.filter((c) => c.medicoId === m.id);
      const pendentes = dele
        .filter((c) => STATUS_PENDENTES.includes(c.status))
        .filter((c) => new Date(c.dataConsulta) >= agora)
        .sort(
          (a, b) =>
            new Date(a.dataConsulta).getTime() -
            new Date(b.dataConsulta).getTime(),
        );
      mapa.set(m.id, {
        hoje: dele.filter(
          (c) =>
            c.status !== "Cancelada" &&
            mesmoDia(new Date(c.dataConsulta), agora),
        ).length,
        emAtendimento: dele.some((c) => c.status === "EmAtendimento"),
        proxima: pendentes[0] ?? null,
      });
    }
    return mapa;
  }, [medicos, consultas]);

  const q = busca.trim().toLowerCase();
  const filtrados = medicos.filter(
    (m) =>
      !q ||
      m.nome.toLowerCase().includes(q) ||
      m.especialidade.toLowerCase().includes(q) ||
      m.crm.toLowerCase().includes(q),
  );

  if (loading) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar por nome, especialidade ou CRM..."
        value={busca}
        onChangeText={setBusca}
        style={styles.busca}
      />

      <ScrollView
        contentContainerStyle={styles.lista}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        {filtrados.length === 0 ? (
          <Text
            style={[
              styles.textoVazio,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {erro ? "" : "Nenhum médico encontrado"}
          </Text>
        ) : (
          filtrados.map((m) => {
            const cor = corEspecialidade(m.especialidade);
            const s = situacao.get(m.id);
            const corStatus = s?.emAtendimento ? "#7b1fa2" : cores.sucesso;
            return (
              <Card
                key={m.id}
                style={[
                  styles.card,
                  { borderLeftColor: cor, borderLeftWidth: 4 },
                ]}
              >
                <Card.Content style={styles.cardContent}>
                  <Avatar.Text
                    size={44}
                    label={iniciais(m.nome)}
                    style={{ backgroundColor: cor }}
                  />
                  <View style={styles.info}>
                    <Text variant="titleMedium">{m.nome}</Text>
                    <Chip
                      compact
                      style={{
                        backgroundColor: cor + (theme.dark ? "33" : "20"),
                        alignSelf: "flex-start",
                        marginTop: 4,
                      }}
                      textStyle={{
                        color: theme.dark ? "#e8eef5" : cor,
                        fontSize: 11,
                      }}
                    >
                      {m.especialidade}
                    </Chip>
                    <Text
                      variant="bodySmall"
                      style={[
                        styles.crm,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      CRM: {m.crm}
                    </Text>
                    <View style={styles.situacao}>
                      <Chip
                        compact
                        style={{
                          backgroundColor:
                            corStatus + (theme.dark ? "33" : "20"),
                        }}
                        textStyle={{
                          color: theme.dark ? "#e8eef5" : corStatus,
                          fontSize: 11,
                        }}
                      >
                        {s?.emAtendimento ? "Em atendimento" : "Disponível"}
                      </Chip>
                    </View>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      Hoje: {s?.hoje ?? 0}{" "}
                      {(s?.hoje ?? 0) === 1 ? "consulta" : "consultas"} ·
                      Próxima:{" "}
                      {s?.proxima
                        ? formatarProxima(new Date(s.proxima.dataConsulta))
                        : "nenhuma agendada"}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}

        <Text
          variant="bodySmall"
          style={[styles.rodape, { color: theme.colors.onSurfaceVariant }]}
        >
          Novos médicos entram pelo cadastro de conta e aparecem aqui depois de
          aprovados pelo administrador.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  centro: { flex: 1, justifyContent: "center", alignItems: "center" },
  busca: { margin: 16, marginBottom: 8 },
  lista: { padding: 16, paddingTop: 8, paddingBottom: 32 },
  card: { marginBottom: 10, borderRadius: 12 },
  cardContent: { flexDirection: "row", alignItems: "center" },
  info: { marginLeft: 12, flex: 1 },
  crm: { marginTop: 4 },
  situacao: { flexDirection: "row", marginTop: 8, marginBottom: 4 },
  textoVazio: { textAlign: "center", marginTop: 40 },
  rodape: { textAlign: "center", marginTop: 16 },
  erro: { color: cores.erro, textAlign: "center", marginBottom: 12 },
});
