import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Text, TextInput, Button, Surface, SegmentedButtons,
  ProgressBar, Chip, HelperText
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';

const PERFIS = [
  { value: 'Medico', label: 'Médico' },
  { value: 'Enfermeiro', label: 'Enfermeiro(a)' },
  { value: 'Recepcionista', label: 'Recepcionista' },
];

export default function CadastroScreen() {
  const navigation = useNavigation<any>();
  const [step, setStep] = useState(0);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState('');
  const [crm, setCrm] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [coren, setCoren] = useState('');
  const [especializacao, setEspecializacao] = useState('');

  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  function proximo() {
    setErro('');
    if (step === 0) {
      if (!nome.trim() || !email.trim() || !senha.trim()) {
        setErro('Preencha todos os campos');
        return;
      }
      if (senha.length < 6) {
        setErro('A senha deve ter no mínimo 6 caracteres');
        return;
      }
    }
    if (step === 1) {
      if (!perfil) {
        setErro('Selecione um perfil');
        return;
      }
      if (perfil === 'Medico' && (!crm.trim() || !especialidade.trim())) {
        setErro('CRM e especialidade são obrigatórios');
        return;
      }
      if (perfil === 'Enfermeiro' && !coren.trim()) {
        setErro('COREN é obrigatório');
        return;
      }
    }
    setStep(s => s + 1);
  }

  async function finalizar() {
    setErro('');
    setLoading(true);
    try {
      await api.post('/api/auth/registrar', {
        nome, email, senha, perfil,
        ...(perfil === 'Medico' && { crm, especialidade }),
        ...(perfil === 'Enfermeiro' && { coren, especializacao: especializacao || undefined }),
      });
      setSucesso(true);
      setTimeout(() => navigation.navigate('Login'), 1500);
    } catch (e: any) {
      setErro(e.mensagemBack ?? 'Erro ao realizar cadastro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Surface style={styles.card} elevation={2}>
          <Text variant="headlineSmall" style={styles.titulo}>Criar conta</Text>
          <ProgressBar progress={(step + 1) / 3} style={styles.progresso} />

          {erro ? <Text style={styles.erro}>{erro}</Text> : null}
          {sucesso ? <Text style={styles.sucesso}>Cadastro realizado! Redirecionando...</Text> : null}

          {step === 0 && (
            <View>
              <TextInput
                label="Nome completo"
                value={nome}
                onChangeText={setNome}
                mode="outlined"
                style={styles.input}
              />
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
                secureTextEntry
                mode="outlined"
                style={styles.input}
              />
              <HelperText type="info">Mínimo de 6 caracteres</HelperText>
            </View>
          )}

          {step === 1 && (
            <View>
              <Text variant="labelLarge" style={styles.label}>Perfil</Text>
              <SegmentedButtons
                value={perfil}
                onValueChange={setPerfil}
                buttons={PERFIS.map(p => ({ value: p.value, label: p.label }))}
                style={styles.segmented}
              />

              {perfil === 'Medico' && (
                <>
                  <TextInput
                    label="CRM"
                    value={crm}
                    onChangeText={setCrm}
                    mode="outlined"
                    style={styles.input}
                    placeholder="Ex: CRM-MG 12345"
                  />
                  <TextInput
                    label="Especialidade"
                    value={especialidade}
                    onChangeText={setEspecialidade}
                    mode="outlined"
                    style={styles.input}
                    placeholder="Ex: Clínico Geral"
                  />
                </>
              )}

              {perfil === 'Enfermeiro' && (
                <>
                  <TextInput
                    label="COREN"
                    value={coren}
                    onChangeText={setCoren}
                    mode="outlined"
                    style={styles.input}
                    placeholder="Ex: COREN-MG 123456"
                  />
                  <TextInput
                    label="Especialização (opcional)"
                    value={especializacao}
                    onChangeText={setEspecializacao}
                    mode="outlined"
                    style={styles.input}
                    placeholder="Ex: UTI, Obstetrícia..."
                  />
                </>
              )}
            </View>
          )}

          {step === 2 && (
            <View>
              <Text variant="bodyMedium" style={styles.confirmacaoTexto}>
                Confirme seus dados:
              </Text>
              <Chip icon="account" style={styles.chipInfo}>{nome}</Chip>
              <Chip icon="email" style={styles.chipInfo}>{email}</Chip>
              <Chip icon="badge-account" style={styles.chipInfo}>
                {PERFIS.find(p => p.value === perfil)?.label}
                {perfil === 'Medico' && ` · ${crm} · ${especialidade}`}
                {perfil === 'Enfermeiro' && ` · ${coren}${especializacao ? ` · ${especializacao}` : ''}`}
              </Chip>
            </View>
          )}

          <View style={styles.botoes}>
            {step > 0 && (
              <Button onPress={() => setStep(s => s - 1)} disabled={loading}>Voltar</Button>
            )}
            {step < 2 ? (
              <Button mode="contained" onPress={proximo} style={styles.botaoPrincipal}>
                Próximo
              </Button>
            ) : (
              <Button mode="contained" onPress={finalizar} loading={loading} disabled={loading} style={styles.botaoPrincipal}>
                Finalizar Cadastro
              </Button>
            )}
          </View>

          <Button onPress={() => navigation.navigate('Login')} style={styles.linkLogin}>
            Já tenho conta — Entrar
          </Button>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e3f2fd' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { padding: 24, borderRadius: 16 },
  titulo: { fontWeight: 'bold', color: '#1565c0', marginBottom: 12, textAlign: 'center' },
  progresso: { marginBottom: 20, borderRadius: 4 },
  label: { marginBottom: 8 },
  segmented: { marginBottom: 16 },
  input: { marginBottom: 8 },
  confirmacaoTexto: { marginBottom: 12, color: '#666' },
  chipInfo: { marginBottom: 8, alignSelf: 'flex-start' },
  botoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  botaoPrincipal: { flex: 1 },
  linkLogin: { marginTop: 12 },
  erro: { color: '#d32f2f', marginBottom: 12, textAlign: 'center' },
  sucesso: { color: '#2e7d32', marginBottom: 12, textAlign: 'center' },
});