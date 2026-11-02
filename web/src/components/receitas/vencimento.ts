export function situacaoVencimento(dias: number) {
  if (dias < 0) return { label: `vencida há ${-dias} dia${-dias === 1 ? '' : 's'}`, cor: '#c62828' };
  if (dias === 0) return { label: 'vence hoje', cor: '#c62828' };
  if (dias <= 30) return { label: `vence em ${dias} dia${dias === 1 ? '' : 's'}`, cor: '#e65100' };
  return { label: `vence em ${dias} dias`, cor: '#2e7d32' };
}

export function dataVencimentoBr(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR');
}