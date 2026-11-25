export interface RequisitoSenha {
  label: string;
  ok: boolean;
}

export function avaliarSenha(senha: string): RequisitoSenha[] {
  return [
    { label: "Mínimo de 8 caracteres", ok: senha.length >= 8 },
    { label: "Letra maiúscula", ok: /[A-Z]/.test(senha) },
    { label: "Letra minúscula", ok: /[a-z]/.test(senha) },
    { label: "Número", ok: /[0-9]/.test(senha) },
    { label: "Símbolo (ex: ! @ # $ %)", ok: /[^a-zA-Z0-9]/.test(senha) },
  ];
}

export function senhaEhForte(senha: string): boolean {
  return senha.length <= 100 && avaliarSenha(senha).every((r) => r.ok);
}
