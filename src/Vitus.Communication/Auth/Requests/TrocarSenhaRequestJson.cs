namespace Vitus.Communication.Auth.Requests
{
    public class TrocarSenhaRequestJson
    {
        public string SenhaAtual { get; set; } = string.Empty;
        public string NovaSenha { get; set; } = string.Empty;
    }
}