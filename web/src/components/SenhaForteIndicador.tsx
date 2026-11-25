import { Box, LinearProgress, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { avaliarSenha } from "../utils/senha";

export default function SenhaForteIndicador({ senha }: { senha: string }) {
  if (!senha) return null;

  const requisitos = avaliarSenha(senha);
  const atendidos = requisitos.filter((r) => r.ok).length;
  const progresso = (atendidos / requisitos.length) * 100;
  const cor =
    atendidos <= 2
      ? "error"
      : atendidos < requisitos.length
        ? "warning"
        : "success";
  const texto =
    atendidos <= 2
      ? "Fraca"
      : atendidos < requisitos.length
        ? "Média"
        : "Forte";

  return (
    <Box sx={{ mt: -0.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
        <LinearProgress
          variant="determinate"
          value={progresso}
          color={cor}
          sx={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            "& .MuiLinearProgress-bar": {
              transition: "transform 0.4s ease",
            },
          }}
        />
        <Typography
          variant="caption"
          color={`${cor}.main`}
          sx={{ fontWeight: 600, minWidth: 40 }}
        >
          {texto}
        </Typography>
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 0.25,
        }}
      >
        {requisitos.map((r) => (
          <Box
            key={r.label}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              color: r.ok ? "success.main" : "text.secondary",
              transition: "color 0.2s ease",
            }}
          >
            {r.ok ? (
              <CheckCircleIcon sx={{ fontSize: 14 }} />
            ) : (
              <RadioButtonUncheckedIcon sx={{ fontSize: 14 }} />
            )}
            <Typography variant="caption">{r.label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
