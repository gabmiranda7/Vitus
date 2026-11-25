import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  InputAdornment,
  Avatar,
  Chip,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
  alpha,
} from "@mui/material";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import SearchIcon from "@mui/icons-material/Search";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import EventNoteIcon from "@mui/icons-material/EventNote";
import ScheduleIcon from "@mui/icons-material/Schedule";
import Layout from "../../components/layout/Layout";
import api from "../../services/api";
import { useAtualizacaoAutomatica } from "../../hooks/useAtualizacaoAutomatica";
import { Consulta, Medico } from "../../types";

const POR_PAGINA = 9;
const STATUS_PENDENTES = ["Agendada", "EmTriagem", "AguardandoAtendimento"];

function iniciais(nome: string) {
  return nome
    .replace(/^Dr\.?\s*/i, "")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const CORES_ESP: Record<string, string> = {
  Cardiologia: "#c62828",
  Pediatria: "#1565c0",
  Ortopedia: "#2e7d32",
  Neurologia: "#6a1b9a",
  Dermatologia: "#e65100",
  Ginecologia: "#ad1457",
  "Clínico Geral": "#00695c",
  Oftalmologia: "#0277bd",
  Psiquiatria: "#4527a0",
  Endocrinologia: "#00838f",
  Urologia: "#558b2f",
  Reumatologia: "#6d4c41",
};

function corEspecialidade(esp: string) {
  return CORES_ESP[esp] ?? "#1976d2";
}

function mesmoDia(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatarProxima(data: Date) {
  const hora = data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (mesmoDia(data, new Date())) return `Hoje, ${hora}`;
  const dia = data.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
  return `${dia}, ${hora}`;
}

interface Resumo {
  hoje: number;
  emAtendimento: boolean;
  proxima: Consulta | null;
}

export default function MedicosPage() {
  const navigate = useNavigate();
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroEsp, setFiltroEsp] = useState("");
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    carregar();
  }, []);
  useAtualizacaoAutomatica(carregar, 30000);

  async function carregar() {
    const [rMedicos, rConsultas] = await Promise.all([
      api.get("/api/medicos"),
      api.get("/api/consultas").catch(() => ({ data: [] })),
    ]);
    setMedicos(rMedicos.data);
    setConsultas(rConsultas.data);
  }

  // Situação de cada médico, calculada a partir das consultas já carregadas
  const resumoPorMedico = useMemo(() => {
    const agora = new Date();
    const mapa = new Map<string, Resumo>();
    for (const m of medicos) {
      const dele = consultas.filter((c) => c.medicoId === m.id);
      const pendentes = dele
        .filter((c) => STATUS_PENDENTES.includes(c.status))
        .filter((c) => new Date(c.dataConsulta) >= agora)
        .sort(
          (a, b) =>
            new Date(a.dataConsulta).getTime() -
            new Date(b.dataConsulta).getTime(),
        );
      mapa.set(m.id, {
        hoje: dele.filter(
          (c) =>
            c.status !== "Cancelada" &&
            mesmoDia(new Date(c.dataConsulta), agora),
        ).length,
        emAtendimento: dele.some((c) => c.status === "EmAtendimento"),
        proxima: pendentes[0] ?? null,
      });
    }
    return mapa;
  }, [medicos, consultas]);

  const especialidades = useMemo(
    () =>
      [...new Set(medicos.map((m) => m.especialidade))].filter(Boolean).sort(),
    [medicos],
  );

  const filtrados = useMemo(
    () =>
      medicos.filter(
        (m) =>
          `${m.nome} ${m.crm}`.toLowerCase().includes(busca.toLowerCase()) &&
          (filtroEsp === "" || m.especialidade === filtroEsp),
      ),
    [medicos, busca, filtroEsp],
  );

  useEffect(() => {
    setPagina(1);
  }, [busca, filtroEsp]);

  const resumoEsp = useMemo(() => {
    const map: Record<string, number> = {};
    medicos.forEach((m) => {
      map[m.especialidade] = (map[m.especialidade] ?? 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [medicos]);

  const totais = useMemo(() => {
    let emAtendimento = 0;
    let consultasHoje = 0;
    resumoPorMedico.forEach((r) => {
      if (r.emAtendimento) emAtendimento++;
      consultasHoje += r.hoje;
    });
    return { emAtendimento, consultasHoje };
  }, [resumoPorMedico]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = filtrados.slice(
    (pagina - 1) * POR_PAGINA,
    pagina * POR_PAGINA,
  );

  const indicadores = [
    {
      label: "Médicos cadastrados",
      valor: medicos.length,
      cor: "#1976d2",
      Icon: LocalHospitalIcon,
    },
    {
      label: "Em atendimento agora",
      valor: totais.emAtendimento,
      cor: "#7b1fa2",
      Icon: EventAvailableIcon,
    },
    {
      label: "Consultas hoje",
      valor: totais.consultasHoje,
      cor: "#2e7d32",
      Icon: EventNoteIcon,
    },
  ];

  return (
    <Layout>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <LocalHospitalIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          Médicos
        </Typography>
        <Chip label={medicos.length} size="small" color="primary" />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 1.5,
          mb: 2.5,
        }}
      >
        {indicadores.map(({ label, valor, cor, Icon }) => (
          <Paper
            key={label}
            variant="outlined"
            sx={{
              p: 1.5,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Avatar
              variant="rounded"
              sx={{
                bgcolor: alpha(cor, 0.12),
                color: cor,
                width: 38,
                height: 38,
              }}
            >
              <Icon fontSize="small" />
            </Avatar>
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, lineHeight: 1.1 }}
              >
                {valor}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {resumoEsp.length > 0 && (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2.5 }}>
          {resumoEsp.map(([esp, count]) => {
            const cor = corEspecialidade(esp);
            const ativo = filtroEsp === esp;
            return (
              <Chip
                key={esp}
                label={`${esp} · ${count}`}
                size="small"
                clickable
                onClick={() => setFiltroEsp(ativo ? "" : esp)}
                sx={{
                  fontWeight: 600,
                  fontSize: 12,
                  color: cor,
                  bgcolor: alpha(cor, ativo ? 0.22 : 0.08),
                  border: `1px solid ${alpha(cor, ativo ? 0.6 : 0.25)}`,
                }}
              />
            );
          })}
        </Box>
      )}

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar médico por nome ou CRM..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            },
          }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Especialidade</InputLabel>
          <Select
            value={filtroEsp}
            label="Especialidade"
            onChange={(e) => setFiltroEsp(e.target.value)}
          >
            <MenuItem value="">Todas</MenuItem>
            {especialidades.map((e) => (
              <MenuItem key={e} value={e}>
                {e}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {filtrados.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
          <LocalHospitalIcon sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
          <Typography variant="h6" sx={{ opacity: 0.5 }}>
            {busca || filtroEsp
              ? "Nenhum médico encontrado"
              : "Nenhum médico cadastrado"}
          </Typography>
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 2,
            }}
          >
            {paginaAtual.map((m) => {
              const cor = corEspecialidade(m.especialidade);
              const r = resumoPorMedico.get(m.id);
              const corStatus = r?.emAtendimento ? "#7b1fa2" : "#2e7d32";
              return (
                <Paper
                  key={m.id}
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    transition: "box-shadow 0.2s ease, transform 0.2s ease",
                    "&:hover": {
                      boxShadow: 4,
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <Box sx={{ height: 5, bgcolor: cor }} />
                  <Box
                    sx={{
                      p: 2,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                      flex: 1,
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: cor,
                          width: 46,
                          height: 46,
                          fontSize: 15,
                          fontWeight: 700,
                        }}
                      >
                        {iniciais(m.nome)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 700,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {m.nome}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          CRM: {m.crm}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Chip
                        label={m.especialidade}
                        size="small"
                        sx={{
                          bgcolor: alpha(cor, 0.12),
                          color: cor,
                          fontWeight: 600,
                          fontSize: 11,
                        }}
                      />
                      <Chip
                        size="small"
                        label={
                          r?.emAtendimento ? "Em atendimento" : "Disponível"
                        }
                        sx={{
                          bgcolor: alpha(corStatus, 0.12),
                          color: corStatus,
                          fontWeight: 600,
                          fontSize: 11,
                        }}
                      />
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.75,
                        p: 1.25,
                        borderRadius: 2,
                        bgcolor: "action.hover",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <EventNoteIcon sx={{ fontSize: 16 }} color="action" />
                        <Typography variant="caption" color="text.secondary">
                          Hoje:
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {r?.hoje ?? 0}{" "}
                          {(r?.hoje ?? 0) === 1 ? "consulta" : "consultas"}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <ScheduleIcon sx={{ fontSize: 16 }} color="action" />
                        <Typography variant="caption" color="text.secondary">
                          Próxima:
                        </Typography>
                        <Typography
                          variant="caption"
                          noWrap
                          sx={{ fontWeight: 700, minWidth: 0 }}
                        >
                          {r?.proxima
                            ? formatarProxima(new Date(r.proxima.dataConsulta))
                            : "sem consultas agendadas"}
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EventAvailableIcon />}
                      onClick={() =>
                        navigate("/consultas", {
                          state: { novoMedicoId: m.id },
                        })
                      }
                      sx={{ mt: "auto" }}
                    >
                      Agendar consulta
                    </Button>
                  </Box>
                </Paper>
              );
            })}
          </Box>

          {totalPaginas > 1 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 2,
                mt: 3,
              }}
            >
              <IconButton
                onClick={() => setPagina((n) => Math.max(1, n - 1))}
                disabled={pagina === 1}
              >
                <NavigateBeforeIcon />
              </IconButton>
              <Typography variant="body2" color="text.secondary">
                Página {pagina} de {totalPaginas} · {filtrados.length} médico(s)
              </Typography>
              <IconButton
                onClick={() => setPagina((n) => Math.min(totalPaginas, n + 1))}
                disabled={pagina === totalPaginas}
              >
                <NavigateNextIcon />
              </IconButton>
            </Box>
          )}
        </>
      )}
    </Layout>
  );
}
