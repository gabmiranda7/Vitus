import React, { useState } from "react";
import { StyleSheet, KeyboardAvoidingView, Platform, View } from "react-native";
import { TextInput, Button, Text, Surface, useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../contexts/AuthContext";
import { cores } from "../../theme";
import LogoVitus from "../../components/LogoVitus";
import ModalComTeclado from "../../components/ModalComTeclado";
import api from "../../services/api";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [esqueciAberto, setEsqueciAberto] = useState(false);
  const [emailEsqueci, setEmailEsqueci] = useState("");
  const [enviandoEsqueci, setEnviandoEsqueci] = useState(false);
  const [msgEsqueci, setMsgEsqueci] = useState("");
  const [erroEsqueci, setErroEsqueci] = useState("");
  const { login } = useAuth();
  const navigation = useNavigation<any>();
  const theme = useTheme();

  async function handleLogin() {
    setErro("");
    if (!email.trim() || !senha.trim()) {
      setErro("Preencha email e senha");
      return;
    }
    setLoading(true);
    try {
      await login(email, senha);
    } catch (error: any) {
      setErro(
        error.mensagemBack ??
          "Erro ao fazer login. Verifique suas credenciais.",
      );
    } finally {
      setLoading(false);
    }
  }

  function abrirEsqueci() {
    setEmailEsqueci(email);
    setMsgEsqueci("");
    setErroEsqueci("");
    setEsqueciAberto(true);
  }

  function fecharEsqueci() {
    if (!enviandoEsqueci) setEsqueciAberto(false);
  }

  async function enviarEsqueci() {
    setErroEsqueci("");
    if (!/^\S+@\S+\.\S+$/.test(emailEsqueci.trim())) {
      setErroEsqueci("Informe um e-mail válido");
      return;
    }
    setEnviandoEsqueci(true);
    try {
      const r = await api.post("/api/auth/esqueci-senha", {
        email: emailEsqueci.trim(),
      });
      setMsgEsqueci(
        r.data?.mensagem ??
          "Pedido registrado. O administrador vai gerar uma senha temporária para você.",
      );
    } catch (e: any) {
      setErroEsqueci(
        e.mensagemBack ?? "Não foi possível enviar o pedido. Tente novamente.",
      );
    } finally {
      setEnviandoEsqueci(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <Surface style={styles.card} elevation={2}>
        <LogoVitus size={80} />
        <Text
          variant="headlineMedium"
          style={[styles.titulo, { color: theme.colors.primary }]}
        >
          Vitus
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.subtitulo, { color: theme.colors.onSurfaceVariant }]}
        >
          Entre com sua conta
        </Text>

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry={!mostrarSenha}
          mode="outlined"
          style={styles.input}
          right={
            <TextInput.Icon
              icon={mostrarSenha ? "eye-off" : "eye"}
              onPress={() => setMostrarSenha((v) => !v)}
              forceTextInputFocus={false}
            />
          }
        />

        <Button compact onPress={abrirEsqueci} style={styles.linkEsqueci}>
          Esqueci minha senha
        </Button>

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.botao}
        >
          Entrar
        </Button>

        <Button
          onPress={() => navigation.navigate("Cadastro")}
          style={styles.linkCadastro}
        >
          Não tem conta? Cadastre-se
        </Button>
      </Surface>

      <ModalComTeclado visible={esqueciAberto} onDismiss={fecharEsqueci}>
        <Text variant="titleLarge" style={styles.modalTitulo}>
          Esqueci minha senha
        </Text>
        {msgEsqueci ? (
          <>
            <Text style={styles.modalTexto}>{msgEsqueci}</Text>
            <Button mode="contained" onPress={fecharEsqueci}>
              Fechar
            </Button>
          </>
        ) : (
          <>
            <Text
              style={[
                styles.modalTexto,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Informe seu e-mail. O administrador será avisado e vai gerar uma
              senha temporária para você, que deverá ser trocada no primeiro
              acesso.
            </Text>
            {erroEsqueci ? (
              <Text style={styles.erro}>{erroEsqueci}</Text>
            ) : null}
            <TextInput
              label="Email"
              value={emailEsqueci}
              onChangeText={setEmailEsqueci}
              autoCapitalize="none"
              keyboardType="email-address"
              mode="outlined"
              style={styles.input}
            />
            <View style={styles.modalBotoes}>
              <Button onPress={fecharEsqueci} disabled={enviandoEsqueci}>
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={enviarEsqueci}
                loading={enviandoEsqueci}
                disabled={enviandoEsqueci || !emailEsqueci.trim()}
              >
                Solicitar
              </Button>
            </View>
          </>
        )}
      </ModalComTeclado>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    padding: 24,
    borderRadius: 16,
  },
  titulo: {
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitulo: {
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  botao: {
    marginTop: 8,
    paddingVertical: 4,
  },
  linkCadastro: {
    marginTop: 12,
  },
  linkEsqueci: {
    alignSelf: "flex-end",
    marginTop: -8,
  },
  modalTitulo: {
    marginBottom: 12,
    fontWeight: "bold",
  },
  modalTexto: {
    marginBottom: 16,
  },
  modalBotoes: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  erro: {
    color: cores.erro,
    textAlign: "center",
    marginBottom: 16,
  },
});
