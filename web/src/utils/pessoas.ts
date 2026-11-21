export function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

const CORES_AVATAR = ['#1976d2', '#388e3c', '#7b1fa2', '#c62828', '#f57c00', '#0097a7', '#5d4037'];

export function corAvatar(nome: string) {
  return CORES_AVATAR[nome.charCodeAt(0) % CORES_AVATAR.length];
}

export function calcularIdade(dataNascimento?: string | null): number | null {
  if (!dataNascimento) return null;
  const nasc = new Date(dataNascimento.includes('T') ? dataNascimento : `${dataNascimento}T00:00:00`);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

export function idadeLabel(dataNascimento?: string | null): string {
  const idade = calcularIdade(dataNascimento);
  return idade !== null ? `${idade} anos` : '';
}