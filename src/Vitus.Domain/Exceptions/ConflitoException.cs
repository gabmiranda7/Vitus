namespace Vitus.Domain.Exceptions
{
    public class ConflitoException : DomainException
    {
        public ConflitoException(string message) : base(message)
        {
        }
    }
}