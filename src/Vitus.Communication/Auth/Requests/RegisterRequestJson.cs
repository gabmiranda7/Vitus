namespace Vitus.Communication.Auth.Requests
{
    public class RegisterRequestJson
    {
        public string Nome { get; set; }
        public string Email { get; set; }
        public string Senha { get; set; }
        public string Perfil { get; set; }
        public string? CRM { get; set; }
        public string? Especialidade { get; set; }
    }
}