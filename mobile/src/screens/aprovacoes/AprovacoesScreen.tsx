import React, { useEffect, useState, useMemo } from "react";
import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import {
  Text,
  Card,
  Chip,
  Avatar,
  Button,
  ActivityIndicator,
  Searchbar,
  Snackbar,
  SegmentedButtons,
  useTheme,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import api from "../../services/api";
import { cores, corAvatar, iniciais } from "../../theme";
import ConfirmModal from "../../components/ConfirmModal";

interface UsuarioItem {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  status?: string;
  crm?: string | null;
  especialidade?: string | null;
  coren?: string | null;
  especializacao?: string | null;
}

const perfilLabel: Record<string, string> = {
  Administrador: "Administrador",
  Medico: "Médico",
  Enfermeiro: "Enfermeiro(a)",
  Recepcionista: "Recepcionista",
};

const perfilCor: Record<string, string> = {
  Administrador: "#37474f",
  Medico: cores.primariaEscura,
  Enfermeiro: cores.sucesso,
  Recepcionista: cores.secundaria,
};

type Acao = "aprovar" | "recusar" | "desativar" | "reativar";

export default function AprovacoesScreen() {
  const theme = useTheme();
  const [aba, setAba] = useState<"pendentes" | "usuarios">("pendentes");
  const [pendentes, setPendentes] = useState<UsuarioItem[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState("");
  const [feedback, setFeedback] = useState("");

  const [busca, setBusca] = useState("");
  const [filtroPerfil, setFiltroPerfil] = useState("");

  const [selecionado, setSelecionado] = useState<UsuarioItem | null>(null);
  const [acao, setAcao] = useState<Acao | null>(null);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const [resPendentes, resUsuarios] = await Promise.all([
        api.get("/api/auth/pendentes"),
        api.get("/api/auth/usuarios"),
      ]);
      setPendentes(resPendentes.data);
      setUsuarios(resUsuarios.data);
      setErro("");
    } catch (e: any) {
      setErro(e.mensagemBack ?? "Erro ao carregar dados de usuários");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    carregar();
  }

  const listaAtual = aba === "pendentes" ? pendentes : usuarios;

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase();
    return listaAtual.filter(
      (u) =>
        (filtroPerfil === "" || u.perfil === filtroPerfil) &&
        (q === "" ||
          u.nome.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)),
    );
  }, [listaAtual, busca, filtroPerfil]);

  function pedirConfirmacao(usuario: UsuarioItem, tipo: Acao) {
    setSelecionado(usuario);
    setAcao(tipo);
  }

  function fecharConfirmacao() {
    if (processando) return;
    setSelecionado(null);
    setAcao(null);
  }

  async function confirmar() {
    if (!selecionado || !acao) return;
    const nomeAlvo = selecionado.nome;
    const tipoAcao = acao;
    setProcessando(true);
    try {
      await api.patch(`/api/auth/${selecionado.id}/${tipoAcao}`);
      setSelecionado(null);
      setAcao(null);
      const mensagens: Record<Acao, string> = {
        aprovar: `Cadastro de ${nomeAlvo} aprovado.`,
        recusar: `Cadastro de ${nomeAlvo} recusado.`,
        desativar: `Acesso de ${nomeAlvo} desativado.`,
        reativar: `Acesso de ${nomeAlvo} reativado.`,
      };
      setFeedback(mensagens[tipoAcao]);
      await carregar();
    } catch (e: any) {
      setErro(e.mensagemBack ?? "Erro ao processar a solicitação");
      setSelecionado(null);
      setAcao(null);
    } finally {
      setProcessando(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const acaoPositiva = acao === "aprovar" || acao === "reativar";

  const modalTitulos: Record<Acao, string> = {
    aprovar: "Aprovar cadastro",
    recusar: "Recusar cadastro",
    desativar: "Desativar acesso",
    reativar: "Reativar acesso",
  };

  const modalMensagens: Record<Acao, string> = {
    aprovar: `${selecionado?.nome} poderá entrar no sistema com o email e a senha que cadastrou.`,
    recusar: `${selecionado?.nome} não conseguirá entrar no sistema e verá que o cadastro não foi aprovado.`,
    desativar: `${selecionado?.nome} perderá o acesso ao sistema até ser reativado.`,
    reativar: `${selecionado?.nome} voltará a ter acesso normal ao sistema.`,
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.conteudo}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <SegmentedButtons
          density="small"
          value={aba}
          onValueChange={(v) => {
            setAba(v as "pendentes" | "usuarios");
            setFiltroPerfil("");
          }}
          buttons={[
            {
              value: "pendentes",
              label: `Pendentes (${pendentes.length})`,
              icon: "account-clock-outline",
            },
            {
              value: "usuarios",
              label: `Usuários (${usuarios.length})`,
              icon: "account-group-outline",
            },
          ]}
          style={{ marginBottom: 10 }}
        />

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        {listaAtual.length > 0 && (
          <View style={styles.filtrosBox}>
            <Searchbar
              placeholder="Buscar por nome ou e-mail..."
              value={busca}
              onChangeText={setBusca}
              style={styles.busca}
              inputStyle={styles.buscaInput}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
            >
              <Chip
                compact
                selected={filtroPerfil === ""}
                onPress={() => setFiltroPerfil("")}
                textStyle={styles.chipTexto}
              >
                Todos
              </Chip>
              {Object.entries(perfilLabel)
                .filter(
                  ([key]) => aba === "usuarios" || key !== "Administrador",
                )
                .map(([key, label]) => (
                  <Chip
                    key={key}
                    compact
                    selected={filtroPerfil === key}
                    onPress={() =>
                      setFiltroPerfil(filtroPerfil === key ? "" : key)
                    }
                    textStyle={styles.chipTexto}
                  >
                    {label}
                  </Chip>
                ))}
            </ScrollView>
          </View>
        )}

        {listaAtual.length === 0 ? (
          <View style={styles.vazio}>
            <MaterialCommunityIcons
              name="account-check-outline"
              size={52}
              color={theme.colors.onSurfaceVariant}
              style={{ opacity: 0.3 }}
            />
            <Text
              style={[
                styles.textoVazio,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {aba === "pendentes"
                ? "Nenhum cadastro aguardando aprovação"
                : "Nenhum usuário cadastrado"}
            </Text>
          </View>
        ) : filtrados.length === 0 ? (
          <View style={styles.vazio}>
            <Text
              style={[
                styles.textoVazio,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Nenhum usuário corresponde ao filtro
            </Text>
          </View>
        ) : (
          filtrados.map((u) => {
            const cor = perfilCor[u.perfil] ?? cores.textoSecundario;
            const isInativo = u.status === "Inativo";
            const isAdmin = u.perfil === "Administrador";

            return (
              <Card
                key={u.id}
                style={[
                  styles.card,
                  {
                    borderLeftColor: isInativo ? "#9e9e9e" : cor,
                    borderLeftWidth: 4,
                    opacity: isInativo ? 0.78 : 1,
                  },
                ]}
              >
                <Card.Content style={styles.cardContent}>
                  <View style={styles.linhaUsuario}>
                    <Avatar.Text
                      size={36}
                      label={iniciais(u.nome)}
                      labelStyle={{ fontSize: 13, fontWeight: "700" }}
                      style={{
                        backgroundColor: isInativo
                          ? "#757575"
                          : corAvatar(u.nome),
                      }}
                    />
                    <View style={styles.info}>
                      <Text
                        variant="titleSmall"
                        numberOfLines={1}
                        style={{ fontWeight: "700" }}
                      >
                        {u.nome}
                      </Text>
                      <Text
                        variant="bodySmall"
                        numberOfLines={1}
                        style={{
                          color: theme.colors.onSurfaceVariant,
                          fontSize: 11.5,
                        }}
                      >
                        {u.email}
                      </Text>
                      {aba === "pendentes" && u.perfil === "Medico" && (
                        <Text
                          variant="bodySmall"
                          style={{
                            color: theme.colors.onSurfaceVariant,
                            fontSize: 11.5,
                          }}
                        >
                          CRM: {u.crm ?? "—"} · {u.especialidade ?? "—"}
                        </Text>
                      )}
                      {aba === "pendentes" && u.perfil === "Enfermeiro" && (
                        <Text
                          variant="bodySmall"
                          style={{
                            color: theme.colors.onSurfaceVariant,
                            fontSize: 11.5,
                          }}
                        >
                          COREN: {u.coren ?? "—"}
                          {u.especializacao ? ` · ${u.especializacao}` : ""}
                        </Text>
                      )}
                      <View style={styles.chipsLinha}>
                        <Chip
                          compact
                          style={[
                            styles.chipPerfil,
                            {
                              backgroundColor: cor + (theme.dark ? "33" : "20"),
                            },
                          ]}
                          textStyle={[
                            styles.chipTexto,
                            { color: theme.dark ? "#e8eef5" : cor },
                          ]}
                        >
                          {perfilLabel[u.perfil] ?? u.perfil}
                        </Chip>
                        {aba === "usuarios" && (
                          <Chip
                            compact
                            style={[
                              styles.chipPerfil,
                              {
                                backgroundColor: isInativo
                                  ? theme.colors.surfaceVariant
                                  : cores.sucesso + (theme.dark ? "33" : "20"),
                              },
                            ]}
                            textStyle={[
                              styles.chipTexto,
                              {
                                color: isInativo
                                  ? theme.colors.onSurfaceVariant
                                  : cores.sucesso,
                              },
                            ]}
                          >
                            {isInativo ? "Inativo" : "Ativo"}
                          </Chip>
                        )}
                      </View>
                    </View>

                    {/* Botões compactos à direita */}
                    {aba === "pendentes" ? (
                      <View style={styles.botoesDireita}>
                        <Button
                          compact
                          mode="outlined"
                          textColor={cores.erro}
                          onPress={() => pedirConfirmacao(u, "recusar")}
                          labelStyle={styles.botaoLabel}
                          style={[
                            styles.botaoCompacto,
                            { borderColor: cores.erro },
                          ]}
                        >
                          Recusar
                        </Button>
                        <Button
                          compact
                          mode="contained"
                          buttonColor={cores.sucesso}
                          onPress={() => pedirConfirmacao(u, "aprovar")}
                          labelStyle={styles.botaoLabel}
                          style={styles.botaoCompacto}
                        >
                          Aprovar
                        </Button>
                      </View>
                    ) : (
                      !isAdmin &&
                      (isInativo ? (
                        <Button
                          compact
                          mode="contained"
                          buttonColor={cores.sucesso}
                          icon="lock-open-outline"
                          onPress={() => pedirConfirmacao(u, "reativar")}
                          labelStyle={styles.botaoLabel}
                          style={styles.botaoCompacto}
                        >
                          Reativar
                        </Button>
                      ) : (
                        <Button
                          compact
                          mode="outlined"
                          textColor={cores.erro}
                          icon="block-helper"
                          onPress={() => pedirConfirmacao(u, "desativar")}
                          labelStyle={styles.botaoLabel}
                          style={[
                            styles.botaoCompacto,
                            { borderColor: cores.erro },
                          ]}
                        >
                          Desativar
                        </Button>
                      ))
                    )}
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>

      {acao && (
        <ConfirmModal
          visible={!!selecionado}
          titulo={modalTitulos[acao]}
          mensagem={modalMensagens[acao]}
          corBotao={acaoPositiva ? cores.sucesso : cores.erro}
          onClose={fecharConfirmacao}
          onConfirmar={confirmar}
          loading={processando}
        />
      )}

      <Snackbar
        visible={!!feedback}
        onDismiss={() => setFeedback("")}
        duration={3000}
      >
        {feedback}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  centro: { flex: 1, justifyContent: "center", alignItems: "center" },
  conteudo: { padding: 12, paddingBottom: 28 },
  erro: { color: cores.erro, marginBottom: 10, fontSize: 13 },

  filtrosBox: { marginBottom: 10 },
  busca: { marginBottom: 6, height: 42 },
  buscaInput: { minHeight: 42, fontSize: 13 },
  chipsScroll: { gap: 5 },
  chipTexto: { fontSize: 11, lineHeight: 14, marginVertical: 1 },

  card: { marginBottom: 8, borderRadius: 10 },
  cardContent: { paddingVertical: 10, paddingHorizontal: 12 },
  linhaUsuario: { flexDirection: "row", alignItems: "center", gap: 8 },
  info: { flex: 1 },
  chipsLinha: { flexDirection: "row", gap: 5, marginTop: 4, flexWrap: "wrap" },
  chipPerfil: { alignSelf: "flex-start" },
  botoesDireita: { flexDirection: "row", gap: 6, flexShrink: 0 },
  botaoCompacto: { borderRadius: 7 },
  botaoLabel: { fontSize: 11.5, marginHorizontal: 8, marginVertical: 4 },
  vazio: { alignItems: "center", marginTop: 50 },
  textoVazio: { marginTop: 10, fontSize: 14, textAlign: "center" },
});
