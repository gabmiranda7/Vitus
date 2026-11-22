import { Paciente } from "../types";

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function pacienteCombinaComBusca(
  paciente: Pick<Paciente, "nome" | "cpf">,
  busca: string,
): boolean {
  const termo = busca.trim();
  if (!termo) return true;

  if (normalizar(paciente.nome).includes(normalizar(termo))) return true;

  const digitosBusca = termo.replace(/\D/g, "");
  if (digitosBusca.length < 3) return false;

  const digitosCpf = (paciente.cpf ?? "").replace(/\D/g, "");
  return digitosCpf.includes(digitosBusca);
}
