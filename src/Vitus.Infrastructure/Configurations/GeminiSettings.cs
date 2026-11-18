namespace Vitus.Infrastructure.Configurations
{
    public class GeminiSettings
    {
        public const string SectionName = "Gemini";

        public string ApiKey { get; set; } = string.Empty;
        public string Model { get; set; } = "gemini-3.5-flash-lite";
        public string FallbackModel { get; set; } = "gemini-3.1-flash-lite";
        public string BaseUrl { get; set; } = "https://generativelanguage.googleapis.com/v1beta";
    }
}