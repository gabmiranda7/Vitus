namespace Vitus.Communication.Errors
{
    public class ErrorResponseJson
    {
        public List<string> Messages { get; set; }

        public ErrorResponseJson(List<string> messages)
        {
            Messages = messages;
        }

        public ErrorResponseJson(string message)
        {
            Messages = new List<string> { message };
        }
    }
}