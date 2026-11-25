import { useMemo } from "react";
import {
  Alert,
  Box,
  Chip,
  Divider,
  Paper,
  SvgIcon,
  Typography,
  useTheme,
} from "@mui/material";
import { AnaliseExameIa } from "../../types";

interface ExameAnaliseIaPanelProps {
  analiseIaJson: string;
  dataAnaliseIa?: string | null;
}

export default function ExameAnaliseIaPanel({
  analiseIaJson,
  dataAnaliseIa,
}: ExameAnaliseIaPanelProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const analise = useMemo<AnaliseExameIa | null>(() => {
    try {
      return JSON.parse(analiseIaJson) as AnaliseExameIa;
    } catch {
      return null;
    }
  }, [analiseIaJson]);

  if (!analise) return null;

  return (
    <Paper
      variant="outlined"
      sx={{
        mt: 2,
        p: 2,
        borderRadius: 2,
        bgcolor: isDark ? "rgba(123, 31, 162, 0.08)" : "#faf5ff",
        borderColor: isDark ? "rgba(186, 104, 200, 0.3)" : "#e1bee7",
      }}
    >
      {/* Cabeçalho do painel */}
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <SvgIcon sx={{ fontSize: 18, color: "#7b1fa2" }}>
            <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z" />
          </SvgIcon>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: "#7b1fa2" }}
          >
            Triagem Auxiliar por IA
          </Typography>
        </Box>
        {dataAnaliseIa && (
          <Typography variant="caption" color="text.secondary">
            Gerada em{" "}
            {new Date(dataAnaliseIa).toLocaleString("pt-BR", {
              dateStyle: "short",
              timeStyle: "short",
            })}
            {analise.geradoPorMedico && (
              <>
                {" "}
                por <strong>{analise.geradoPorMedico}</strong>
              </>
            )}
          </Typography>
        )}
      </Box>

      {/* Resumo Geral */}
      <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6 }}>
        {analise.resumoGeral}
      </Typography>

      {/* Parâmetros Alterados */}
      {analise.parametrosAlterados?.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
            <SvgIcon sx={{ fontSize: 16, color: "error.main" }}>
              <path d="M12 5.99L19.53 19H4.47L12 5.99M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z" />
            </SvgIcon>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: "error.main",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Parâmetros Alterados ({analise.parametrosAlterados.length})
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {analise.parametrosAlterados.map((p, idx) => (
              <Paper
                key={idx}
                variant="outlined"
                sx={{
                  p: 1.25,
                  borderRadius: 1.5,
                  borderLeft: "3px solid #d32f2f",
                  bgcolor: isDark ? "grey.900" : "background.paper",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {p.nome}:{" "}
                    <Box component="span" sx={{ color: "error.main" }}>
                      {p.valorEncontrado}
                    </Box>
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Ref: {p.valorReferencia}
                    </Typography>
                    <Chip
                      label={p.status}
                      size="small"
                      color="error"
                      variant="outlined"
                      sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
                    />
                  </Box>
                </Box>
                {p.observacaoClinica && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 0.5 }}
                  >
                    {p.observacaoClinica}
                  </Typography>
                )}
              </Paper>
            ))}
          </Box>
        </Box>
      )}

      {/* Pontos de Atenção */}
      {analise.pontosDeAtencao?.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.75 }}
          >
            <SvgIcon sx={{ fontSize: 16, color: "warning.main" }}>
              <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
            </SvgIcon>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: "warning.main",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Pontos de Atenção Clínica
            </Typography>
          </Box>
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {analise.pontosDeAtencao.map((ponto, idx) => (
              <Typography
                key={idx}
                component="li"
                variant="caption"
                sx={{ display: "list-item", mb: 0.25 }}
              >
                {ponto}
              </Typography>
            ))}
          </Box>
        </Box>
      )}

      {/* Parâmetros Normais */}
      {analise.parametrosNormais?.length > 0 && (
        <Box sx={{ mb: 1.5 }}>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.75 }}
          >
            <SvgIcon sx={{ fontSize: 16, color: "success.main" }}>
              <path d="M16.59 7.58L10 14.17l-3.59-3.58L5 12l5 5 8-8zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
            </SvgIcon>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: "success.main",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Dentro da Referência
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {analise.parametrosNormais.map((item, idx) => (
              <Chip
                key={idx}
                label={item}
                size="small"
                variant="outlined"
                color="success"
                sx={{ fontSize: 11, height: 22 }}
              />
            ))}
          </Box>
        </Box>
      )}

      <Divider sx={{ my: 1 }} />
      <Alert
        severity="warning"
        sx={{ py: 0, px: 1.5, "& .MuiAlert-message": { fontSize: 11 } }}
      >
        Análise automatizada de apoio clínico (dados anonimizados). Não
        substitui a avaliação médica do laudo original.
      </Alert>
    </Paper>
  );
}
