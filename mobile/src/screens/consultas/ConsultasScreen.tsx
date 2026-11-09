import React, { useEffect, useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, Avatar, Button, Portal, Modal, SegmentedButtons, Searchbar, FAB } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Consulta, statusCores, statusLabels } from '../../types';
import { cores, iniciais } from '../../theme';
import TriagemModal from '../../components/TriagemModal';
import AnotacaoModal from '../../components/AnotacaoModal';
import ReceitaModal from '../../components/ReceitaModal';
import ExameModal from '../../components/ExameModal';
import ConfirmModal from '../../components/ConfirmModal';
import NovaConsultaModal from '../../components/NovaConsultaModal';

const statusAtivos = ['Agendada', 'EmTriagem', 'AguardandoAtendimento', 'EmAtendimento'];
const statusHistorico = ['Finalizada', 'Cancelada'];

function hora(data: string) {
  return new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function rotuloDia(data: string) {
  const d = new Date(data);
  const hoje = new Date();
  const amanha = new Date(); amanha.setDate(hoje.getDate() + 1);
  const ontem = new Date(); ontem.setDate(hoje.getDate() - 1);
  if (d.toDateString() === hoje.toDateString()) return 'Hoje';
  if (d.toDateString() === amanha.toDateString()) return 'Amanhã';
  if (d.toDateString() === ontem.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function ConsultasScreen() {
  const { usuario } = useAuth();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [aba, setAba] = useState('ativas');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [busca, setBusca] = useState('');
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(false);
  const [filtroMedico, setFiltroMedico] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  const [consultaSelecionada, setConsultaSelecionada] = useState<Consulta | null>(null);
  const [modalAcoes, setModalAcoes] = useState(false);
  const [modalTriagem, setModalTriagem] = useState(false);
  const [modalAnotacao, setModalAnotacao] = useState(false);
  const [modalReceita, setModalReceita] = useState(false);
  const [modalExame, setModalExame] = useState(false);
  const [modalConfirm, setModalConfirm] = useState(false);
  const [modalNova, setModalNova] = useState(false);
  const [confirmAcao, setConfirmAcao] = useState<{ acao: string; cor: string; titulo: string } | null>(null);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const response = await api.get('/api/consultas');
      setConsultas(response.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    carregar();
  }

  function limparFiltros() {
    setFiltroMedico('');
    setFiltroStatus('');
  }

  function trocarAba(valor: string) {
    setAba(valor);
    setBusca('');
    limparFiltros();
  }

  const consultasAtivas = useMemo(() =>
    consultas
      .filter(c => statusAtivos.includes(c.status))
      .sort((a, b) => new Date(a.dataConsulta).getTime() - new Date(b.dataConsulta).getTime()),
    [consultas]);

  const consultasHistorico = useMemo(() =>
    consultas
      .filter(c => statusHistorico.includes(c.status))
      .sort((a, b) => new Date(b.dataConsulta).getTime() - new Date(a.dataConsulta).getTime()),
    [consultas]);

  const listaAba = aba === 'ativas' ? consultasAtivas : consultasHistorico;
  const statusNaAba = aba === 'ativas' ? statusAtivos : statusHistorico;

  const medicosNaAba = useMemo(
    () => [...new Set(listaAba.map(c => c.nomeMedico))].sort(),
    [listaAba]);

  const qtdFiltros = [filtroMedico, filtroStatus].filter(Boolean).length;

  const consultasFiltradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return listaAba.filter(c => {
      const buscaOk = !q ||
        c.nomePaciente.toLowerCase().includes(q) ||
        c.nomeMedico.toLowerCase().includes(q) ||
        new Date(c.dataConsulta).toLocaleDateString('pt-BR').includes(q) ||
        (statusLabels[c.status] ?? '').toLowerCase().includes(q);
      return buscaOk &&
        (filtroMedico === '' || c.nomeMedico === filtroMedico) &&
        (filtroStatus === '' || c.status === filtroStatus);
    });
  }, [listaAba, busca, filtroMedico, filtroStatus]);

  const grupos = useMemo(() => {
    const lista: { chave: string; rotulo: string; itens: Consulta[] }[] = [];
    for (const c of consultasFiltradas) {
      const chave = new Date(c.dataConsulta).toDateString();
      let g = lista.find(x => x.chave === chave);
      if (!g) {
        g = { chave, rotulo: rotuloDia(c.dataConsulta), itens: [] };
        lista.push(g);
      }
      g.itens.push(c);
    }
    return lista;
  }, [consultasFiltradas]);

  function abrirAcoes(c: Consulta) {
    setConsultaSelecionada(c);
    setModalAcoes(true);
  }

  function fecharTudo() {
    setModalAcoes(false);
    setModalTriagem(false);
    setModalAnotacao(false);
    setModalReceita(false);
    setModalExame(false);
  }

  function onSucessoAcao() {
    fecharTudo();
    setConsultaSelecionada(null);
    carregar();
  }

  function pedirConfirmacao(acao: string, cor: string, titulo: string) {
    setModalAcoes(false);
    setConfirmAcao({ acao, cor, titulo });
    setModalConfirm(true);
  }

  async function confirmarAcao() {
    if (!confirmAcao || !consultaSelecionada) return;
    await api.patch(`/api/consultas/${consultaSelecionada.id}/${confirmAcao.acao}`);
    setModalConfirm(false);
    setConfirmAcao(null);
    setConsultaSelecionada(null);
    carregar();
  }

  async function acaoRapida(acao: string) {
    if (!consultaSelecionada) return;
    await api.patch(`/api/consultas/${consultaSelecionada.id}/${acao}`);
    setModalAcoes(false);
    setConsultaSelecionada(null);
    carregar();
  }

  const ehMinhaConsulta =
    usuario?.perfil === 'Medico' &&
    !!usuario.medicoId &&
    consultaSelecionada?.medicoId === usuario.medicoId;

  if (loading) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <SegmentedButtons
          value={aba}
          onValueChange={trocarAba}
          buttons={[
            { value: 'ativas', label: `Ativas (${consultasAtivas.length})` },
            { value: 'historico', label: `Histórico (${consultasHistorico.length})` },
          ]}
        />
      </View>

      <View style={styles.buscaLinha}>
        <Searchbar
          placeholder="Paciente, médico, data ou status..."
          value={busca}
          onChangeText={setBusca}
          style={styles.buscaInput}
        />
        <Button
          mode={qtdFiltros > 0 ? 'contained' : 'outlined'}
          icon={filtrosVisiveis ? 'filter-variant-remove' : 'filter-variant'}
          onPress={() => setFiltrosVisiveis(v => !v)}
          compact
        >
          Filtros{qtdFiltros > 0 ? ` (${qtdFiltros})` : ''}
        </Button>
      </View>

      {filtrosVisiveis && (
        <View style={styles.painelFiltros}>
          <Text variant="labelLarge" style={styles.painelTitulo}>Status</Text>
          <View style={styles.chips}>
            {statusNaAba.map((s) => (
              <Chip
                key={s}
                compact
                selected={filtroStatus === s}
                onPress={() => setFiltroStatus(filtroStatus === s ? '' : s)}
              >
                {statusLabels[s]}
              </Chip>
            ))}
          </View>

          <Text variant="labelLarge" style={[styles.painelTitulo, { marginTop: 12 }]}>Médico</Text>
          <View style={styles.chips}>
            {medicosNaAba.map((m) => (
              <Chip
                key={m}
                compact
                selected={filtroMedico === m}
                onPress={() => setFiltroMedico(filtroMedico === m ? '' : m)}
              >
                {m}
              </Chip>
            ))}
          </View>

          <View style={styles.painelRodape}>
            <Text variant="bodySmall" style={styles.textoSecundario}>
              {consultasFiltradas.length} de {listaAba.length} consulta(s)
            </Text>
            {qtdFiltros > 0 && (
              <Button compact textColor={cores.erro} onPress={limparFiltros}>Limpar</Button>
            )}
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.lista}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {grupos.length === 0 ? (
          <Text style={styles.textoVazio}>Nenhuma consulta encontrada</Text>
        ) : (
          grupos.map((g) => (
            <View key={g.chave} style={styles.grupo}>
              <Text variant="labelLarge" style={styles.grupoTitulo}>
                {g.rotulo} · {g.itens.length}
              </Text>
              {g.itens.map((c) => {
                const cor = statusCores[c.status] ?? cores.primaria;
                return (
                  <Card
                    key={c.id}
                    style={[
                      styles.card,
                      { borderLeftColor: cor, borderLeftWidth: 4, opacity: c.status === 'Cancelada' ? 0.55 : 1 },
                    ]}
                    onPress={() => abrirAcoes(c)}
                  >
                    <Card.Content style={styles.cardLinha}>
                      <Text variant="titleSmall" style={[styles.hora, { color: cor }]}>{hora(c.dataConsulta)}</Text>
                      <Avatar.Text size={36} label={iniciais(c.nomePaciente)} style={{ backgroundColor: cor }} />
                      <View style={styles.cardInfo}>
                        <Text variant="titleSmall" numberOfLines={1}>{c.nomePaciente}</Text>
                        <Text variant="bodySmall" style={styles.textoSecundario} numberOfLines={1}>{c.nomeMedico}</Text>
                      </View>
                      <Chip compact style={{ backgroundColor: cor + '20' }} textStyle={{ color: cor, fontSize: 11, fontWeight: 'bold' }}>
                        {statusLabels[c.status]}
                      </Chip>
                    </Card.Content>
                  </Card>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal de ações */}
      <Portal>
        <Modal visible={modalAcoes} onDismiss={() => setModalAcoes(false)} contentContainerStyle={styles.modalAcoes}>
          <Text variant="titleLarge" style={styles.tituloModal}>{consultaSelecionada?.nomePaciente}</Text>
          <Text variant="bodyMedium" style={styles.subtituloModal}>{consultaSelecionada?.nomeMedico}</Text>

          <View style={styles.acoesLista}>
            {usuario?.perfil === 'Enfermeiro' && consultaSelecionada?.status === 'Agendada' && (
              <Button mode="contained" buttonColor={cores.aviso} icon="stethoscope" onPress={() => { setModalAcoes(false); setModalTriagem(true); }}>
                Iniciar Triagem
              </Button>
            )}
            {usuario?.perfil === 'Enfermeiro' && consultaSelecionada?.status === 'EmTriagem' && (
              <Button mode="contained" onPress={() => acaoRapida('aguardar-atendimento')}>
                Mover para Aguardando
              </Button>
            )}
            {ehMinhaConsulta && consultaSelecionada?.status === 'AguardandoAtendimento' && (
              <Button mode="contained" icon="account" onPress={() => acaoRapida('iniciar-atendimento')}>
                Iniciar Atendimento
              </Button>
            )}
            {ehMinhaConsulta && consultaSelecionada?.status === 'EmAtendimento' && (<>
              <Button mode="outlined" icon="note-edit" onPress={() => { setModalAcoes(false); setModalAnotacao(true); }}>
                Anotações Clínicas
              </Button>
              <Button mode="outlined" icon="pill" onPress={() => { setModalAcoes(false); setModalReceita(true); }}>
                Emitir Receita
              </Button>
              <Button mode="outlined" icon="flask" onPress={() => { setModalAcoes(false); setModalExame(true); }}>
                Registrar Exame
              </Button>
              <Button mode="contained" buttonColor={cores.sucesso} icon="check-circle" onPress={() => pedirConfirmacao('finalizar', cores.sucesso, 'Finalizar Consulta')}>
                Finalizar Consulta
              </Button>
            </>)}
            {(usuario?.perfil === 'Recepcionista' || ehMinhaConsulta) &&
              consultaSelecionada && !['Finalizada', 'Cancelada'].includes(consultaSelecionada.status) && (
                <Button mode="outlined" textColor={cores.erro} icon="close-circle" onPress={() => pedirConfirmacao('cancelar', cores.erro, 'Cancelar Consulta')}>
                  Cancelar Consulta
                </Button>
              )}
            {usuario?.perfil === 'Medico' && consultaSelecionada && !ehMinhaConsulta &&
              !['Finalizada', 'Cancelada'].includes(consultaSelecionada.status) && (
                <Text variant="bodySmall" style={styles.textoSecundario}>
                  Esta consulta é do(a) {consultaSelecionada.nomeMedico}. Só o médico responsável pode atendê-la.
                </Text>
              )}
          </View>

          <Button onPress={() => setModalAcoes(false)} style={styles.fechar}>Fechar</Button>
        </Modal>
      </Portal>

      <TriagemModal
        visible={modalTriagem}
        consultaId={consultaSelecionada?.id ?? null}
        onClose={fecharTudo}
        onSucesso={onSucessoAcao}
      />
      <AnotacaoModal
        visible={modalAnotacao}
        consultaId={consultaSelecionada?.id ?? null}
        anotacaoAtual={consultaSelecionada?.anotacoes}
        onClose={fecharTudo}
        onSucesso={onSucessoAcao}
      />
      <ReceitaModal
        visible={modalReceita}
        consultaId={consultaSelecionada?.id ?? null}
        onClose={fecharTudo}
        onSucesso={onSucessoAcao}
      />
      <ExameModal
        visible={modalExame}
        consultaId={consultaSelecionada?.id ?? null}
        onClose={fecharTudo}
        onSucesso={onSucessoAcao}
      />
      <ConfirmModal
        visible={modalConfirm}
        titulo={confirmAcao?.titulo ?? ''}
        mensagem={`Tem certeza que deseja ${confirmAcao?.acao === 'cancelar' ? 'cancelar' : 'finalizar'} esta consulta?`}
        corBotao={confirmAcao?.cor ?? cores.primaria}
        onClose={() => setModalConfirm(false)}
        onConfirmar={confirmarAcao}
      />

      {usuario?.perfil === 'Recepcionista' && (
        <FAB icon="plus" label="Nova consulta" style={styles.fab} onPress={() => setModalNova(true)} />
      )}

      <NovaConsultaModal
        visible={modalNova}
        onClose={() => setModalNova(false)}
        onSucesso={() => {
          setModalNova(false);
          setAba('ativas');
          carregar();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  centro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    padding: 16,
    paddingBottom: 8,
  },
  buscaLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  buscaInput: {
    flex: 1,
  },
  painelFiltros: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  painelTitulo: {
    color: cores.textoSecundario,
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  painelRodape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  lista: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 90,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: cores.primaria,
  },
  grupo: {
    marginBottom: 16,
  },
  grupoTitulo: {
    color: cores.textoSecundario,
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  card: {
    marginBottom: 8,
    borderRadius: 12,
  },
  cardLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hora: {
    width: 44,
    fontWeight: 'bold',
  },
  cardInfo: {
    flex: 1,
  },
  textoSecundario: {
    color: cores.textoSecundario,
  },
  textoVazio: {
    textAlign: 'center',
    color: cores.textoDesabilitado,
    marginTop: 40,
  },
  modalAcoes: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  tituloModal: {
    fontWeight: 'bold',
  },
  subtituloModal: {
    color: cores.textoSecundario,
    marginBottom: 16,
  },
  acoesLista: {
    gap: 8,
  },
  fechar: {
    marginTop: 16,
  },
});