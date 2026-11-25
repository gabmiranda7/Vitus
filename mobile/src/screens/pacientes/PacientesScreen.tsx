import React, { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import {
  Text,
  Card,
  Avatar,
  Searchbar,
  ActivityIndicator,
  FAB,
  TextInput,
  Button,
  IconButton,
  SegmentedButtons,
  Chip,
  Snackbar,
  useTheme,
} from "react-native-paper";
import api from "../../services/api";
import { useAtualizacaoAutomatica } from "../../hooks/useAtualizacaoAutomatica";
import { Paciente } from "../../types";
import { cores, corAvatar, iniciais } from "../../theme";
import ModalComTeclado from "../../components/ModalComTeclado";
import ConfirmModal from "../../components/ConfirmModal";

function calcularIdade(dataNascimento?: string): string {
  if (!dataNascimento) return "";
  const hoje = new Date();
  const nasc = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return `${idade} anos`;
}

function formatarCpf(valor: string): string {
  const s = valor.replace(/\D/g, "").slice(0, 11);
  if (s.length <= 3) return s;
  if (s.length <= 6) return `${s.slice(0, 3)}.${s.slice(3)}`;
  if (s.length <= 9) return `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6)}`;
  return `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6, 9)}-${s.slice(9, 11)}`;
}

function formatarCartaoSus(valor: string): string {
  const s = valor.replace(/\D/g, "").slice(0, 15);
  if (s.length <= 3) return s;
  if (s.length <= 7) return `${s.slice(0, 3)}.${s.slice(3)}`;
  if (s.length <= 11) return `${s.slice(0, 3)}.${s.slice(3, 7)}.${s.slice(7)}`;
  return `${s.slice(0, 3)}.${s.slice(3, 7)}.${s.slice(7, 11)}.${s.slice(11, 15)}`;
}

function formatarDataBr(valor: string): string {
  const s = valor.replace(/\D/g, "").slice(0, 8);
  if (s.length <= 2) return s;
  if (s.length <= 4) return `${s.slice(0, 2)}/${s.slice(2)}`;
  return `${s.slice(0, 2)}/${s.slice(2, 4)}/${s.slice(4, 8)}`;
}

function dataBrParaIso(dataBr: string): string {
  const partes = dataBr.split("/");
  if (partes.length !== 3) return "";
  const [dia, mes, ano] = partes;
  if (dia.length !== 2 || mes.length !== 2 || ano.length !== 4) return "";
  return `${ano}-${mes}-${dia}`;
}

function dataIsoParaBr(dataIso: string): string {
  const partes = dataIso.substring(0, 10).split("-");
  if (partes.length !== 3) return "";
  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
}

const formVazio = () => ({
  nome: "",
  cpf: "",
  cartaoSus: "",
  dataNascimento: "",
  sexo: "",
  nomePai: "",
  nomeMae: "",
  endereco: "",
  profissao: "",
  estadoCivil: "",
  informacoesAdicionais: "",
});

export default function PacientesScreen() {
  const theme = useTheme();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [mostrarInativos, setMostrarInativos] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Paciente | null>(null);
  const [form, setForm] = useState(formVazio());
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erroLista, setErroLista] = useState("");

  const [alterarStatus, setAlterarStatus] = useState<{
    paciente: Paciente;
    acao: "inativar" | "reativar";
  } | null>(null);
  const [alterando, setAlterando] = useState(false);
  const [feedback, setFeedback] = useState("");

  useAtualizacaoAutomatica(carregar, 15000);

  async function carregar() {
    try {
      const response = await api.get("/api/Paciente", {
        params: { incluirInativos: true },
      });
      setPacientes(response.data);
      setErroLista("");
    } catch (e: any) {
      setErroLista(e.mensagemBack ?? "Não foi possível carregar os pacientes");
    } finally {
      setLoading(false);
    }
  }

  function setField(campo: string, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function abrirCadastro() {
    setEditando(null);
    setForm(formVazio());
    setErro("");
    setModalAberto(true);
  }

  function abrirEdicao(p: Paciente) {
    setEditando(p);
    setForm({
      nome: p.nome,
      cpf: p.cpf ?? "",
      cartaoSus: p.cartaoSus ?? "",
      dataNascimento: p.dataNascimento ? dataIsoParaBr(p.dataNascimento) : "",
      sexo: p.sexo ?? "",
      nomePai: p.nomePai ?? "",
      nomeMae: p.nomeMae ?? "",
      endereco: p.endereco ?? "",
      profissao: p.profissao ?? "",
      estadoCivil: p.estadoCivil ?? "",
      informacoesAdicionais: p.informacoesAdicionais ?? "",
    });
    setErro("");
    setModalAberto(true);
  }

  function fechar() {
    setModalAberto(false);
    setEditando(null);
    setForm(formVazio());
    setErro("");
  }

  async function salvar() {
    setErro("");
    if (!form.nome.trim()) {
      setErro("Nome é obrigatório");
      return;
    }
    setSalvando(true);
    try {
      const payload = {
        nome: form.nome,
        cpf: form.cpf || null,
        cartaoSus: form.cartaoSus || null,
        dataNascimento: form.dataNascimento
          ? dataBrParaIso(form.dataNascimento)
          : null,
        sexo: form.sexo || null,
        nomePai: form.nomePai || null,
        nomeMae: form.nomeMae || null,
        endereco: form.endereco || null,
        profissao: form.profissao || null,
        estadoCivil: form.estadoCivil || null,
        informacoesAdicionais: form.informacoesAdicionais || null,
        aceitaTermos: true,
      };
      if (editando) {
        await api.put(`/api/Paciente/${editando.id}`, payload);
      } else {
        await api.post("/api/Paciente", payload);
      }
      fechar();
      carregar();
    } catch (e: any) {
      setErro(e.mensagemBack ?? "Erro ao salvar paciente");
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarAlteracaoStatus() {
    if (!alterarStatus) return;
    const { paciente, acao } = alterarStatus;
    setAlterando(true);
    try {
      await api.patch(`/api/Paciente/${paciente.id}/${acao}`);
      setFeedback(
        acao === "inativar"
          ? `${paciente.nome} inativado.`
          : `${paciente.nome} reativado.`,
      );
      setAlterarStatus(null);
      await carregar();
    } catch (e: any) {
      setFeedback(e.mensagemBack ?? "Erro ao alterar o status do paciente");
      setAlterarStatus(null);
    } finally {
      setAlterando(false);
    }
  }

  const totalAtivos = pacientes.filter((p) => p.ativo !== false).length;

  const filtrados = pacientes.filter(
    (p) =>
      (mostrarInativos || p.ativo !== false) &&
      p.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  if (loading) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const reativando = alterarStatus?.acao === "reativar";

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar paciente..."
        value={busca}
        onChangeText={setBusca}
        style={styles.busca}
      />

      <View style={styles.filtroLinha}>
        <Chip
          compact
          icon={mostrarInativos ? "eye-off" : "eye"}
          selected={mostrarInativos}
          onPress={() => setMostrarInativos((v) => !v)}
        >
          Mostrar inativos
        </Chip>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {filtrados.length} de{" "}
          {mostrarInativos ? pacientes.length : totalAtivos} paciente(s)
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.lista}>
        {erroLista ? <Text style={styles.erroLista}>{erroLista}</Text> : null}

        {filtrados.length === 0 ? (
          <Text
            style={[
              styles.textoVazio,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {erroLista ? "" : "Nenhum paciente encontrado"}
          </Text>
        ) : (
          filtrados.map((p) => {
            const inativo = p.ativo === false;
            return (
              <Card
                key={p.id}
                style={[styles.card, inativo && styles.cardInativo]}
              >
                <Card.Content style={styles.cardContent}>
                  <Avatar.Text
                    size={44}
                    label={iniciais(p.nome)}
                    style={{ backgroundColor: corAvatar(p.nome) }}
                  />
                  <View style={styles.info}>
                    <Text variant="titleMedium">{p.nome}</Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {[calcularIdade(p.dataNascimento), p.sexo]
                        .filter(Boolean)
                        .join(" · ") || "Sem dados"}
                    </Text>
                    {inativo && (
                      <Chip
                        compact
                        style={styles.chipInativo}
                        textStyle={styles.chipInativoTexto}
                      >
                        Inativo
                      </Chip>
                    )}
                  </View>
                  {!inativo && (
                    <IconButton
                      icon="pencil"
                      size={20}
                      onPress={() => abrirEdicao(p)}
                    />
                  )}
                  <IconButton
                    icon={inativo ? "account-check" : "account-cancel"}
                    iconColor={inativo ? cores.sucesso : cores.erro}
                    size={20}
                    onPress={() =>
                      setAlterarStatus({
                        paciente: p,
                        acao: inativo ? "reativar" : "inativar",
                      })
                    }
                  />
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>

      <FAB icon="plus" style={styles.fab} onPress={abrirCadastro} />

      <ModalComTeclado visible={modalAberto} onDismiss={fechar}>
        <Text variant="titleLarge" style={styles.tituloModal}>
          {editando ? "Editar Paciente" : "Novo Paciente"}
        </Text>
        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        <TextInput
          label="Nome completo *"
          value={form.nome}
          onChangeText={(v) => setField("nome", v)}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="CPF"
          value={form.cpf}
          onChangeText={(v) => setField("cpf", formatarCpf(v))}
          mode="outlined"
          style={styles.input}
          placeholder="000.000.000-00"
          keyboardType="numeric"
          maxLength={14}
        />
        <TextInput
          label="Cartão SUS"
          value={form.cartaoSus}
          onChangeText={(v) => setField("cartaoSus", formatarCartaoSus(v))}
          mode="outlined"
          style={styles.input}
          placeholder="000.0000.0000.0000"
          keyboardType="numeric"
          maxLength={18}
        />
        <TextInput
          label="Data de Nascimento"
          value={form.dataNascimento}
          onChangeText={(v) => setField("dataNascimento", formatarDataBr(v))}
          mode="outlined"
          style={styles.input}
          placeholder="DD/MM/AAAA"
          keyboardType="numeric"
          maxLength={10}
        />

        <Text variant="labelLarge" style={styles.label}>
          Sexo
        </Text>
        <SegmentedButtons
          value={form.sexo}
          onValueChange={(v) => setField("sexo", v)}
          buttons={[
            { value: "Masculino", label: "M" },
            { value: "Feminino", label: "F" },
            { value: "Outro", label: "Outro" },
          ]}
          style={styles.segmented}
        />

        <TextInput
          label="Nome do Pai"
          value={form.nomePai}
          onChangeText={(v) => setField("nomePai", v)}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Nome da Mãe"
          value={form.nomeMae}
          onChangeText={(v) => setField("nomeMae", v)}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Profissão"
          value={form.profissao}
          onChangeText={(v) => setField("profissao", v)}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Endereço"
          value={form.endereco}
          onChangeText={(v) => setField("endereco", v)}
          mode="outlined"
          style={styles.input}
          multiline
        />
        <TextInput
          label="Informações médicas adicionais"
          value={form.informacoesAdicionais}
          onChangeText={(v) => setField("informacoesAdicionais", v)}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={3}
          placeholder="Alergias, condições especiais..."
        />

        <View style={styles.botoes}>
          <Button onPress={fechar} disabled={salvando}>
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={salvar}
            loading={salvando}
            disabled={salvando}
          >
            {editando ? "Salvar" : "Cadastrar"}
          </Button>
        </View>
      </ModalComTeclado>

      <ConfirmModal
        visible={!!alterarStatus}
        titulo={reativando ? "Reativar paciente" : "Inativar paciente"}
        mensagem={
          reativando
            ? `${alterarStatus?.paciente.nome} voltará às listas e poderá ter novas consultas agendadas.`
            : `${alterarStatus?.paciente.nome} deixará de aparecer nas listas e não poderá ter novas consultas. O prontuário, as consultas e os exames continuam guardados, e você pode reativá-lo depois.`
        }
        corBotao={reativando ? cores.sucesso : cores.erro}
        onClose={() => {
          if (!alterando) setAlterarStatus(null);
        }}
        onConfirmar={confirmarAlteracaoStatus}
        loading={alterando}
      />

      <Snackbar
        visible={!!feedback}
        onDismiss={() => setFeedback("")}
        duration={4000}
      >
        {feedback}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  centro: { flex: 1, justifyContent: "center", alignItems: "center" },
  busca: { margin: 16, marginBottom: 8 },
  filtroLinha: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  lista: { padding: 16, paddingTop: 8, paddingBottom: 80 },
  erroLista: { color: cores.erro, textAlign: "center", marginBottom: 12 },
  card: { marginBottom: 10, borderRadius: 12 },
  cardInativo: { opacity: 0.6 },
  cardContent: { flexDirection: "row", alignItems: "center" },
  info: { marginLeft: 12, flex: 1 },
  chipInativo: { alignSelf: "flex-start", marginTop: 4 },
  chipInativoTexto: { fontSize: 11, lineHeight: 16, marginVertical: 2 },
  textoVazio: { textAlign: "center", marginTop: 40 },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: cores.primaria,
  },
  tituloModal: { marginBottom: 16, fontWeight: "bold" },
  label: { marginBottom: 8, marginTop: 4 },
  segmented: { marginBottom: 12 },
  input: { marginBottom: 12 },
  botoes: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  erro: { color: cores.erro, marginBottom: 12 },
});
