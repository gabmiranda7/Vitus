import React, { useEffect, useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import {
  Text,
  Card,
  Chip,
  Avatar,
  Button,
  ActivityIndicator,
  Searchbar,
  Snackbar,
  useTheme,
} from 'react-native-paper';
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
  const theme = useTheme();
  const [pendentes, setPendentes] = useState<UsuarioPendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState('');
  const [feedback, setFeedback] = useState('');

  const [busca, setBusca] = useState('');
  const [filtroPerfil, setFiltroPerfil] = useState('');

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

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase();
    return pendentes.filter(u =>
      (filtroPerfil === '' || u.perfil === filtroPerfil) &&
      (q === '' || u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    );
  }, [pendentes, busca, filtroPerfil]);

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
    const nomeAlvo = selecionado.nome;
    const tipoAcao = acao;
    setProcessando(true);
    try {
      await api.patch(`/api/auth/${selecionado.id}/${tipoAcao}`);
      setSelecionado(null);
      setAcao(null);
      setFeedback(
        tipoAcao === 'aprovar'
          ? `Cadastro de ${nomeAlvo} aprovado.`
          : `Cadastro de ${nomeAlvo} recusado.`
      );
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
          <Chip
            compact
            style={{ backgroundColor: cores.aviso + (theme.dark ? '33' : '20') }}
            textStyle={[styles.chipTextoNegrito, { color: theme.dark ? '#ffb74d' : cores.aviso }]}
          >
            {pendentes.length}
          </Chip>
        </View>

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        {pendentes.length > 0 && (
          <View style={styles.filtrosBox}>
            <Searchbar
              placeholder="Buscar por nome ou e-mail..."
              value={busca}
              onChangeText={setBusca}
              style={styles.busca}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
              <Chip
                compact
                selected={filtroPerfil === ''}
                onPress={() => setFiltroPerfil('')}
                textStyle={styles.chipTexto}
              >
                Todos
              </Chip>
              {Object.entries(perfilLabel).map(([key, label]) => (
                <Chip
                  key={key}
                  compact
                  selected={filtroPerfil === key}
                  onPress={() => setFiltroPerfil(filtroPerfil === key ? '' : key)}
                  textStyle={styles.chipTexto}
                >
                  {label}
                </Chip>
              ))}
            </ScrollView>
          </View>
        )}

        {pendentes.length === 0 ? (
          <View style={styles.vazio}>
            <MaterialCommunityIcons
              name="account-check-outline"
              size={64}
              color={theme.colors.onSurfaceVariant}
              style={{ opacity: 0.3 }}
            />
            <Text style={[styles.textoVazio, { color: theme.colors.onSurfaceVariant }]}>
              Nenhum cadastro aguardando aprovação
            </Text>
            <Text variant="bodySmall" style={[styles.textoVazioSub, { color: theme.colors.onSurfaceVariant }]}>
              Puxe a tela para baixo para atualizar a lista.
            </Text>
          </View>
        ) : filtrados.length === 0 ? (
          <View style={styles.vazio}>
            <Text style={[styles.textoVazio, { color: theme.colors.onSurfaceVariant }]}>
              Nenhum cadastro corresponde ao filtro
            </Text>
          </View>
        ) : (
          filtrados.map((u) => {
            const cor = perfilCor[u.perfil] ?? cores.textoSecundario;
            return (
              <Card key={u.id} style={[styles.card, { borderLeftColor: cor, borderLeftWidth: 4 }]}>
                <Card.Content>
                  <View style={styles.linhaUsuario}>
                    <Avatar.Text size={44} label={iniciais(u.nome)} style={{ backgroundColor: corAvatar(u.nome) }} />
                    <View style={styles.info}>
                      <Text variant="titleMedium">{u.nome}</Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                        {u.email}
                      </Text>
                      <Chip
                        compact
                        style={[styles.chipPerfil, { backgroundColor: cor + (theme.dark ? '33' : '20') }]}
                        textStyle={[styles.chipTexto, { color: theme.dark ? '#e8eef5' : cor }]}
                      >
                        {perfilLabel[u.perfil] ?? u.perfil}
                      </Chip>
                    </View>
                  </View>

                  <View style={styles.botoes}>
                    <Button
                      mode="outlined"
                      textColor={cores.erro}
                      icon="close-circle"
                      onPress={() => pedirConfirmacao(u, 'recusar')}
                      style={[styles.botao, { borderColor: cores.erro }]}
                    >
                      Recusar
                    </Button>
                    <Button
                      mode="contained"
                      buttonColor={cores.sucesso}
                      icon="check-circle"
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

      <Snackbar
        visible={!!feedback}
        onDismiss={() => setFeedback('')}
        duration={3000}
      >
        {feedback}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  conteudo: { padding: 16, paddingBottom: 32 },
  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  titulo: { fontWeight: 'bold' },
  erro: { color: cores.erro, marginBottom: 12 },

  filtrosBox: { marginBottom: 12 },
  busca: { marginBottom: 8 },
  chipsScroll: { gap: 6 },
  chipTexto: { fontSize: 12, lineHeight: 16, marginVertical: 2 },
  chipTextoNegrito: { fontSize: 12, lineHeight: 16, fontWeight: '700', marginVertical: 2 },

  card: { marginBottom: 12, borderRadius: 12 },
  linhaUsuario: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  info: { marginLeft: 12, flex: 1 },
  chipPerfil: { alignSelf: 'flex-start', marginTop: 6 },
  botoes: { flexDirection: 'row', gap: 8 },
  botao: { flex: 1, borderRadius: 8 },
  vazio: { alignItems: 'center', marginTop: 60 },
  textoVazio: { marginTop: 12, fontSize: 16, textAlign: 'center' },
  textoVazioSub: { marginTop: 6, textAlign: 'center', opacity: 0.7 },
});