namespace Vitus.Domain.Exceptions
{
    public class AcessoNegadoException : DomainException
    {
        public AcessoNegadoException(string message) : base(message)
        {
        }
    }
}