import React, { useCallback, useState, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Card,
  Chip,
  ActivityIndicator,
  Avatar,
  Button,
  useTheme,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import { Consulta, AuditoriaLog, statusCores, statusLabels } from "../../types";
import { cores, iniciais } from "../../theme";
import { acaoIcones, acaoCores, acaoLabel } from "../../utils/auditoria";

export default function DashboardScreen() {
  const { usuario } = useAuth();
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const isAdmin = usuario?.perfil === "Administrador";

  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [logs, setLogs] = useState<AuditoriaLog[]>([]);
  const [pendentesCount, setPendentesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState("");

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, []),
  );

  async function carregar() {
    try {
      setErro("");

      if (isAdmin) {
        const [resLogs, resPendentes] = await Promise.all([
          api.get("/api/auditoria"),
          api.get("/api/auth/pendentes").catch(() => ({ data: [] })),
        ]);

        setLogs(resLogs.data);
        setPendentesCount(
          Array.isArray(resPendentes.data) ? resPendentes.data.length : 0,
        );
      } else {
        const response = await api.get("/api/consultas");
        setConsultas(response.data);
      }
    } catch (e: any) {
      setErro(e.mensagemBack ?? "Não foi possível carregar os dados");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    carregar();
  }

  const ativas = consultas.filter((c) =>
    [
      "Agendada",
      "EmTriagem",
      "AguardandoAtendimento",
      "EmAtendimento",
    ].includes(c.status),
  );

  const minhasConsultas =
    usuario?.perfil === "Medico"
      ? ativas.filter((c) => c.medicoId === usuario.medicoId)
      : ativas;

  const logsRecentes = useMemo(
    () =>
      [...logs]
        .sort(
          (a, b) =>
            new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime(),
        )
        .slice(0, 6),
    [logs],
  );

  const hojeStr = new Date().toDateString();
  const logsHoje = logs.filter(
    (l) => new Date(l.dataHora).toDateString() === hojeStr,
  ).length;
  const usuariosUnicos = new Set(logs.map((l) => l.usuarioId)).size;

  const topAcoes = useMemo(() => {
    const contagem: Record<string, number> = {};
    logs.forEach((l) => {
      contagem[l.acao] = (contagem[l.acao] ?? 0) + 1;
    });
    return Object.entries(contagem)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [logs]);

  if (loading) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const kpisAdmin = [
    {
      label: "Total de Logs",
      valor: logs.length,
      icon: "history",
      cor: cores.primaria,
      rota: "Auditoria",
    },
    {
      label: "Registros Hoje",
      valor: logsHoje,
      icon: "calendar-today",
      cor: cores.sucesso,
      rota: "Auditoria",
    },
    {
      label: "Usuários com Atividade",
      valor: usuariosUnicos,
      icon: "account-group-outline",
      cor: cores.secundaria,
      rota: "Auditoria",
    },
    {
      label: "Aprovações Pend.",
      valor: pendentesCount,
      icon: "account-clock-outline",
      cor: pendentesCount > 0 ? cores.aviso : cores.textoSecundario,
      rota: "Aprovacoes",
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text variant="headlineSmall" style={styles.saudacao}>
        Olá, {usuario?.nome?.split(" ")[0]} 👋
      </Text>

      <Text
        variant="bodyMedium"
        style={[styles.subtitulo, { color: theme.colors.onSurfaceVariant }]}
      >
        {isAdmin
          ? "Visão geral e auditoria do sistema"
          : usuario?.perfil === "Medico"
            ? "Minhas consultas ativas"
            : "Consultas ativas"}
      </Text>

      {erro ? (
        <Text style={{ color: cores.erro, marginBottom: 12 }}>{erro}</Text>
      ) : null}

      {isAdmin ? (
        <>
          {/* Grid 2x2 de KPIs clicáveis */}
          <View style={styles.kpiGrid}>
            {kpisAdmin.map((kpi) => (
              <TouchableOpacity
                key={kpi.label}
                style={styles.kpiWrapper}
                activeOpacity={0.75}
                onPress={() => navigation.navigate(kpi.rota)}
              >
                <Card
                  style={[
                    styles.kpiCard,
                    { borderLeftColor: kpi.cor, borderLeftWidth: 4 },
                  ]}
                >
                  <Card.Content style={styles.kpiContent}>
                    <View
                      style={[
                        styles.kpiIconBox,
                        { backgroundColor: kpi.cor + "20" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={kpi.icon as any}
                        size={20}
                        color={kpi.cor}
                      />
                    </View>
                    <View style={styles.kpiTexts}>
                      <Text
                        variant="labelSmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                        numberOfLines={1}
                      >
                        {kpi.label}
                      </Text>
                      <Text
                        variant="titleLarge"
                        style={[styles.kpiValor, { color: kpi.cor }]}
                      >
                        {kpi.valor}
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={18}
                      color={theme.colors.onSurfaceVariant}
                      style={{ opacity: 0.5 }}
                    />
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))}
          </View>

          {/* Resumo por tipo de ação */}
          {topAcoes.length > 0 && (
            <>
              <Text variant="titleMedium" style={styles.tituloSecao}>
                Principais Ações
              </Text>
              <Card style={styles.resumoCard}>
                <Card.Content style={styles.resumoContent}>
                  {topAcoes.map(([acao, count], idx) => {
                    const cor = acaoCores[acao] ?? cores.primaria;
                    const icone = acaoIcones[acao] ?? "information";
                    const percentual =
                      logs.length > 0
                        ? Math.round((count / logs.length) * 100)
                        : 0;

                    return (
                      <View
                        key={acao}
                        style={[
                          idx < topAcoes.length - 1 && {
                            borderBottomWidth: StyleSheet.hairlineWidth,
                            borderBottomColor: theme.colors.outlineVariant,
                            paddingBottom: 10,
                            marginBottom: 10,
                          },
                        ]}
                      >
                        <View style={styles.acaoTopo}>
                          <View style={styles.acaoNomeBox}>
                            <MaterialCommunityIcons
                              name={icone as any}
                              size={18}
                              color={cor}
                            />
                            <Text
                              variant="bodySmall"
                              style={styles.acaoNome}
                              numberOfLines={1}
                            >
                              {acaoLabel[acao] ?? acao}
                            </Text>
                          </View>
                          <Text
                            variant="labelMedium"
                            style={[styles.acaoContagem, { color: cor }]}
                          >
                            {count} ({percentual}%)
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.barraFundo,
                            { backgroundColor: theme.colors.surfaceVariant },
                          ]}
                        >
                          <View
                            style={[
                              styles.barraProgresso,
                              {
                                width: `${Math.max(percentual, 4)}%`,
                                backgroundColor: cor,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
                </Card.Content>
              </Card>
            </>
          )}

          {/* Cabeçalho da Atividade Recente com atalho "Ver tudo" */}
          <View style={styles.secaoHeaderRow}>
            <Text variant="titleMedium" style={styles.tituloSecaoSemMargem}>
              Atividade Recente
            </Text>
            <Button
              compact
              mode="text"
              icon="arrow-right"
              contentStyle={{ flexDirection: "row-reverse" }}
              onPress={() => navigation.navigate("Auditoria")}
            >
              Ver tudo
            </Button>
          </View>

          {logsRecentes.length === 0 ? (
            <Card style={styles.cardVazio}>
              <Card.Content>
                <Text
                  style={[
                    styles.textoVazio,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  Nenhum registro de auditoria
                </Text>
              </Card.Content>
            </Card>
          ) : (
            logsRecentes.map((log) => {
              const cor = acaoCores[log.acao] ?? cores.textoSecundario;
              const icone = acaoIcones[log.acao] ?? "information";
              return (
                <TouchableOpacity
                  key={log.id}
                  activeOpacity={0.75}
                  onPress={() => navigation.navigate("Auditoria")}
                >
                  <Card
                    style={[
                      styles.card,
                      { borderLeftColor: cor, borderLeftWidth: 4 },
                    ]}
                  >
                    <Card.Content style={styles.logContent}>
                      <MaterialCommunityIcons
                        name={icone as any}
                        size={20}
                        color={cor}
                        style={styles.logIcone}
                      />
                      <View style={styles.logInfo}>
                        <View style={styles.logHeaderRow}>
                          <Text
                            variant="titleSmall"
                            style={{ flex: 1 }}
                            numberOfLines={1}
                          >
                            {acaoLabel[log.acao] ?? log.acao}
                          </Text>
                          <Text
                            variant="labelSmall"
                            style={{
                              color: theme.colors.onSurfaceVariant,
                              marginLeft: 8,
                            }}
                          >
                            {new Date(log.dataHora).toLocaleTimeString(
                              "pt-BR",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </Text>
                        </View>
                        <Text
                          variant="bodySmall"
                          style={{
                            color: theme.colors.onSurfaceVariant,
                            marginTop: 2,
                          }}
                          numberOfLines={1}
                        >
                          {log.usuarioNome} · {log.entidadeAfetada} ·{" "}
                          {new Date(log.dataHora).toLocaleDateString("pt-BR")}
                        </Text>
                      </View>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              );
            })
          )}
        </>
      ) : minhasConsultas.length === 0 ? (
        <Card style={styles.cardVazio}>
          <Card.Content>
            <Text
              style={[
                styles.textoVazio,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Nenhuma consulta ativa no momento
            </Text>
          </Card.Content>
        </Card>
      ) : (
        minhasConsultas.map((c) => {
          const cor = statusCores[c.status] ?? cores.primaria;
          return (
            <Card
              key={c.id}
              style={[
                styles.card,
                { borderLeftColor: cor, borderLeftWidth: 4 },
              ]}
            >
              <Card.Content style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Avatar.Text
                    size={40}
                    label={iniciais(c.nomePaciente)}
                    style={{ backgroundColor: cor }}
                  />
                  <View style={styles.cardInfo}>
                    <Text variant="titleMedium">{c.nomePaciente}</Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {c.nomeMedico} ·{" "}
                      {new Date(c.dataConsulta).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
                <Chip
                  compact
                  style={{ backgroundColor: cor + (theme.dark ? "33" : "20") }}
                  textStyle={{
                    color: theme.dark ? "#e8eef5" : cor,
                    fontWeight: "bold",
                    fontSize: 11,
                    lineHeight: 16,
                  }}
                >
                  {statusLabels[c.status]}
                </Chip>
              </Card.Content>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  conteudo: { padding: 16, paddingBottom: 32 },
  centro: { flex: 1, justifyContent: "center", alignItems: "center" },
  saudacao: { fontWeight: "bold", marginBottom: 4 },
  subtitulo: { marginBottom: 16 },

  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    marginBottom: 20,
  },
  kpiWrapper: { width: "48.5%" },
  kpiCard: { borderRadius: 12 },
  kpiContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 8,
  },
  kpiIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  kpiTexts: { flex: 1 },
  kpiValor: { fontWeight: "800", marginTop: 1 },

  tituloSecao: { fontWeight: "bold", marginBottom: 10 },
  secaoHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  tituloSecaoSemMargem: { fontWeight: "bold" },

  resumoCard: { borderRadius: 12, marginBottom: 20 },
  resumoContent: { paddingVertical: 12 },
  acaoTopo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  acaoNomeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    paddingRight: 8,
  },
  acaoNome: { fontWeight: "600", flex: 1 },
  acaoContagem: { fontWeight: "700" },
  barraFundo: { height: 6, borderRadius: 3, overflow: "hidden" },
  barraProgresso: { height: "100%", borderRadius: 3 },

  card: { marginBottom: 10, borderRadius: 12 },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", flex: 1 },
  cardInfo: { marginLeft: 12, flex: 1 },

  logContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  logIcone: { marginRight: 10 },
  logInfo: { flex: 1 },
  logHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  cardVazio: { borderRadius: 12 },
  textoVazio: { textAlign: "center", paddingVertical: 20 },
});
