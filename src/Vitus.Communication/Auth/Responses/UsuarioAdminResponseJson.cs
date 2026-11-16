namespace Vitus.Communication.Auth.Responses
{
    public class UsuarioAdminResponseJson
    {
        public Guid Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Perfil { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }
}