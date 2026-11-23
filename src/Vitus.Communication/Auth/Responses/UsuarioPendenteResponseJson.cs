namespace Vitus.Communication.Auth.Responses
{
    public class UsuarioPendenteResponseJson
    {
        public Guid Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Perfil { get; set; } = string.Empty;
        public string? Crm { get; set; }
        public string? Especialidade { get; set; }
        public string? Coren { get; set; }
        public string? Especializacao { get; set; }
    }
}