import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Paper,
  Typography,
  alpha,
} from "@mui/material";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import { Tratamento } from "../../types";
import { dataVencimentoBr, situacaoVencimento } from "./vencimento";

interface TratamentosAcompanhadosProps {
  tratamentos: Tratamento[];
  recolhivel?: boolean;
}

type Filtro = "todos" | "vencidos" | "vencendo" | "emdia";

const FAIXAS: {
  id: Exclude<Filtro, "todos">;
  label: string;
  cor: string;
  Icon: React.ElementType;
  contem: (dias: number) => boolean;
}[] = [
  {
    id: "vencidos",
    label: "Vencidos",
    cor: "#c62828",
    Icon: ErrorOutlinedIcon,
    contem: (d) => d < 0,
  },
  {
    id: "vencendo",
    label: "Vencem em até 30 dias",
    cor: "#e65100",
    Icon: ScheduleIcon,
    contem: (d) => d >= 0 && d <= 30,
  },
  {
    id: "emdia",
    label: "Em dia",
    cor: "#2e7d32",
    Icon: CheckCircleOutlinedIcon,
    contem: (d) => d > 30,
  },
];

/** Percentual do prazo de validade já consumido (0 a 100). */
function percentualConsumido(t: Tratamento) {
  if (!t.validadeDias || t.validadeDias <= 0) return 100;
  const consumido = t.validadeDias - t.diasRestantes;
  return Math.min(100, Math.max(0, (consumido / t.validadeDias) * 100));
}

export default function TratamentosAcompanhados({
  tratamentos,
}: TratamentosAcompanhadosProps) {
  const [filtro, setFiltro] = useState<Filtro>("todos");

  // Mais urgentes primeiro (vencidos, depois os que vencem antes)
  const ordenados = [...tratamentos].sort(
    (a, b) => a.diasRestantes - b.diasRestantes,
  );
  const faixaAtiva = FAIXAS.find((f) => f.id === filtro);
  const visiveis = faixaAtiva
    ? ordenados.filter((t) => faixaAtiva.contem(t.diasRestantes))
    : ordenados;

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
          <EventRepeatIcon color="primary" fontSize="small" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Tratamentos acompanhados
          </Typography>
          <Chip label={tratamentos.length} size="small" color="primary" />
        </Box>

        {tratamentos.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
            <EventRepeatIcon sx={{ fontSize: 40, opacity: 0.15, mb: 1 }} />
            <Typography variant="body2" sx={{ opacity: 0.5 }}>
              Nenhum tratamento acompanhado
            </Typography>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                gap: 1.5,
                mb: 3,
              }}
            >
              {FAIXAS.map(({ id, label, cor, Icon, contem }) => {
                const qtd = tratamentos.filter((t) =>
                  contem(t.diasRestantes),
                ).length;
                const ativo = filtro === id;
                return (
                  <Paper
                    key={id}
                    variant="outlined"
                    onClick={() => setFiltro(ativo ? "todos" : id)}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      borderColor: ativo ? cor : "divider",
                      bgcolor: ativo ? alpha(cor, 0.08) : "transparent",
                      opacity: qtd === 0 && !ativo ? 0.55 : 1,
                      transition: "all 0.2s ease",
                      "&:hover": { borderColor: cor },
                    }}
                  >
                    <Icon sx={{ color: cor }} />
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, lineHeight: 1.1 }}
                      >
                        {qtd}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {label}
                      </Typography>
                    </Box>
                  </Paper>
                );
              })}
            </Box>

            {visiveis.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Nenhum tratamento nesta situação.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {visiveis.map((t, i) => {
                  const s = situacaoVencimento(t.diasRestantes);
                  return (
                    <Paper
                      key={`${t.receitaId}-${t.medicamento}-${i}`}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        borderLeft: `4px solid ${s.cor}`,
                      }}
                    >
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
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          {t.medicamento}
                        </Typography>
                        <Chip
                          label={
                            s.label.charAt(0).toUpperCase() + s.label.slice(1)
                          }
                          size="small"
                          sx={{
                            bgcolor: alpha(s.cor, 0.12),
                            color: s.cor,
                            fontWeight: 700,
                          }}
                        />
                      </Box>

                      <LinearProgress
                        variant="determinate"
                        value={percentualConsumido(t)}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: alpha(s.cor, 0.15),
                          "& .MuiLinearProgress-bar": {
                            bgcolor: s.cor,
                            borderRadius: 3,
                          },
                        }}
                      />
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: 1,
                          mt: 0.75,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Emitida em{" "}
                          {new Date(t.dataEmissao).toLocaleDateString("pt-BR")}{" "}
                          · validade de {t.validadeDias} dias
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Vence em{" "}
                          <strong>{dataVencimentoBr(t.dataVencimento)}</strong>
                        </Typography>
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
