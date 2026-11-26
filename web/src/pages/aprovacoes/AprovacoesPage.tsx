import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Typography,
  Avatar,
  Button,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  CircularProgress,
  LinearProgress,
  TextField,
  InputAdornment,
  Snackbar,
  Tabs,
  Tab,
  alpha,
} from "@mui/material";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import BlockIcon from "@mui/icons-material/Block";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import LockResetIcon from "@mui/icons-material/LockReset";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import VaccinesIcon from "@mui/icons-material/Vaccines";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PeopleIcon from "@mui/icons-material/People";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import Layout from "../../components/layout/Layout";
import { iniciais } from "../../utils/pessoas";
import api from "../../services/api";
import { useAtualizacaoAutomatica } from "../../hooks/useAtualizacaoAutomatica";

interface UsuarioItem {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  status?: string;
  criadoEm?: string;
  crm?: string | null;
  especialidade?: string | null;
  coren?: string | null;
  especializacao?: string | null;
  redefinicaoSolicitada?: boolean;
  redefinicaoSolicitadaEm?: string | null;
}

const perfilInfo: Record<
  string,
  { label: string; cor: string; Icon: React.ElementType }
> = {
  Administrador: {
    label: "Administrador",
    cor: "#37474f",
    Icon: AdminPanelSettingsIcon,
  },
  Medico: { label: "Médico", cor: "#1565c0", Icon: MedicalServicesIcon },
  Enfermeiro: { label: "Enfermeiro(a)", cor: "#2e7d32", Icon: VaccinesIcon },
  Recepcionista: {
    label: "Recepcionista",
    cor: "#6a1b9a",
    Icon: SupportAgentIcon,
  },
};

type Acao = "aprovar" | "recusar" | "desativar" | "reativar";

export default function AprovacoesPage() {
  const [aba, setAba] = useState<"pendentes" | "usuarios">("pendentes");
  const [pendentes, setPendentes] = useState<UsuarioItem[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroPerfil, setFiltroPerfil] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<
    "todos" | "Aprovado" | "Inativo"
  >("todos");
  const [selecionado, setSelecionado] = useState<UsuarioItem | null>(null);
  const [acao, setAcao] = useState<Acao | null>(null);
  const [processando, setProcessando] = useState(false);
  const [redefinirAlvo, setRedefinirAlvo] = useState<UsuarioItem | null>(null);
  const [senhaGerada, setSenhaGerada] = useState<string | null>(null);
  const [redefinindo, setRedefinindo] = useState(false);
  const [senhaCopiada, setSenhaCopiada] = useState(false);

  useEffect(() => {
    carregar(true);
  }, []);
  useAtualizacaoAutomatica(() => carregar(false), 30000);

  async function carregar(mostrarLoading = true) {
    if (mostrarLoading) setLoading(true);
    try {
      const [resPendentes, resUsuarios] = await Promise.all([
        api.get("/api/auth/pendentes"),
        api.get("/api/auth/usuarios"),
      ]);
      setPendentes(resPendentes.data);
      setUsuarios(resUsuarios.data);
    } catch (error: any) {
      setErro(error.mensagemBack ?? "Erro ao carregar dados de usuários");
    } finally {
      if (mostrarLoading) setLoading(false);
    }
  }

  const listaAtual = aba === "pendentes" ? pendentes : usuarios;
  const pedidosRedefinicao = usuarios.filter(
    (u) => u.redefinicaoSolicitada,
  ).length;

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase();
    return listaAtual
      .filter(
        (u) =>
          (filtroPerfil === "" || u.perfil === filtroPerfil) &&
          (aba === "pendentes" ||
            filtroStatus === "todos" ||
            u.status === filtroStatus) &&
          (q === "" ||
            u.nome.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q)),
      )
      .sort(
        // Quem pediu nova senha aparece primeiro
        (a, b) =>
          Number(!!b.redefinicaoSolicitada) - Number(!!a.redefinicaoSolicitada),
      );
  }, [listaAtual, aba, busca, filtroPerfil, filtroStatus]);

  function pedirConfirmacao(usuario: UsuarioItem, tipo: Acao) {
    setErro("");
    setSelecionado(usuario);
    setAcao(tipo);
  }

  function fecharConfirmacao() {
    if (processando) return;
    setSelecionado(null);
    setAcao(null);
  }

  function abrirRedefinicao(usuario: UsuarioItem) {
    setErro("");
    setSenhaGerada(null);
    setSenhaCopiada(false);
    setRedefinirAlvo(usuario);
  }

  function fecharRedefinicao() {
    if (redefinindo) return;
    const gerou = !!senhaGerada;
    setRedefinirAlvo(null);
    setSenhaGerada(null);
    setSenhaCopiada(false);
    if (gerou) carregar(false);
  }

  async function gerarSenhaTemporaria() {
    if (!redefinirAlvo) return;
    setRedefinindo(true);
    try {
      const r = await api.post(`/api/auth/${redefinirAlvo.id}/redefinir-senha`);
      setSenhaGerada(r.data.senhaTemporaria);
    } catch (error: any) {
      setErro(error.mensagemBack ?? "Erro ao redefinir a senha");
      setRedefinirAlvo(null);
    } finally {
      setRedefinindo(false);
    }
  }

  async function copiarSenha() {
    if (!senhaGerada) return;
    try {
      await navigator.clipboard.writeText(senhaGerada);
      setSenhaCopiada(true);
    } catch {
      /* sem permissão de área de transferência: a senha continua selecionável */
    }
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
        aprovar: `Cadastro de ${nomeAlvo} aprovado com sucesso.`,
        recusar: `Cadastro de ${nomeAlvo} recusado.`,
        desativar: `Acesso de ${nomeAlvo} desativado.`,
        reativar: `Acesso de ${nomeAlvo} reativado com sucesso.`,
      };
      setFeedback(mensagens[tipoAcao]);
      await carregar(false);
    } catch (error: any) {
      setErro(error.mensagemBack ?? "Erro ao processar a solicitação");
      setSelecionado(null);
      setAcao(null);
    } finally {
      setProcessando(false);
    }
  }

  const acaoPositiva = acao === "aprovar" || acao === "reativar";

  const textosModal: Record<
    Acao,
    { titulo: string; desc: string; botao: string }
  > = {
    aprovar: {
      titulo: "Aprovar cadastro",
      desc: "Depois de aprovado, o usuário poderá entrar no sistema com o email e a senha que cadastrou.",
      botao: "Sim, aprovar",
    },
    recusar: {
      titulo: "Recusar cadastro",
      desc: "O usuário não conseguirá entrar no sistema e verá que o cadastro não foi aprovado.",
      botao: "Sim, recusar",
    },
    desativar: {
      titulo: "Desativar acesso",
      desc: "O usuário perderá imediatamente o acesso ao sistema até que seja reativado por um administrador.",
      botao: "Sim, desativar",
    },
    reativar: {
      titulo: "Reativar acesso",
      desc: "O usuário voltará a ter acesso normal ao sistema com suas credenciais.",
      botao: "Sim, reativar",
    },
  };

  return (
    <Layout>
      {loading && (
        <LinearProgress
          sx={{ position: "fixed", top: 64, left: 0, right: 0, zIndex: 9999 }}
        />
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
          mb: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <HowToRegIcon color="primary" fontSize="small" />
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Gestão de Usuários
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={() => carregar(true)}
          disabled={loading}
        >
          Atualizar
        </Button>
      </Box>

      <Tabs
        value={aba}
        onChange={(_, v) => {
          setAba(v);
          setFiltroPerfil("");
          setFiltroStatus("todos");
        }}
        sx={{
          mb: 2,
          minHeight: 38,
          borderBottom: 1,
          borderColor: "divider",
          "& .MuiTab-root": { minHeight: 38, py: 0.5, fontSize: 13 },
        }}
      >
        <Tab
          value="pendentes"
          icon={<HowToRegIcon sx={{ fontSize: 17 }} />}
          iconPosition="start"
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <span>Pendentes</span>
              <Chip
                label={pendentes.length}
                size="small"
                color={pendentes.length > 0 ? "warning" : "default"}
                sx={{ height: 20, fontSize: 11 }}
              />
            </Box>
          }
        />
        <Tab
          value="usuarios"
          icon={<PeopleIcon sx={{ fontSize: 17 }} />}
          iconPosition="start"
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <span>Usuários</span>
              <Chip
                label={usuarios.length}
                size="small"
                color="primary"
                sx={{ height: 20, fontSize: 11 }}
              />
            </Box>
          }
        />
      </Tabs>

      {erro && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro("")}>
          {erro}
        </Alert>
      )}

      {aba === "usuarios" && pedidosRedefinicao > 0 && (
        <Alert severity="warning" icon={<LockResetIcon />} sx={{ mb: 2 }}>
          {pedidosRedefinicao === 1
            ? "1 usuário pediu redefinição de senha."
            : `${pedidosRedefinicao} usuários pediram redefinição de senha.`}{" "}
          Use o botão “Redefinir senha” no cartão dele.
        </Alert>
      )}

      {listaAtual.length > 0 && (
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            mb: 2,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <TextField
            size="small"
            placeholder="Buscar por nome ou e-mail..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            sx={{ flex: "1 1 240px" }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
            <Chip
              label="Todos"
              size="small"
              color={filtroPerfil === "" ? "primary" : "default"}
              onClick={() => setFiltroPerfil("")}
            />
            {Object.entries(perfilInfo)
              .filter(([key]) => aba === "usuarios" || key !== "Administrador")
              .map(([key, info]) => (
                <Chip
                  key={key}
                  label={info.label}
                  size="small"
                  color={filtroPerfil === key ? "primary" : "default"}
                  onClick={() =>
                    setFiltroPerfil(filtroPerfil === key ? "" : key)
                  }
                />
              ))}
          </Box>

          {aba === "usuarios" && (
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
              {(
                [
                  { key: "todos", label: "Todos status" },
                  { key: "Aprovado", label: "Ativos" },
                  { key: "Inativo", label: "Inativos" },
                ] as const
              ).map((s) => (
                <Chip
                  key={s.key}
                  label={s.label}
                  size="small"
                  variant={filtroStatus === s.key ? "filled" : "outlined"}
                  color={filtroStatus === s.key ? "primary" : "default"}
                  onClick={() => setFiltroStatus(s.key)}
                />
              ))}
            </Box>
          )}
        </Box>
      )}

      {!loading && listaAtual.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
          <HowToRegIcon sx={{ fontSize: 56, opacity: 0.15, mb: 1.5 }} />
          <Typography variant="subtitle1" sx={{ opacity: 0.5 }}>
            {aba === "pendentes"
              ? "Nenhum cadastro aguardando aprovação"
              : "Nenhum usuário cadastrado"}
          </Typography>
        </Box>
      ) : !loading && filtrados.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 5, color: "text.secondary" }}>
          <Typography variant="body2">
            Nenhum usuário corresponde ao filtro aplicado.
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 1.25,
          }}
        >
          {filtrados.map((u) => {
            const info = perfilInfo[u.perfil] ?? {
              label: u.perfil,
              cor: "#546e7a",
              Icon: HowToRegIcon,
            };
            const isInativo = u.status === "Inativo";
            const isAdmin = u.perfil === "Administrador";

            return (
              <Card
                key={u.id}
                sx={{
                  borderRadius: 2.5,
                  borderLeft: `4px solid ${isInativo ? "#9e9e9e" : info.cor}`,
                  opacity: isInativo ? 0.78 : 1,
                }}
              >
                <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar
                      sx={{
                        bgcolor: isInativo ? "#757575" : info.cor,
                        width: 38,
                        height: 38,
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      {iniciais(u.nome)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{ fontWeight: 700 }}
                      >
                        {u.nome}
                      </Typography>
                      <Typography
                        variant="caption"
                        noWrap
                        color="text.secondary"
                        sx={{ display: "block" }}
                      >
                        {u.email}
                      </Typography>

                      {aba === "pendentes" && u.perfil === "Medico" && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block" }}
                        >
                          CRM: {u.crm ?? "—"} · {u.especialidade ?? "—"}
                        </Typography>
                      )}

                      {aba === "pendentes" && u.perfil === "Enfermeiro" && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block" }}
                        >
                          COREN: {u.coren ?? "—"}
                          {u.especializacao ? ` · ${u.especializacao}` : ""}
                        </Typography>
                      )}

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.75,
                          mt: 0.5,
                          flexWrap: "wrap",
                        }}
                      >
                        <Chip
                          icon={
                            <info.Icon
                              sx={{
                                fontSize: 13,
                                color: `${info.cor} !important`,
                              }}
                            />
                          }
                          label={info.label}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: 11,
                            bgcolor: alpha(info.cor, 0.12),
                            color: info.cor,
                            fontWeight: 600,
                          }}
                        />
                        {aba === "usuarios" && (
                          <Chip
                            label={isInativo ? "Inativo" : "Ativo"}
                            size="small"
                            color={isInativo ? "default" : "success"}
                            variant={isInativo ? "outlined" : "filled"}
                            sx={{ height: 20, fontSize: 11 }}
                          />
                        )}
                        {aba === "usuarios" && u.redefinicaoSolicitada && (
                          <Chip
                            icon={<LockResetIcon sx={{ fontSize: 13 }} />}
                            label="Pediu nova senha"
                            size="small"
                            color="warning"
                            sx={{ height: 20, fontSize: 11 }}
                          />
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", gap: 0.75, flexShrink: 0 }}>
                      {aba === "pendentes" ? (
                        <>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<CancelIcon sx={{ fontSize: 16 }} />}
                            onClick={() => pedirConfirmacao(u, "recusar")}
                            sx={{ borderRadius: 1.5, px: 1.25, fontSize: 12 }}
                          >
                            Recusar
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={
                              <CheckCircleIcon sx={{ fontSize: 16 }} />
                            }
                            onClick={() => pedirConfirmacao(u, "aprovar")}
                            sx={{ borderRadius: 1.5, px: 1.25, fontSize: 12 }}
                          >
                            Aprovar
                          </Button>
                        </>
                      ) : (
                        <>
                          {!isInativo && (
                            <Button
                              size="small"
                              variant={
                                u.redefinicaoSolicitada
                                  ? "contained"
                                  : "outlined"
                              }
                              color="warning"
                              startIcon={
                                <LockResetIcon sx={{ fontSize: 16 }} />
                              }
                              onClick={() => abrirRedefinicao(u)}
                              sx={{ borderRadius: 1.5, px: 1.25, fontSize: 12 }}
                            >
                              Redefinir senha
                            </Button>
                          )}
                          {!isAdmin &&
                            (isInativo ? (
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={
                                  <LockOpenIcon sx={{ fontSize: 15 }} />
                                }
                                onClick={() => pedirConfirmacao(u, "reativar")}
                                sx={{
                                  borderRadius: 1.5,
                                  px: 1.25,
                                  fontSize: 12,
                                }}
                              >
                                Reativar
                              </Button>
                            ) : (
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<BlockIcon sx={{ fontSize: 15 }} />}
                                onClick={() => pedirConfirmacao(u, "desativar")}
                                sx={{
                                  borderRadius: 1.5,
                                  px: 1.25,
                                  fontSize: 12,
                                }}
                              >
                                Desativar
                              </Button>
                            ))}
                        </>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {acao && (
        <Dialog
          open={!!selecionado}
          onClose={fecharConfirmacao}
          maxWidth="xs"
          fullWidth
        >
          <Box
            sx={{
              background: acaoPositiva
                ? "linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)"
                : "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)",
              p: 2.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  width: 42,
                  height: 42,
                  border: "2px solid rgba(255,255,255,0.4)",
                }}
              >
                {acaoPositiva ? (
                  <CheckCircleIcon sx={{ color: "white", fontSize: 22 }} />
                ) : (
                  <CancelIcon sx={{ color: "white", fontSize: 22 }} />
                )}
              </Avatar>
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ color: "white", fontWeight: "bold", lineHeight: 1.2 }}
                >
                  {textosModal[acao].titulo}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255,255,255,0.85)" }}
                >
                  {selecionado?.nome}
                </Typography>
              </Box>
            </Box>
          </Box>
          <DialogContent sx={{ pt: 2.5 }}>
            <Typography variant="body2" color="text.secondary">
              {textosModal[acao].desc}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              size="small"
              onClick={fecharConfirmacao}
              variant="outlined"
              fullWidth
              disabled={processando}
            >
              Voltar
            </Button>
            <Button
              size="small"
              onClick={confirmar}
              variant="contained"
              fullWidth
              disabled={processando}
              color={acaoPositiva ? "success" : "error"}
              startIcon={
                processando ? (
                  <CircularProgress size={14} color="inherit" />
                ) : acaoPositiva ? (
                  <CheckCircleIcon />
                ) : (
                  <CancelIcon />
                )
              }
            >
              {textosModal[acao].botao}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <Dialog
        open={!!redefinirAlvo}
        onClose={(_, motivo) => {
          // Com a senha na tela, só fecha pelo botão (ela não pode ser vista de novo)
          if (senhaGerada && motivo === "backdropClick") return;
          fecharRedefinicao();
        }}
        maxWidth="xs"
        fullWidth
      >
        <Box
          sx={{
            background: "linear-gradient(135deg, #e65100 0%, #ef6c00 100%)",
            p: 2.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              sx={{
                bgcolor: "rgba(255,255,255,0.2)",
                width: 42,
                height: 42,
                border: "2px solid rgba(255,255,255,0.4)",
              }}
            >
              <LockResetIcon sx={{ color: "white", fontSize: 22 }} />
            </Avatar>
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ color: "white", fontWeight: "bold", lineHeight: 1.2 }}
              >
                {senhaGerada ? "Senha temporária gerada" : "Redefinir senha"}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "rgba(255,255,255,0.85)" }}
              >
                {redefinirAlvo?.nome}
              </Typography>
            </Box>
          </Box>
        </Box>
        <DialogContent sx={{ pt: 2.5 }}>
          {senhaGerada ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Repasse esta senha ao usuário. Ela aparece somente desta vez e
                será trocada por uma senha dele no primeiro acesso.
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: 1.5,
                  borderRadius: 2,
                  border: "1px dashed",
                  borderColor: "warning.main",
                  bgcolor: alpha("#ed6c02", 0.08),
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "monospace",
                    fontSize: 20,
                    fontWeight: 700,
                    letterSpacing: 1,
                    flex: 1,
                    userSelect: "all",
                  }}
                >
                  {senhaGerada}
                </Typography>
                <Button
                  size="small"
                  startIcon={<ContentCopyIcon fontSize="small" />}
                  onClick={copiarSenha}
                >
                  {senhaCopiada ? "Copiada" : "Copiar"}
                </Button>
              </Box>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Será gerada uma senha temporária. A senha atual deixa de funcionar
              imediatamente e o usuário precisará criar uma nova no próximo
              acesso.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          {senhaGerada ? (
            <Button
              size="small"
              variant="contained"
              fullWidth
              onClick={fecharRedefinicao}
            >
              Concluir
            </Button>
          ) : (
            <>
              <Button
                size="small"
                variant="outlined"
                fullWidth
                onClick={fecharRedefinicao}
                disabled={redefinindo}
              >
                Voltar
              </Button>
              <Button
                size="small"
                variant="contained"
                color="warning"
                fullWidth
                onClick={gerarSenhaTemporaria}
                disabled={redefinindo}
                startIcon={
                  redefinindo ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <LockResetIcon />
                  )
                }
              >
                Gerar senha
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!feedback}
        autoHideDuration={4000}
        onClose={() => setFeedback("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setFeedback("")}
        >
          {feedback}
        </Alert>
      </Snackbar>
    </Layout>
  );
}
