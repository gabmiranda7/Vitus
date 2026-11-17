using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Options;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;
using Vitus.Infrastructure.Configurations;

namespace Vitus.Infrastructure.Services
{
    public class GeminiAnalisadorExameService : IAnalisadorExameIaService
    {
        private readonly HttpClient _httpClient;
        private readonly GeminiSettings _settings;

        private const string SystemInstruction = """
            Você é um assistente clínico de apoio ao diagnóstico médico no sistema Vitus.
            Analise todas as imagens e/ou documentos PDF fornecidos referentes ao exame do paciente.
            
            REGRAS ESTRITAS DE PRIVACIDADE (LGPD):
            - Ignore completamente nomes de pacientes, nomes de médicos, CPFs, Cartão SUS, endereços, telefones ou números de protocolo visíveis nos documentos.
            - Nunca inclua nenhum dado pessoal identificável na sua resposta.
            
            REGRAS CLÍNICAS:
            - Extraia todos os parâmetros laboratoriais ou achados de imagem relevantes.
            - Compare os valores encontrados com os valores de referência exibidos no próprio laudo (ou referência padrão para idade/sexo quando aplicável).
            - Correlacione os achados com o contexto clínico anônimo fornecido (idade, sexo, comorbidades/alergias).
            - Seja objetivo, técnico e claro para leitura rápida durante uma consulta médica.
            - Não emita diagnóstico definitivo; apresente achados e pontos de atenção clínica.
            """;

        public GeminiAnalisadorExameService(
            HttpClient httpClient,
            IOptions<GeminiSettings> settings)
        {
            _httpClient = httpClient;
            _settings = settings.Value;
        }

        public async Task<string> AnalisarExamesAsync(
            IReadOnlyList<ArquivoExameIaInput> arquivos,
            string contextoClinicoAnonimo,
            CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(_settings.ApiKey))
                throw new DomainException("Chave da API de IA (Gemini__ApiKey) não configurada no servidor.");

            var parts = new List<object>
            {
                new
                {
                    text = $"Contexto clínico anônimo do paciente:\n{contextoClinicoAnonimo}\n\nAnalise os {arquivos.Count} arquivo(s) anexado(s) e retorne estritamente no schema JSON configurado."
                }
            };

            foreach (var arq in arquivos.Take(15))
            {
                parts.Add(new
                {
                    inline_data = new
                    {
                        mime_type = arq.ContentType,
                        data = Convert.ToBase64String(arq.Bytes)
                    }
                });
            }

            var payload = new
            {
                system_instruction = new
                {
                    parts = new[] { new { text = SystemInstruction } }
                },
                contents = new[]
                {
                    new { role = "user", parts }
                },
                generationConfig = new
                {
                    temperature = 0.2,
                    response_mime_type = "application/json",
                    response_schema = new
                    {
                        type = "OBJECT",
                        properties = new
                        {
                            resumoGeral = new { type = "STRING", description = "Síntese clínica objetiva dos achados do exame." },
                            parametrosAlterados = new
                            {
                                type = "ARRAY",
                                items = new
                                {
                                    type = "OBJECT",
                                    properties = new
                                    {
                                        nome = new { type = "STRING" },
                                        valorEncontrado = new { type = "STRING" },
                                        valorReferencia = new { type = "STRING" },
                                        status = new { type = "STRING", description = "Alto, Baixo ou Alterado" },
                                        observacaoClinica = new { type = "STRING" }
                                    },
                                    required = new[] { "nome", "valorEncontrado", "valorReferencia", "status", "observacaoClinica" }
                                }
                            },
                            parametrosNormais = new
                            {
                                type = "ARRAY",
                                items = new { type = "STRING" },
                                description = "Lista resumida dos principais parâmetros dentro da faixa normal."
                            },
                            pontosDeAtencao = new
                            {
                                type = "ARRAY",
                                items = new { type = "STRING" },
                                description = "Correlações clínicas, alertas de alergias/comorbidades e sugestões de investigação."
                            }
                        },
                        required = new[] { "resumoGeral", "parametrosAlterados", "parametrosNormais", "pontosDeAtencao" }
                    }
                }
            };

            var url = $"{_settings.BaseUrl.TrimEnd('/')}/models/{_settings.Model}:generateContent?key={_settings.ApiKey}";

            const int maxTentativas = 3;
            string body = string.Empty;

            for (int tentativa = 1; tentativa <= maxTentativas; tentativa++)
            {
                using var response = await _httpClient.PostAsJsonAsync(url, payload, ct);
                body = await response.Content.ReadAsStringAsync(ct);

                if (response.IsSuccessStatusCode)
                    break;

                var statusCode = (int)response.StatusCode;
                Console.WriteLine($"[GeminiErro] HTTP {statusCode}: {body}");

                if (statusCode == (int)HttpStatusCode.TooManyRequests)
                    throw new DomainException("Limite temporário de requisições da IA atingido. Aguarde 1 minuto e tente novamente.");

                if (statusCode != (int)HttpStatusCode.ServiceUnavailable || tentativa == maxTentativas)
                    throw new DomainException($"Falha ao processar exame com IA (HTTP {statusCode}). Tente novamente em instantes.");

                await Task.Delay(TimeSpan.FromSeconds(tentativa * 2), ct);
            }

            using var doc = JsonDocument.Parse(body);
            var textoJson = doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            if (string.IsNullOrWhiteSpace(textoJson))
                throw new DomainException("A IA retornou uma resposta vazia para este exame.");

            return textoJson;
        }
    }
}