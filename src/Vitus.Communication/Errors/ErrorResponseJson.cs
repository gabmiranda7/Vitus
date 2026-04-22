namespace Vitus.Communication.Errors
{
    public class ErrorResponseJson
    {
        public string Message { get; set; }

        public ErrorResponseJson(string message)
        {
            Message = message;
        }
    }
}