import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, Chip, Avatar, Button, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { cores, corAvatar, iniciais } from '../../theme';
import ConfirmModal from '../../components/ConfirmModal';

interface UsuarioPendente {
  id: string;
  nome: string;
  email: string;
  perfil: string;
}

const perfilLabel: Record<string, string> = {
  Medico: 'Médico',
  Enfermeiro: 'Enfermeiro(a)',
  Recepcionista: 'Recepcionista',
};

const perfilCor: Record<string, string> = {
  Medico: cores.primariaEscura,
  Enfermeiro: cores.sucesso,
  Recepcionista: cores.secundaria,
};

type Acao = 'aprovar' | 'recusar';

export default function AprovacoesScreen() {
  const [pendentes, setPendentes] = useState<UsuarioPendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState('');

  const [selecionado, setSelecionado] = useState<UsuarioPendente | null>(null);
  const [acao, setAcao] = useState<Acao | null>(null);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const response = await api.get('/api/auth/pendentes');
      setPendentes(response.data);
      setErro('');
    } catch (e: any) {
      setErro(e.mensagemBack ?? 'Erro ao carregar cadastros pendentes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    carregar();
  }

  function pedirConfirmacao(usuario: UsuarioPendente, tipo: Acao) {
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
    setProcessando(true);
    try {
      await api.patch(`/api/auth/${selecionado.id}/${acao}`);
      setSelecionado(null);
      setAcao(null);
      await carregar();
    } catch (e: any) {
      setErro(e.mensagemBack ?? 'Erro ao processar a solicitação');
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

  const aprovando = acao === 'aprovar';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.conteudo}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.cabecalho}>
          <Text variant="titleLarge" style={styles.titulo}>Cadastros pendentes</Text>
          <Chip compact style={{ backgroundColor: cores.aviso + '20' }} textStyle={{ color: cores.aviso, fontWeight: 'bold' }}>
            {pendentes.length}
          </Chip>
        </View>

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        {pendentes.length === 0 ? (
          <View style={styles.vazio}>
            <MaterialCommunityIcons name="account-check-outline" size={64} color={cores.textoDesabilitado} />
            <Text style={styles.textoVazio}>Nenhum cadastro aguardando aprovação</Text>
            <Text variant="bodySmall" style={styles.textoVazioSub}>
              Puxe a tela para baixo para atualizar a lista.
            </Text>
          </View>
        ) : (
          pendentes.map((u) => {
            const cor = perfilCor[u.perfil] ?? cores.textoSecundario;
            return (
              <Card key={u.id} style={[styles.card, { borderLeftColor: cor, borderLeftWidth: 4 }]}>
                <Card.Content>
                  <View style={styles.linhaUsuario}>
                    <Avatar.Text size={44} label={iniciais(u.nome)} style={{ backgroundColor: corAvatar(u.nome) }} />
                    <View style={styles.info}>
                      <Text variant="titleMedium">{u.nome}</Text>
                      <Text variant="bodySmall" style={styles.email}>{u.email}</Text>
                      <Chip
                        compact
                        style={[styles.chipPerfil, { backgroundColor: cor + '20' }]}
                        textStyle={{ color: cor, fontSize: 11 }}
                      >
                        {perfilLabel[u.perfil] ?? u.perfil}
                      </Chip>
                    </View>
                  </View>

                  <View style={styles.botoes}>
                    <Button
                      mode="outlined" textColor={cores.erro} icon="close-circle"
                      onPress={() => pedirConfirmacao(u, 'recusar')}
                      style={[styles.botao, { borderColor: cores.erro }]}
                    >
                      Recusar
                    </Button>
                    <Button
                      mode="contained" buttonColor={cores.sucesso} icon="check-circle"
                      onPress={() => pedirConfirmacao(u, 'aprovar')}
                      style={styles.botao}
                    >
                      Aprovar
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>

      <ConfirmModal
        visible={!!selecionado}
        titulo={aprovando ? 'Aprovar cadastro' : 'Recusar cadastro'}
        mensagem={
          aprovando
            ? `${selecionado?.nome} poderá entrar no sistema com o email e a senha que cadastrou.`
            : `${selecionado?.nome} não conseguirá entrar no sistema e verá que o cadastro não foi aprovado.`
        }
        corBotao={aprovando ? cores.sucesso : cores.erro}
        onClose={fecharConfirmacao}
        onConfirmar={confirmar}
        loading={processando}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  conteudo: { padding: 16 },
  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  titulo: { fontWeight: 'bold' },
  erro: { color: cores.erro, marginBottom: 12 },
  card: { marginBottom: 12, borderRadius: 12 },
  linhaUsuario: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  info: { marginLeft: 12, flex: 1 },
  email: { color: cores.textoSecundario, marginTop: 2 },
  chipPerfil: { alignSelf: 'flex-start', marginTop: 6 },
  botoes: { flexDirection: 'row', gap: 8 },
  botao: { flex: 1, borderRadius: 8 },
  vazio: { alignItems: 'center', marginTop: 60 },
  textoVazio: { color: cores.textoDesabilitado, marginTop: 12, fontSize: 16, textAlign: 'center' },
  textoVazioSub: { color: cores.textoDesabilitado, marginTop: 6, textAlign: 'center' },
});