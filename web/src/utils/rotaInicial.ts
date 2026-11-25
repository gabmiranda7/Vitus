export function rotaInicial(perfil?: string): string {
  switch (perfil) {
    case "Medico":
    case "Enfermeiro":
    case "Recepcionista":
    case "Administrador":
      return "/dashboard";
    default:
      return "/login";
  }
}
