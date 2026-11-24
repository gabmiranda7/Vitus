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
            Você receberá o TEXTO extraído de um ou mais laudos de exames de um paciente.
            Os dados pessoais já foram removidos e substituídos por [OMITIDO].

            REGRAS DE PRIVACIDADE (LGPD):
            - Nunca tente reconstruir, inferir ou mencionar dados que foram omitidos.
            - Ignore nomes de pacientes, nomes de médicos, CPFs, Cartão SUS, endereços, telefones ou números de protocolo que ainda apareçam no texto.
            - Nunca inclua nenhum dado pessoal identificável na sua resposta.

            REGRAS CLÍNICAS:
            - Extraia todos os parâmetros laboratoriais ou achados relevantes.
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
            IReadOnlyList<DocumentoExameIaInput> documentos,
            string contextoClinicoAnonimo,
            CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(_settings.ApiKey))
                throw new DomainException("Chave da API de IA (Gemini__ApiKey) não configurada no servidor.");

            var parts = new List<object>
            {
                new
                {
                    text = $"Contexto clínico anônimo do paciente:\n{contextoClinicoAnonimo}\n\nAnalise o(s) {documentos.Count} documento(s) abaixo e retorne estritamente no schema JSON configurado."
                }
            };

            for (var i = 0; i < documentos.Count; i++)
            {
                parts.Add(new
                {
                    text = $"=== Documento {i + 1} ===\n{documentos[i].Texto}"
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

            var modelos = new[] { _settings.Model, _settings.FallbackModel }
                .Where(m => !string.IsNullOrWhiteSpace(m))
                .Distinct()
                .ToArray();

            string body = string.Empty;
            int ultimoStatus = 0;

            foreach (var modelo in modelos)
            {
                var url = $"{_settings.BaseUrl.TrimEnd('/')}/models/{modelo}:generateContent";
                const int maxTentativas = 2;

                for (int tentativa = 1; tentativa <= maxTentativas; tentativa++)
                {
                    using var requisicao = new HttpRequestMessage(HttpMethod.Post, url)
                    {
                        Content = JsonContent.Create(payload)
                    };

                    requisicao.Headers.Add("x-goog-api-key", _settings.ApiKey);

                    using var response = await _httpClient.SendAsync(requisicao, ct);
                    body = await response.Content.ReadAsStringAsync(ct);

                    if (response.IsSuccessStatusCode)
                        goto Sucesso;

                    ultimoStatus = (int)response.StatusCode;
                    Console.WriteLine($"[GeminiErro] Modelo {modelo} | Tentativa {tentativa} | HTTP {ultimoStatus}: {body}");

                    // Se bateu limite de cota (429) ou modelo não encontrado (404), pula direto para o FallbackModel
                    if (ultimoStatus == (int)HttpStatusCode.TooManyRequests ||
                        ultimoStatus == (int)HttpStatusCode.NotFound)
                        break;

                    // Se for sobrecarga temporária (503), aguarda e tenta novamente no mesmo modelo antes de trocar
                    if (ultimoStatus == (int)HttpStatusCode.ServiceUnavailable && tentativa < maxTentativas)
                    {
                        await Task.Delay(TimeSpan.FromSeconds(tentativa * 2), ct);
                        continue;
                    }

                    break;
                }
            }

            if (ultimoStatus == (int)HttpStatusCode.TooManyRequests)
                throw new DomainException("Limite temporário de requisições da IA atingido. Aguarde 1 minuto e tente novamente.");

            throw new DomainException($"Falha ao processar exame com IA (HTTP {ultimoStatus}). Tente novamente em instantes.");

        Sucesso:
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