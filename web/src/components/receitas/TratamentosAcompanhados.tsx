import {
  Box,
  Card,
  CardContent,
  Chip,
  Paper,
  Typography,
  alpha,
} from "@mui/material";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import { Tratamento } from "../../types";
import { dataVencimentoBr, situacaoVencimento } from "./vencimento";

interface TratamentosAcompanhadosProps {
  tratamentos: Tratamento[];
  recolhivel?: boolean;
}

export default function TratamentosAcompanhados({
  tratamentos,
}: TratamentosAcompanhadosProps) {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
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
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {tratamentos.map((t, i) => {
              const s = situacaoVencimento(t.diasRestantes);
              return (
                <Paper
                  key={`${t.receitaId}-${t.medicamento}-${i}`}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    borderLeft: `4px solid ${s.cor}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {t.medicamento}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Emitida em{" "}
                      {new Date(t.dataEmissao).toLocaleDateString("pt-BR")} ·
                      validade de {t.validadeDias} dias · vence em{" "}
                      {dataVencimentoBr(t.dataVencimento)}
                    </Typography>
                  </Box>
                  <Chip
                    label={s.label.charAt(0).toUpperCase() + s.label.slice(1)}
                    size="small"
                    sx={{
                      bgcolor: alpha(s.cor, 0.12),
                      color: s.cor,
                      fontWeight: 700,
                    }}
                  />
                </Paper>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
