import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Paper,
  Typography,
  Alert,
  useTheme,
  Avatar,
  Button,
  Collapse,
  Divider,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";
import EditNoteIcon from "@mui/icons-material/EditNote";
import MedicationIcon from "@mui/icons-material/Medication";
import PersonIcon from "@mui/icons-material/Person";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import EventNoteIcon from "@mui/icons-material/EventNote";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import MedicalInformationIcon from "@mui/icons-material/MedicalInformation";
import BadgeIcon from "@mui/icons-material/Badge";
import ScienceIcon from "@mui/icons-material/Science";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DownloadIcon from "@mui/icons-material/Download";
import AddIcon from "@mui/icons-material/Add";
import AccessAlarmIcon from "@mui/icons-material/AccessAlarm";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import api from "../../services/api";
import { iniciais, idadeLabel } from "../../utils/pessoas";
import { statusCores, statusLabels } from "../../utils/consulta";
import { useAuth } from "../../contexts/AuthContext";
import TratamentosAcompanhados from "../receitas/TratamentosAcompanhados";
import ExameAnaliseIaPanel from "./ExameAnaliseIaPanel";
import { situacaoVencimento } from "../receitas/vencimento";
import {
  Prontuario,
  Receita,
  Triagem,
  Consulta,
  Paciente,
  Exame,
  Medicamento,
  Medico,
} from "../../types";

const MAXIMO_ARQUIVOS_EXAME = 15;
const CATEGORIAS = [
  "Sangue",
  "Imagem",
  "Urina",
  "Cardiologico",
  "Fisico",
  "Outro",
];

const categoriaLabel: Record<string, string> = {
  Sangue: "Sangue",
  Imagem: "Imagem",
  Urina: "Urina",
  Cardiologico: "Cardiológico",
  Fisico: "Físico",
  Outro: "Outro",
};

const categoriaCor: Record<string, string> = {
  Sangue: "#c62828",
  Imagem: "#1565c0",
  Urina: "#f57c00",
  Cardiologico: "#ad1457",
  Fisico: "#2e7d32",
  Outro: "#546e7a",
};

function dataChave(data: string) {
  return new Date(data).toLocaleDateString("pt-BR");
}

function horaFormatada(data: string) {
  return new Date(data).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarCpf(cpf?: string) {
  if (!cpf) return "";
  const s = cpf.replace(/\D/g, "");
  return s.length === 11
    ? `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6, 9)}-${s.slice(9)}`
    : cpf;
}

function formatarSus(sus?: string) {
  if (!sus) return "";
  const s = sus.replace(/\D/g, "");
  return s.length === 15
    ? `${s.slice(0, 3)}.${s.slice(3, 7)}.${s.slice(7, 11)}.${s.slice(11)}`
    : sus;
}

interface MedicamentoAgrupado {
  nome: string;
  dosagem?: string;
  posologia?: string;
  quantidade?: string;
  acompanharVencimento?: boolean;
  validadeDias?: number | null;
  ocorrencias: number;
}

function agruparMedicamentos(lista: Medicamento[]): MedicamentoAgrupado[] {
  const mapa = new Map<string, MedicamentoAgrupado>();
  for (const m of lista) {
    const chave = [
      (m.nome ?? "").trim().toLowerCase(),
      (m.dosagem ?? "").trim().toLowerCase(),
      (m.posologia ?? "").trim().toLowerCase(),
    ].join("|");

    const existente = mapa.get(chave);
    if (existente) {
      existente.ocorrencias += 1;
      if (m.quantidade && !existente.quantidade?.includes(m.quantidade)) {
        existente.quantidade = existente.quantidade
          ? `${existente.quantidade} + ${m.quantidade}`
          : m.quantidade;
      }
      if (m.acompanharVencimento && m.validadeDias) {
        existente.acompanharVencimento = true;
        existente.validadeDias = m.validadeDias;
      }
    } else {
      mapa.set(chave, {
        nome: m.nome,
        dosagem: m.dosagem,
        posologia: m.posologia,
        quantidade: m.quantidade,
        acompanharVencimento: m.acompanharVencimento,
        validadeDias: m.validadeDias,
        ocorrencias: 1,
      });
    }
  }
  return Array.from(mapa.values());
}

interface ConsultaAgrupada {
  consulta: Consulta;
  triagem?: Triagem;
  receitas: Receita[];
}

interface GrupoDia {
  chave: string;
  consultas: ConsultaAgrupada[];
}

function agruparPorDia(
  consultas: Consulta[],
  triagens: Triagem[],
  receitas: Receita[],
): GrupoDia[] {
  const triagemPorConsulta = new Map<string, Triagem>(
    triagens.map((t) => [t.consultaId, t]),
  );
  const receitasPorConsulta = receitas.reduce((acc, r) => {
    acc.set(r.consultaId, [...(acc.get(r.consultaId) ?? []), r]);
    return acc;
  }, new Map<string, Receita[]>());

  const porDia = new Map<string, ConsultaAgrupada[]>();
  const consultasOrdenadas = [...consultas].sort(
    (a, b) =>
      new Date(a.dataConsulta).getTime() - new Date(b.dataConsulta).getTime(),
  );

  for (const c of consultasOrdenadas) {
    const chave = dataChave(c.dataConsulta);
    if (!porDia.has(chave)) porDia.set(chave, []);
    porDia.get(chave)!.push({
      consulta: c,
      triagem: triagemPorConsulta.get(c.id),
      receitas: receitasPorConsulta.get(c.id) ?? [],
    });
  }

  return Array.from(porDia.entries())
    .map(([chave, consultas]) => ({ chave, consultas }))
    .sort((a, b) => {
      const parse = (s: string) => {
        const [d, m, y] = s.split("/").map(Number);
        return new Date(y, m - 1, d).getTime();
      };
      return parse(b.chave) - parse(a.chave);
    });
}

const exameVazio = () => ({
  categoria: "Sangue",
  nome: "",
  descricao: "",
  medicoSolicitante: "",
  dataExame: new Date().toISOString().split("T")[0],
  observacoes: "",
});

interface ProntuarioConteudoProps {
  prontuario: Prontuario;
  paciente: Paciente | null;
  exames: Exame[];
  consultaId?: string;
  abaInicial?: number;
  abrirNovoExame?: boolean;
  onExamesAtualizados: () => Promise<void>;
}

export default function ProntuarioConteudo({
  prontuario,
  paciente,
  exames,
  consultaId,
  abaInicial = 1,
  abrirNovoExame = false,
  onExamesAtualizados,
}: ProntuarioConteudoProps): React.ReactElement {
  const { usuario } = useAuth();
  const isMedico = usuario?.perfil === "Medico";
  const theme = useTheme();

  // Inicia na aba passada por prop (padrão: 1 - Histórico)
  const [abaAtiva, setAbaAtiva] = useState(abaInicial);
  // Dias do histórico e receitas recolhidos/expandidos (o mais recente abre por padrão)
  const [diasAbertos, setDiasAbertos] = useState<Record<string, boolean>>({});
  const [receitasAbertas, setReceitasAbertas] = useState<
    Record<string, boolean>
  >({});
  const [buscaReceita, setBuscaReceita] = useState("");
  const [formularioAberto, setFormularioAberto] = useState(abrirNovoExame);
  const [form, setForm] = useState(exameVazio());
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [arquivosNovoExame, setArquivosNovoExame] = useState<File[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState("");
  const [erroExame, setErroExame] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [analisandoId, setAnalisandoId] = useState<string | null>(null);

  useEffect(() => {
    if (isMedico) {
      api
        .get("/api/medicos")
        .then((r) => setMedicos(r.data))
        .catch(() => {
          /* mantém campo livre se falhar */
        });
    }
  }, [isMedico]);

  const isDark = theme.palette.mode === "dark";
  const paperBg = isDark
    ? theme.palette.grey[900]
    : theme.palette.background.paper;
  const timelineBg = isDark ? theme.palette.grey[800] : "#f8faff";
  const timelineBorder = isDark ? theme.palette.grey[700] : "#e3eaf5";
  const diaBg = isDark ? theme.palette.grey[900] : "#f0f4ff";

  const nomePaciente =
    paciente?.nome ?? prontuario.consultas?.[0]?.nomePaciente ?? "Paciente";
  const grupos = agruparPorDia(
    prontuario.consultas,
    prontuario.triagens,
    prontuario.receitas,
  );
  const tratamentos = prontuario.tratamentos ?? [];

  const diaAberto = (chave: string, idx: number) =>
    diasAbertos[chave] ?? idx === 0;
  const todosDiasAbertos = grupos.every((g, i) => diaAberto(g.chave, i));
  function alternarDia(chave: string, idx: number) {
    setDiasAbertos((prev) => ({ ...prev, [chave]: !diaAberto(chave, idx) }));
  }
  function definirTodosDias(aberto: boolean) {
    setDiasAbertos(Object.fromEntries(grupos.map((g) => [g.chave, aberto])));
  }

  // Ponto de alerta na aba Tratamentos: vermelho se vencido (< 0), laranja se vence em até 30 dias
  const temVencido = tratamentos.some((t) => t.diasRestantes < 0);
  const temVencendo = tratamentos.some(
    (t) => t.diasRestantes >= 0 && t.diasRestantes <= 30,
  );
  const corPontoTratamento = temVencido
    ? "#d32f2f"
    : temVencendo
      ? "#ed6c02"
      : null;

  // Receitas ordenadas por data de emissão (mais recentes primeiro) com vínculo da consulta
  const consultaPorId = new Map<string, Consulta>(
    prontuario.consultas.map((c) => [c.id, c]),
  );
  const receitasOrdenadas = [...prontuario.receitas].sort(
    (a, b) =>
      new Date(b.dataEmissao).getTime() - new Date(a.dataEmissao).getTime(),
  );
  const termoReceita = buscaReceita.trim().toLowerCase();
  const receitasFiltradas = receitasOrdenadas.filter(
    (r) =>
      !termoReceita ||
      r.medicamentos.some((m) =>
        (m.nome ?? "").toLowerCase().includes(termoReceita),
      ),
  );
  const receitaAberta = (id: string, idx: number) =>
    receitasAbertas[id] ?? idx === 0;

  // Itens da aba Dados
  const dadosPaciente = paciente
    ? [
        { label: "CPF", value: formatarCpf(paciente.cpf) },
        { label: "Cartão SUS", value: formatarSus(paciente.cartaoSus) },
        {
          label: "Nascimento",
          value: paciente.dataNascimento
            ? new Date(
                paciente.dataNascimento + "T00:00:00",
              ).toLocaleDateString("pt-BR")
            : "",
        },
        { label: "Sexo", value: paciente.sexo },
        { label: "Estado civil", value: paciente.estadoCivil },
        { label: "Profissão", value: paciente.profissao },
        { label: "Nome do pai", value: paciente.nomePai },
        { label: "Nome da mãe", value: paciente.nomeMae },
        { label: "Endereço", value: paciente.endereco },
      ].filter((i) => i.value)
    : [];

  function handleSelecionarArquivosNovoExame(fileList: FileList) {
    const novos = Array.from(fileList);
    if (novos.length === 0) return;

    if (arquivosNovoExame.length + novos.length > MAXIMO_ARQUIVOS_EXAME) {
      setErroForm(
        `Limite máximo de ${MAXIMO_ARQUIVOS_EXAME} arquivos por exame.`,
      );
      return;
    }

    const extensoesValidas = [".pdf", ".jpg", ".jpeg", ".png"];
    for (const arquivo of novos) {
      const extensao = "." + arquivo.name.split(".").pop()?.toLowerCase();
      if (!extensoesValidas.includes(extensao)) {
        setErroForm(
          `Formato inválido (${arquivo.name}). Envie apenas PDF, JPG ou PNG.`,
        );
        return;
      }
      if (arquivo.size > 10 * 1024 * 1024) {
        setErroForm(`O arquivo "${arquivo.name}" excede o limite de 10MB.`);
        return;
      }
    }

    setErroForm("");
    setArquivosNovoExame((prev) => [...prev, ...novos]);
  }

  async function handleSalvarExame() {
    if (!form.nome.trim()) return setErroForm("Nome é obrigatório");
    if (!form.medicoSolicitante.trim())
      return setErroForm("Médico solicitante é obrigatório");

    setSalvando(true);
    setErroForm("");
    try {
      const rExame = await api.post("/api/exames", {
        prontuarioId: prontuario.id,
        consultaId: consultaId ?? null,
        categoria: form.categoria,
        nome: form.nome,
        descricao: form.descricao || null,
        medicoSolicitante: form.medicoSolicitante.trim(),
        dataExame: form.dataExame,
        observacoes: form.observacoes || null,
      });

      if (arquivosNovoExame.length > 0 && rExame.data?.id) {
        const formData = new FormData();
        arquivosNovoExame.forEach((arq) => formData.append("arquivos", arq));
        await api.post(`/api/exames/${rExame.data.id}/arquivos`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setForm(exameVazio());
      setArquivosNovoExame([]);
      setFormularioAberto(false);
      await onExamesAtualizados();
    } catch (error: any) {
      if (!error.response) {
        setErroForm(
          "Não foi possível enviar os arquivos. Verifique o tamanho (máx. 10MB cada) e sua conexão.",
        );
      } else {
        setErroForm(error.mensagemBack ?? "Erro ao salvar exame");
      }
    } finally {
      setSalvando(false);
    }
  }

  async function handleUploadMultiplo(exame: Exame, fileList: FileList) {
    const arquivos = Array.from(fileList);
    if (arquivos.length === 0) return;

    const atuais = exame.arquivos?.length ?? (exame.temArquivo ? 1 : 0);
    if (atuais + arquivos.length > MAXIMO_ARQUIVOS_EXAME) {
      setErroExame(
        `Limite máximo de ${MAXIMO_ARQUIVOS_EXAME} arquivos por exame (restam ${Math.max(0, MAXIMO_ARQUIVOS_EXAME - atuais)}).`,
      );
      return;
    }

    const extensoesValidas = [".pdf", ".jpg", ".jpeg", ".png"];
    for (const arquivo of arquivos) {
      const extensao = "." + arquivo.name.split(".").pop()?.toLowerCase();
      if (!extensoesValidas.includes(extensao)) {
        setErroExame(
          `Formato inválido (${arquivo.name}). Envie apenas PDF, JPG ou PNG.`,
        );
        return;
      }
      if (arquivo.size > 10 * 1024 * 1024) {
        setErroExame(`O arquivo "${arquivo.name}" excede o limite de 10MB.`);
        return;
      }
    }

    setErroExame("");
    setUploadingId(exame.id);
    try {
      const formData = new FormData();
      arquivos.forEach((arq) => formData.append("arquivos", arq));

      await api.post(`/api/exames/${exame.id}/arquivos`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await onExamesAtualizados();
    } catch (error: any) {
      if (!error.response) {
        setErroExame(
          "Não foi possível enviar os arquivos. Verifique o tamanho (máx. 10MB cada) e sua conexão.",
        );
      } else {
        setErroExame(error.mensagemBack ?? "Erro ao enviar arquivos");
      }
    } finally {
      setUploadingId(null);
    }
  }

  async function handleDownload(
    exame: Exame,
    arquivoId?: string,
    nomeArquivo?: string,
  ) {
    try {
      const urlReq = arquivoId
        ? `/api/exames/${exame.id}/arquivo?arquivoId=${arquivoId}`
        : `/api/exames/${exame.id}/arquivo`;

      const r = await api.get(urlReq, { responseType: "blob" });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = nomeArquivo ?? exame.nomeArquivoOriginal ?? "exame";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setErroExame("Erro ao baixar arquivo");
    }
  }

  async function handleAnalisarIa(exameId: string) {
    setErroExame("");
    setAnalisandoId(exameId);
    try {
      await api.post(`/api/exames/${exameId}/analisar-ia`);
      await onExamesAtualizados();
    } catch (error: any) {
      setErroExame(
        error.mensagemBack ??
          "Erro ao analisar exame com IA. Tente novamente em instantes.",
      );
    } finally {
      setAnalisandoId(null);
    }
  }

  return (
    <>
      {/* Cabeçalho azul fixo do paciente */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          background: "linear-gradient(135deg, #1565c0 0%, #1976d2 100%)",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Avatar
              sx={{
                bgcolor: "rgba(255,255,255,0.2)",
                width: 64,
                height: 64,
                border: "2px solid rgba(255,255,255,0.4)",
                flexShrink: 0,
              }}
            >
              <PersonIcon sx={{ color: "white", fontSize: 34 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h5"
                sx={{ color: "white", fontWeight: 800, mb: 0.5 }}
              >
                {nomePaciente}
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 1.5 }}>
                {[
                  {
                    icon: <EventNoteIcon sx={{ fontSize: 16 }} />,
                    label: `${prontuario.consultas.length} consulta(s)`,
                  },
                  {
                    icon: <MonitorHeartIcon sx={{ fontSize: 16 }} />,
                    label: `${prontuario.triagens.length} triagem(ns)`,
                  },
                  {
                    icon: <MedicationIcon sx={{ fontSize: 16 }} />,
                    label: `${prontuario.receitas.length} receita(s)`,
                  },
                  {
                    icon: <ScienceIcon sx={{ fontSize: 16 }} />,
                    label: `${exames.length} exame(s)`,
                  },
                ].map((item, i) => (
                  <Box
                    key={i}
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    <Box sx={{ color: "rgba(255,255,255,0.7)" }}>
                      {item.icon}
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255,255,255,0.7)" }}
                    >
                      {item.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
              {paciente && (
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {paciente.dataNascimento && (
                    <Chip
                      icon={
                        <PersonIcon
                          sx={{ fontSize: 14, color: "white !important" }}
                        />
                      }
                      label={`${idadeLabel(paciente.dataNascimento)}${paciente.sexo ? ` · ${paciente.sexo}` : ""}`}
                      size="small"
                      sx={{
                        bgcolor: "rgba(255,255,255,0.15)",
                        color: "white",
                        fontSize: 11,
                      }}
                    />
                  )}
                  {paciente.cpf && (
                    <Chip
                      icon={
                        <BadgeIcon
                          sx={{ fontSize: 14, color: "white !important" }}
                        />
                      }
                      label={`CPF: ${paciente.cpf}`}
                      size="small"
                      sx={{
                        bgcolor: "rgba(255,255,255,0.15)",
                        color: "white",
                        fontSize: 11,
                      }}
                    />
                  )}
                  {paciente.cartaoSus && (
                    <Chip
                      label={`SUS: ${paciente.cartaoSus}`}
                      size="small"
                      sx={{
                        bgcolor: "rgba(255,255,255,0.15)",
                        color: "white",
                        fontSize: 11,
                      }}
                    />
                  )}
                </Box>
              )}
            </Box>
          </Box>

          {paciente?.informacoesAdicionais && (
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: 2,
                bgcolor: "rgba(255,152,0,0.25)",
                border: "1px solid rgba(255,152,0,0.5)",
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
              }}
            >
              <MedicalInformationIcon
                sx={{ color: "#ffb74d", fontSize: 18, mt: 0.2, flexShrink: 0 }}
              />
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#ffb74d",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    display: "block",
                  }}
                >
                  Informações Médicas Adicionais
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255,255,255,0.9)", mt: 0.25 }}
                >
                  {paciente.informacoesAdicionais}
                </Typography>
              </Box>
            </Box>
          )}

          {tratamentos.length > 0 &&
            (() => {
              const proximo = tratamentos[0];
              const s = situacaoVencimento(proximo.diasRestantes);
              return (
                <Box
                  sx={{
                    mt: 2,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: paperBg,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <AccessAlarmIcon sx={{ color: s.cor, fontSize: 20 }} />
                  <Typography
                    variant="body2"
                    sx={{ color: s.cor, fontWeight: 700 }}
                  >
                    Receita {s.label} · {proximo.medicamento}
                  </Typography>
                </Box>
              );
            })()}
        </CardContent>
      </Card>

      {/* Navegação por abas */}
      <Paper sx={{ borderRadius: 3, mb: 3, overflow: "hidden" }}>
        <Tabs
          value={abaAtiva}
          onChange={(_, novaAba) => setAbaAtiva(novaAba)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 1 }}
        >
          <Tab
            icon={<BadgeIcon fontSize="small" />}
            iconPosition="start"
            label="Dados"
            sx={{ textTransform: "none", fontWeight: 600 }}
          />
          <Tab
            icon={<EventNoteIcon fontSize="small" />}
            iconPosition="start"
            label={`Histórico (${grupos.length})`}
            sx={{ textTransform: "none", fontWeight: 600 }}
          />
          <Tab
            icon={<AccessAlarmIcon fontSize="small" />}
            iconPosition="start"
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <span>Tratamentos ({tratamentos.length})</span>
                {corPontoTratamento && (
                  <Box
                    component="span"
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: corPontoTratamento,
                      display: "inline-block",
                    }}
                  />
                )}
              </Box>
            }
            sx={{ textTransform: "none", fontWeight: 600 }}
          />
          <Tab
            icon={<MedicationIcon fontSize="small" />}
            iconPosition="start"
            label={`Receitas (${prontuario.receitas.length})`}
            sx={{ textTransform: "none", fontWeight: 600 }}
          />
          <Tab
            icon={<ScienceIcon fontSize="small" />}
            iconPosition="start"
            label={`Exames (${exames.length})`}
            sx={{ textTransform: "none", fontWeight: 600 }}
          />
        </Tabs>
      </Paper>

      {/* ABA 0: Dados do Paciente */}
      {abaAtiva === 0 && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <BadgeIcon color="primary" fontSize="small" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Dados do Paciente
              </Typography>
            </Box>

            {dadosPaciente.length === 0 ? (
              <Typography color="text.secondary">
                Nenhum dado cadastral complementar registrado.
              </Typography>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gap: 2.5,
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                  },
                }}
              >
                {dadosPaciente.map((item) => (
                  <Box
                    key={item.label}
                    sx={{
                      gridColumn:
                        item.label === "Endereço"
                          ? { sm: "span 2", md: "span 3" }
                          : undefined,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block" }}
                    >
                      {item.label}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* ABA 1: Histórico de Atendimentos */}
      {abaAtiva === 1 && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <EventNoteIcon color="primary" fontSize="small" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Histórico de Atendimentos
              </Typography>
              <Chip
                label={`${grupos.length} dia(s)`}
                size="small"
                color="primary"
              />
              {grupos.length > 1 && (
                <Button
                  size="small"
                  sx={{ ml: "auto" }}
                  onClick={() => definirTodosDias(!todosDiasAbertos)}
                >
                  {todosDiasAbertos ? "Recolher todos" : "Expandir todos"}
                </Button>
              )}
            </Box>

            {grupos.length === 0 ? (
              <Typography color="text.secondary">
                Nenhum atendimento registrado
              </Typography>
            ) : (
              <Box sx={{ position: "relative" }}>
                <Box
                  sx={{
                    position: "absolute",
                    left: 19,
                    top: 24,
                    bottom: 0,
                    width: 2,
                    bgcolor: isDark ? "grey.700" : "grey.200",
                    zIndex: 0,
                  }}
                />
                {grupos.map((grupo, grupoIdx) => (
                  <Box
                    key={grupo.chave}
                    sx={{
                      mb:
                        grupoIdx < grupos.length - 1
                          ? diaAberto(grupo.chave, grupoIdx)
                            ? 4
                            : 2
                          : 0,
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    <Box
                      onClick={() => alternarDia(grupo.chave, grupoIdx)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: diaAberto(grupo.chave, grupoIdx) ? 2 : 0,
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          bgcolor: "primary.main",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: `3px solid ${isDark ? "#1e1e1e" : "white"}`,
                          boxShadow: "0 0 0 2px #1976d240",
                          zIndex: 2,
                        }}
                      >
                        <EventNoteIcon sx={{ color: "white", fontSize: 18 }} />
                      </Box>
                      <Box
                        sx={{
                          flex: 1,
                          px: 2,
                          py: 0.75,
                          bgcolor: diaBg,
                          borderRadius: 2,
                          border: `1px solid ${timelineBorder}`,
                          position: "relative",
                          pr: 6,
                          transition: "background-color 0.2s ease",
                          "&:hover": { borderColor: "primary.main" },
                        }}
                      >
                        <ExpandMoreIcon
                          sx={{
                            position: "absolute",
                            right: 12,
                            top: "50%",
                            mt: "-12px",
                            color: "text.secondary",
                            transform: diaAberto(grupo.chave, grupoIdx)
                              ? "rotate(180deg)"
                              : "none",
                            transition: "transform 0.25s ease",
                          }}
                        />
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700, color: "primary.main" }}
                        >
                          {grupo.chave}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {grupo.consultas.length} consulta(s) ·{" "}
                          {grupo.consultas.filter((i) => i.triagem).length}{" "}
                          triagem(ns) ·{" "}
                          {grupo.consultas.reduce(
                            (acc, i) => acc + i.receitas.length,
                            0,
                          )}{" "}
                          receita(s)
                        </Typography>
                      </Box>
                    </Box>
                    <Collapse
                      in={diaAberto(grupo.chave, grupoIdx)}
                      timeout={250}
                      unmountOnExit
                    >
                      <Box
                        sx={{
                          pl: 7,
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        {grupo.consultas.map(
                          ({ consulta: c, triagem: t, receitas }) => {
                            const cor = statusCores[c.status] ?? "#1976d2";
                            return (
                              <Paper
                                key={c.id}
                                variant="outlined"
                                sx={{
                                  borderRadius: 2,
                                  overflow: "hidden",
                                  borderColor: timelineBorder,
                                  borderLeft: `4px solid ${cor}`,
                                }}
                              >
                                <Box
                                  sx={{
                                    p: 2,
                                    bgcolor: timelineBg,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    flexWrap: "wrap",
                                    gap: 1,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1.5,
                                    }}
                                  >
                                    <Avatar
                                      sx={{
                                        width: 32,
                                        height: 32,
                                        bgcolor: "#1565c0",
                                        fontSize: 12,
                                        fontWeight: 700,
                                      }}
                                    >
                                      {iniciais(c.nomeMedico)}
                                    </Avatar>
                                    <Box>
                                      <Typography
                                        variant="body2"
                                        sx={{ fontWeight: 600 }}
                                      >
                                        {c.nomeMedico}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        Consulta às{" "}
                                        {horaFormatada(c.dataConsulta)}
                                      </Typography>
                                    </Box>
                                  </Box>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      gap: 1,
                                      alignItems: "center",
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <Chip
                                      label={statusLabels[c.status] ?? c.status}
                                      size="small"
                                      sx={{
                                        bgcolor: cor,
                                        color: "white",
                                        fontWeight: 600,
                                        fontSize: 11,
                                      }}
                                    />
                                    {t && (
                                      <Chip
                                        icon={<MedicalServicesIcon />}
                                        label="Triagem"
                                        size="small"
                                        sx={{
                                          color: "#e65100",
                                          borderColor: "#e65100",
                                        }}
                                        variant="outlined"
                                      />
                                    )}
                                    {c.anotacoes && (
                                      <Chip
                                        icon={<EditNoteIcon />}
                                        label="Anotações"
                                        size="small"
                                        color="info"
                                        variant="outlined"
                                      />
                                    )}
                                    {receitas.length > 0 && (
                                      <Chip
                                        icon={<MedicationIcon />}
                                        label={`${receitas.length} receita(s)`}
                                        size="small"
                                        color="success"
                                        variant="outlined"
                                      />
                                    )}
                                  </Box>
                                </Box>
                                {t && (
                                  <Box
                                    sx={{
                                      p: 2,
                                      borderTop: `1px solid ${timelineBorder}`,
                                      bgcolor: isDark ? "#2d1a00" : "#fffaf5",
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        mb: 1.5,
                                      }}
                                    >
                                      <MedicalServicesIcon
                                        sx={{ fontSize: 15, color: "#e65100" }}
                                      />
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          fontWeight: 700,
                                          color: "#e65100",
                                          textTransform: "uppercase",
                                          letterSpacing: 0.5,
                                        }}
                                      >
                                        Triagem
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ ml: "auto" }}
                                      >
                                        Por:{" "}
                                        <strong>
                                          {t.nomeEnfermeiro || "—"}
                                        </strong>
                                      </Typography>
                                    </Box>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        gap: 3,
                                        mb: t.observacoes ? 1.5 : 0,
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 0.75,
                                        }}
                                      >
                                        <FavoriteIcon
                                          sx={{
                                            fontSize: 15,
                                            color: "error.main",
                                          }}
                                        />
                                        <Box>
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{
                                              display: "block",
                                              lineHeight: 1,
                                            }}
                                          >
                                            Pressão
                                          </Typography>
                                          <Typography
                                            variant="body2"
                                            sx={{ fontWeight: 600 }}
                                          >
                                            {t.pressaoArterial}
                                          </Typography>
                                        </Box>
                                      </Box>
                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 0.75,
                                        }}
                                      >
                                        <ThermostatIcon
                                          sx={{
                                            fontSize: 15,
                                            color: "warning.main",
                                          }}
                                        />
                                        <Box>
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{
                                              display: "block",
                                              lineHeight: 1,
                                            }}
                                          >
                                            Temperatura
                                          </Typography>
                                          <Typography
                                            variant="body2"
                                            sx={{ fontWeight: 600 }}
                                          >
                                            {t.temperatura}°C
                                          </Typography>
                                        </Box>
                                      </Box>
                                      {t.glicemia != null && (
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.75,
                                          }}
                                        >
                                          <MonitorHeartIcon
                                            sx={{
                                              fontSize: 15,
                                              color: "info.main",
                                            }}
                                          />
                                          <Box>
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                              sx={{
                                                display: "block",
                                                lineHeight: 1,
                                              }}
                                            >
                                              Glicemia
                                            </Typography>
                                            <Typography
                                              variant="body2"
                                              sx={{ fontWeight: 600 }}
                                            >
                                              {t.glicemia} mg/dL
                                            </Typography>
                                          </Box>
                                        </Box>
                                      )}
                                    </Box>
                                    {t.observacoes && (
                                      <Box
                                        sx={{
                                          mt: 1.5,
                                          p: 1.5,
                                          bgcolor: paperBg,
                                          borderRadius: 1,
                                          borderLeft: "3px solid #e65100",
                                        }}
                                      >
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          sx={{ fontStyle: "italic" }}
                                        >
                                          "{t.observacoes}"
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                )}
                                {c.anotacoes && (
                                  <Box
                                    sx={{
                                      p: 2,
                                      borderTop: `1px solid ${timelineBorder}`,
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                        mb: 1,
                                      }}
                                    >
                                      <EditNoteIcon
                                        fontSize="small"
                                        color="info"
                                      />
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          fontWeight: 600,
                                          color: "info.main",
                                          textTransform: "uppercase",
                                          letterSpacing: 0.5,
                                        }}
                                      >
                                        Anotações Clínicas
                                      </Typography>
                                    </Box>
                                    <Paper
                                      variant="outlined"
                                      sx={{
                                        p: 1.5,
                                        bgcolor: paperBg,
                                        borderRadius: 1,
                                      }}
                                    >
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          whiteSpace: "pre-wrap",
                                          lineHeight: 1.6,
                                        }}
                                      >
                                        {c.anotacoes}
                                      </Typography>
                                    </Paper>
                                  </Box>
                                )}
                                {receitas.length > 0 && (
                                  <Box
                                    sx={{
                                      p: 2,
                                      borderTop: `1px solid ${timelineBorder}`,
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                        mb: 1.5,
                                      }}
                                    >
                                      <MedicationIcon
                                        fontSize="small"
                                        color="success"
                                      />
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          fontWeight: 600,
                                          color: "success.main",
                                          textTransform: "uppercase",
                                          letterSpacing: 0.5,
                                        }}
                                      >
                                        Receitas Prescritas
                                      </Typography>
                                    </Box>
                                    {receitas.map((receita) => {
                                      const medsAgrupados = agruparMedicamentos(
                                        receita.medicamentos,
                                      );
                                      return (
                                        <Box
                                          key={receita.id}
                                          sx={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: 1,
                                            mb: 1,
                                          }}
                                        >
                                          {medsAgrupados.map((m, i) => (
                                            <Box
                                              key={i}
                                              sx={{
                                                flex: "1 1 180px",
                                                maxWidth: {
                                                  xs: "100%",
                                                  sm: "calc(50% - 4px)",
                                                  md: "calc(33.33% - 5px)",
                                                },
                                              }}
                                            >
                                              <Paper
                                                variant="outlined"
                                                sx={{
                                                  p: 1.5,
                                                  borderRadius: 1,
                                                  bgcolor: paperBg,
                                                }}
                                              >
                                                <Box
                                                  sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent:
                                                      "space-between",
                                                    gap: 1,
                                                  }}
                                                >
                                                  <Typography
                                                    variant="body2"
                                                    sx={{ fontWeight: 600 }}
                                                  >
                                                    {m.nome}
                                                  </Typography>
                                                  {m.ocorrencias > 1 && (
                                                    <Chip
                                                      label={`${m.ocorrencias}x`}
                                                      size="small"
                                                      color="success"
                                                      sx={{
                                                        height: 18,
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                      }}
                                                    />
                                                  )}
                                                </Box>
                                                <Typography
                                                  variant="caption"
                                                  color="text.secondary"
                                                >
                                                  {[m.dosagem, m.posologia]
                                                    .filter(Boolean)
                                                    .join(" · ")}
                                                </Typography>
                                              </Paper>
                                            </Box>
                                          ))}
                                        </Box>
                                      );
                                    })}
                                  </Box>
                                )}
                                {!t &&
                                  !c.anotacoes &&
                                  receitas.length === 0 && (
                                    <Box
                                      sx={{
                                        p: 2,
                                        borderTop: `1px solid ${timelineBorder}`,
                                      }}
                                    >
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ fontStyle: "italic" }}
                                      >
                                        Nenhuma anotação ou receita registrada.
                                      </Typography>
                                    </Box>
                                  )}
                              </Paper>
                            );
                          },
                        )}
                      </Box>
                    </Collapse>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* ABA 2: Tratamentos Acompanhados */}
      {abaAtiva === 2 && (
        <TratamentosAcompanhados tratamentos={tratamentos} recolhivel={false} />
      )}

      {/* ABA 3: Receitas */}
      {abaAtiva === 3 && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <MedicationIcon color="primary" fontSize="small" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Receitas Emitidas
              </Typography>
              <Chip
                label={receitasOrdenadas.length}
                size="small"
                color="primary"
              />
            </Box>

            {receitasOrdenadas.length > 0 && (
              <TextField
                size="small"
                fullWidth
                placeholder="Buscar por medicamento..."
                value={buscaReceita}
                onChange={(e) => setBuscaReceita(e.target.value)}
                sx={{ mb: 2.5 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <SearchIcon
                        color="action"
                        fontSize="small"
                        sx={{ mr: 1 }}
                      />
                    ),
                  },
                }}
              />
            )}

            {receitasOrdenadas.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                <MedicationIcon sx={{ fontSize: 40, opacity: 0.15, mb: 1 }} />
                <Typography variant="body2" sx={{ opacity: 0.5 }}>
                  Nenhuma receita registrada
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {receitasFiltradas.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Nenhuma receita com esse medicamento.
                  </Typography>
                )}
                {receitasFiltradas.map((receita, idxReceita) => {
                  const aberta = receitaAberta(receita.id, idxReceita);
                  const consulta = consultaPorId.get(receita.consultaId);
                  const medsAgrupados = agruparMedicamentos(
                    receita.medicamentos,
                  );
                  return (
                    <Paper
                      key={receita.id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        borderLeft: "4px solid #2e7d32",
                      }}
                    >
                      <Box
                        onClick={() =>
                          setReceitasAbertas((prev) => ({
                            ...prev,
                            [receita.id]: !aberta,
                          }))
                        }
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: 1,
                          mb: aberta ? 1.5 : 0,
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                      >
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 700 }}
                          >
                            Emitida em {dataChave(receita.dataEmissao)} às{" "}
                            {horaFormatada(receita.dataEmissao)}
                          </Typography>
                          {consulta && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {consulta.nomeMedico}
                            </Typography>
                          )}
                        </Box>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Chip
                            label={`${medsAgrupados.length} medicamento(s)`}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                          <ExpandMoreIcon
                            sx={{
                              color: "text.secondary",
                              transform: aberta ? "rotate(180deg)" : "none",
                              transition: "transform 0.25s ease",
                            }}
                          />
                        </Box>
                      </Box>

                      <Collapse in={aberta} timeout={250} unmountOnExit>
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}
                        >
                          {medsAgrupados.map((m, idx) => (
                            <Box
                              key={idx}
                              sx={{
                                flex: "1 1 220px",
                                maxWidth: {
                                  xs: "100%",
                                  sm: "calc(50% - 6px)",
                                  md: "calc(33.33% - 8px)",
                                },
                              }}
                            >
                              <Paper
                                variant="outlined"
                                sx={{
                                  p: 1.5,
                                  borderRadius: 1.5,
                                  bgcolor: timelineBg,
                                  height: "100%",
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 1,
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 700 }}
                                  >
                                    {m.nome}
                                  </Typography>
                                  {m.ocorrencias > 1 && (
                                    <Chip
                                      label={`${m.ocorrencias}x`}
                                      size="small"
                                      color="success"
                                      sx={{
                                        height: 20,
                                        fontSize: 11,
                                        fontWeight: 700,
                                      }}
                                    />
                                  )}
                                </Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: "block", mt: 0.25 }}
                                >
                                  {[m.dosagem, m.posologia]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </Typography>
                                {m.quantidade && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: "block" }}
                                  >
                                    Qtd: {m.quantidade}
                                  </Typography>
                                )}
                                {m.acompanharVencimento && m.validadeDias && (
                                  <Chip
                                    label={`Validade: ${m.validadeDias} dias`}
                                    size="small"
                                    color="info"
                                    variant="outlined"
                                    sx={{ mt: 1, fontSize: 10, height: 20 }}
                                  />
                                )}
                              </Paper>
                            </Box>
                          ))}
                        </Box>
                      </Collapse>
                    </Paper>
                  );
                })}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* ABA 4: Exames */}
      {abaAtiva === 4 && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 0 }}>
            {erroExame && (
              <Box sx={{ p: 2.5, pb: 0 }}>
                <Alert severity="error" onClose={() => setErroExame("")}>
                  {erroExame}
                </Alert>
              </Box>
            )}
            <Box
              sx={{
                p: 2.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ScienceIcon color="primary" fontSize="small" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Exames
                </Typography>
                <Chip label={exames.length} size="small" color="primary" />
              </Box>
              {isMedico && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setFormularioAberto((v) => !v)}
                >
                  Adicionar
                </Button>
              )}
            </Box>

            <Divider />

            {isMedico && (
              <Collapse in={formularioAberto}>
                <Box
                  sx={{
                    p: 2.5,
                    bgcolor: isDark ? "grey.900" : "#f8faff",
                    borderBottom: `1px solid ${timelineBorder}`,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}
                  >
                    Novo Exame
                  </Typography>
                  {erroForm && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {erroForm}
                    </Alert>
                  )}
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                    <FormControl sx={{ flex: "1 1 160px" }} size="small">
                      <InputLabel>Categoria</InputLabel>
                      <Select
                        value={form.categoria}
                        label="Categoria"
                        onChange={(e) =>
                          setForm((f) => ({ ...f, categoria: e.target.value }))
                        }
                      >
                        {CATEGORIAS.map((c) => (
                          <MenuItem key={c} value={c}>
                            {categoriaLabel[c]}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="Nome do exame *"
                      size="small"
                      value={form.nome}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, nome: e.target.value }))
                      }
                      sx={{ flex: "2 1 200px" }}
                    />

                    {/* Seletor padronizado idêntico ao de Categoria, sem opção "Outro" */}
                    <FormControl sx={{ flex: "2 1 220px" }} size="small">
                      <InputLabel>Médico solicitante *</InputLabel>
                      <Select
                        value={form.medicoSolicitante}
                        label="Médico solicitante *"
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            medicoSolicitante: e.target.value,
                          }))
                        }
                      >
                        <MenuItem value="">
                          <em>Selecione o médico...</em>
                        </MenuItem>
                        {medicos.map((m) => (
                          <MenuItem key={m.id} value={m.nome}>
                            {m.nome}{" "}
                            {m.especialidade ? `(${m.especialidade})` : ""}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      label="Data do exame"
                      type="date"
                      size="small"
                      value={form.dataExame}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, dataExame: e.target.value }))
                      }
                      sx={{ flex: "1 1 160px" }}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <TextField
                      label="Descrição"
                      size="small"
                      value={form.descricao}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, descricao: e.target.value }))
                      }
                      sx={{ flex: "1 1 100%" }}
                    />
                    <TextField
                      label="Observações / valores relevantes"
                      size="small"
                      multiline
                      rows={2}
                      value={form.observacoes}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, observacoes: e.target.value }))
                      }
                      sx={{ flex: "1 1 100%" }}
                      placeholder="Ex: Glicose: 95 mg/dL; Colesterol: 180 mg/dL"
                    />
                    <Box
                      sx={{
                        flex: "1 1 100%",
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          flexWrap: "wrap",
                        }}
                      >
                        <Button
                          variant="outlined"
                          component="label"
                          size="small"
                          startIcon={<AttachFileIcon />}
                          disabled={
                            salvando ||
                            arquivosNovoExame.length >= MAXIMO_ARQUIVOS_EXAME
                          }
                        >
                          {arquivosNovoExame.length > 0
                            ? `Adicionar mais arquivos (${arquivosNovoExame.length}/${MAXIMO_ARQUIVOS_EXAME})`
                            : "Anexar arquivo(s) (opcional)"}
                          <input
                            type="file"
                            hidden
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              if (e.target.files) {
                                handleSelecionarArquivosNovoExame(
                                  e.target.files,
                                );
                                e.target.value = "";
                              }
                            }}
                          />
                        </Button>
                        <Typography variant="caption" color="text.secondary">
                          PDF, JPG ou PNG (máx. 10MB cada)
                        </Typography>
                      </Box>

                      {arquivosNovoExame.length > 0 && (
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}
                        >
                          {arquivosNovoExame.map((arq, idx) => (
                            <Chip
                              key={`${arq.name}-${idx}`}
                              label={arq.name}
                              size="small"
                              color="primary"
                              variant="outlined"
                              onDelete={() =>
                                setArquivosNovoExame((prev) =>
                                  prev.filter((_, i) => i !== idx),
                                )
                              }
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      mt: 2,
                      justifyContent: "flex-end",
                    }}
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setFormularioAberto(false);
                        setArquivosNovoExame([]);
                        setErroForm("");
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleSalvarExame}
                      disabled={salvando}
                    >
                      {salvando ? <CircularProgress size={16} /> : "Salvar"}
                    </Button>
                  </Box>
                </Box>
              </Collapse>
            )}

            <Box sx={{ p: 2.5 }}>
              {exames.length === 0 ? (
                <Box
                  sx={{ textAlign: "center", py: 4, color: "text.secondary" }}
                >
                  <ScienceIcon sx={{ fontSize: 40, opacity: 0.15, mb: 1 }} />
                  <Typography variant="body2" sx={{ opacity: 0.5 }}>
                    Nenhum exame registrado
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                >
                  {exames.map((exame) => {
                    const listaArquivos = exame.arquivos ?? [];
                    const totalAnexos =
                      listaArquivos.length > 0
                        ? listaArquivos.length
                        : exame.temArquivo
                          ? 1
                          : 0;
                    const podeAnexarMais =
                      isMedico && totalAnexos < MAXIMO_ARQUIVOS_EXAME;

                    return (
                      <Paper
                        key={exame.id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          borderLeft: `4px solid ${categoriaCor[exame.categoria] ?? "#546e7a"}`,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: 1.5,
                          }}
                        >
                          <Box sx={{ flex: 1, minWidth: 220 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 0.5,
                                flexWrap: "wrap",
                              }}
                            >
                              <Chip
                                label={
                                  categoriaLabel[exame.categoria] ??
                                  exame.categoria
                                }
                                size="small"
                                sx={{
                                  bgcolor:
                                    categoriaCor[exame.categoria] ?? "#546e7a",
                                  color: "white",
                                  fontWeight: 600,
                                  fontSize: 11,
                                }}
                              />
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                              >
                                {exame.nome}
                              </Typography>
                              {totalAnexos > 0 && (
                                <Chip
                                  label={`${totalAnexos} anexo(s)`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: 11 }}
                                />
                              )}
                            </Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {new Date(
                                exame.dataExame + "T00:00:00",
                              ).toLocaleDateString("pt-BR")}{" "}
                              · Dr(a). {exame.medicoSolicitante}
                            </Typography>
                            {exame.descricao && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.5 }}
                              >
                                {exame.descricao}
                              </Typography>
                            )}
                            {exame.observacoes && (
                              <Box
                                sx={{
                                  mt: 1,
                                  p: 1,
                                  bgcolor: isDark ? "grey.800" : "#f5f5f5",
                                  borderRadius: 1,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{ fontFamily: "monospace" }}
                                >
                                  {exame.observacoes}
                                </Typography>
                              </Box>
                            )}

                            {/* Lista de anexos disponíveis para download */}
                            {totalAnexos > 0 && (
                              <Box
                                sx={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 0.75,
                                  mt: 1.25,
                                }}
                              >
                                {listaArquivos.length > 0 ? (
                                  listaArquivos.map((arq) => (
                                    <Chip
                                      key={arq.id}
                                      icon={
                                        <DownloadIcon sx={{ fontSize: 15 }} />
                                      }
                                      label={arq.nomeArquivoOriginal}
                                      size="small"
                                      color="success"
                                      variant="outlined"
                                      onClick={() =>
                                        handleDownload(
                                          exame,
                                          arq.id,
                                          arq.nomeArquivoOriginal,
                                        )
                                      }
                                      sx={{ cursor: "pointer", maxWidth: 260 }}
                                    />
                                  ))
                                ) : (
                                  <Chip
                                    icon={
                                      <DownloadIcon sx={{ fontSize: 15 }} />
                                    }
                                    label={
                                      exame.nomeArquivoOriginal ??
                                      "Baixar anexo"
                                    }
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                    onClick={() => handleDownload(exame)}
                                    sx={{ cursor: "pointer", maxWidth: 260 }}
                                  />
                                )}
                              </Box>
                            )}
                          </Box>

                          {/* Ações do exame (Anexar arquivos + Analisar com IA) */}
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              flexShrink: 0,
                              alignItems: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            {podeAnexarMais && (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={
                                  uploadingId === exame.id ? (
                                    <CircularProgress size={14} />
                                  ) : (
                                    <AttachFileIcon />
                                  )
                                }
                                component="label"
                                disabled={
                                  uploadingId === exame.id ||
                                  analisandoId === exame.id
                                }
                              >
                                {totalAnexos > 0
                                  ? `Anexar (${totalAnexos}/${MAXIMO_ARQUIVOS_EXAME})`
                                  : "Anexar"}
                                <input
                                  type="file"
                                  hidden
                                  multiple
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => {
                                    if (e.target.files) {
                                      handleUploadMultiplo(
                                        exame,
                                        e.target.files,
                                      );
                                      e.target.value = "";
                                    }
                                  }}
                                />
                              </Button>
                            )}

                            {isMedico && totalAnexos > 0 && (
                              <Button
                                size="small"
                                variant={
                                  exame.analiseIaJson ? "outlined" : "contained"
                                }
                                startIcon={
                                  analisandoId === exame.id ? (
                                    <CircularProgress
                                      size={14}
                                      color="inherit"
                                    />
                                  ) : (
                                    <AutoAwesomeIcon />
                                  )
                                }
                                onClick={() => handleAnalisarIa(exame.id)}
                                disabled={
                                  analisandoId === exame.id ||
                                  uploadingId === exame.id
                                }
                                sx={
                                  exame.analiseIaJson
                                    ? {
                                        borderColor: "#7b1fa2",
                                        color: "#7b1fa2",
                                        "&:hover": {
                                          borderColor: "#6a1b9a",
                                          bgcolor: "rgba(123, 31, 162, 0.06)",
                                        },
                                      }
                                    : {
                                        bgcolor: "#7b1fa2",
                                        "&:hover": { bgcolor: "#6a1b9a" },
                                      }
                                }
                              >
                                {analisandoId === exame.id
                                  ? "Analisando..."
                                  : exame.analiseIaJson
                                    ? "Reanalisar"
                                    : "Analisar com IA"}
                              </Button>
                            )}
                          </Box>
                        </Box>

                        {/* Painel estruturado com o resultado da IA */}
                        {exame.analiseIaJson && (
                          <ExameAnaliseIaPanel
                            analiseIaJson={exame.analiseIaJson}
                            dataAnaliseIa={exame.dataAnaliseIa}
                          />
                        )}
                      </Paper>
                    );
                  })}
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      )}
    </>
  );
}
