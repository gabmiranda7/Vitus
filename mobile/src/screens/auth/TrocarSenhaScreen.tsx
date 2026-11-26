import React, { useState } from "react";
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { TextInput, Button, Text, Surface, useTheme } from "react-native-paper";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import { cores } from "../../theme";
import LogoVitus from "../../components/LogoVitus";
import SenhaForteIndicador from "../../components/SenhaForteIndicador";
import { senhaEhForte } from "../../utils/senha";

export default function TrocarSenhaScreen() {
  const { atualizarUsuario, logout } = useAuth();
  const theme = useTheme();

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSalvar() {
    setErro("");
    if (!senhaAtual) return setErro("Informe a senha temporária");
    if (!senhaEhForte(novaSenha))
      return setErro("A nova senha não atende aos requisitos de segurança");
    if (novaSenha !== confirmacao)
      return setErro("A confirmação não confere com a nova senha");
    if (novaSenha === senhaAtual)
      return setErro("A nova senha deve ser diferente da temporária");

    setLoading(true);
    try {
      const r = await api.post("/api/auth/me/senha", { senhaAtual, novaSenha });
      // Token novo, já sem a restrição de senha temporária: libera o app
      await atualizarUsuario({ deveTrocarSenha: false }, r.data.token);
    } catch (e: any) {
      setErro(e.mensagemBack ?? "Não foi possível alterar a senha");
    } finally {
      setLoading(false);
    }
  }

  const olho = (
    <TextInput.Icon
      icon={mostrar ? "eye-off" : "eye"}
      onPress={() => setMostrar((v) => !v)}
      forceTextInputFocus={false}
    />
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Surface style={styles.card} elevation={2}>
          <LogoVitus size={64} />
          <Text
            variant="headlineSmall"
            style={[styles.titulo, { color: theme.colors.primary }]}
          >
            Crie uma nova senha
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.subtitulo, { color: theme.colors.onSurfaceVariant }]}
          >
            Você entrou com uma senha temporária. Defina uma senha só sua para
            continuar.
          </Text>

          {erro ? <Text style={styles.erro}>{erro}</Text> : null}

          <TextInput
            label="Senha temporária"
            value={senhaAtual}
            onChangeText={setSenhaAtual}
            secureTextEntry={!mostrar}
            autoCapitalize="none"
            mode="outlined"
            style={styles.input}
            right={olho}
          />
          <TextInput
            label="Nova senha"
            value={novaSenha}
            onChangeText={setNovaSenha}
            secureTextEntry={!mostrar}
            autoCapitalize="none"
            mode="outlined"
            style={styles.inputColado}
            right={olho}
          />
          <SenhaForteIndicador senha={novaSenha} />
          <TextInput
            label="Confirmar nova senha"
            value={confirmacao}
            onChangeText={setConfirmacao}
            secureTextEntry={!mostrar}
            autoCapitalize="none"
            mode="outlined"
            style={styles.input}
            right={olho}
          />

          <Button
            mode="contained"
            onPress={handleSalvar}
            loading={loading}
            disabled={loading}
            style={styles.botao}
          >
            Salvar nova senha
          </Button>
          <Button
            onPress={() => logout()}
            disabled={loading}
            style={styles.sair}
          >
            Sair
          </Button>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 20 },
  card: { padding: 24, borderRadius: 16 },
  titulo: { textAlign: "center", fontWeight: "bold", marginTop: 4 },
  subtitulo: { textAlign: "center", marginTop: 4, marginBottom: 20 },
  input: { marginBottom: 16 },
  inputColado: { marginBottom: 8 },
  botao: { marginTop: 4, paddingVertical: 4 },
  sair: { marginTop: 8 },
  erro: { color: cores.erro, textAlign: "center", marginBottom: 16 },
});
