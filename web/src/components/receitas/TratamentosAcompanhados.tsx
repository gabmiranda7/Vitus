import { Box, Card, CardContent, Chip, Paper, Typography, alpha } from '@mui/material';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import { Tratamento } from '../../types';
import { dataVencimentoBr, situacaoVencimento } from './vencimento';

export default function TratamentosAcompanhados({ tratamentos }: { tratamentos: Tratamento[] }) {
  if (tratamentos.length === 0) return null;

  return (
    <Card sx={{ borderRadius: 3, mb: 3 }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <EventRepeatIcon color="primary" fontSize="small" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Tratamentos acompanhados</Typography>
          <Chip label={tratamentos.length} size="small" color="primary" />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {tratamentos.map((t) => {
            const s = situacaoVencimento(t.diasRestantes);
            return (
              <Paper key={`${t.receitaId}-${t.medicamento}`} variant="outlined" sx={{
                p: 2, borderRadius: 2, borderLeft: `4px solid ${s.cor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1,
              }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{t.medicamento}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Emitida em {new Date(t.dataEmissao).toLocaleDateString('pt-BR')} · validade de {t.validadeDias} dias · vence em {dataVencimentoBr(t.dataVencimento)}
                  </Typography>
                </Box>
                <Chip
                  label={s.label.charAt(0).toUpperCase() + s.label.slice(1)}
                  size="small"
                  sx={{ bgcolor: alpha(s.cor, 0.12), color: s.cor, fontWeight: 700 }}
                />
              </Paper>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}