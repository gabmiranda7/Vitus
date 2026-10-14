using FluentValidation;
using System.Net;
using System.Text.Json;
using Vitus.Communication.Errors;
using Vitus.Domain.Exceptions;

namespace Vitus.API.Middlewares
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;

        public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (ValidationException ex)
            {
                var errors = ex.Errors.Select(e => e.ErrorMessage).ToList();
                await HandleExceptionAsync(context, HttpStatusCode.BadRequest, errors);
            }
            catch (DomainException ex)
            {
                await HandleExceptionAsync(context, HttpStatusCode.BadRequest, new List<string> { ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro não tratado em {Metodo} {Caminho}", context.Request.Method, context.Request.Path);
                await HandleExceptionAsync(context, HttpStatusCode.InternalServerError, new List<string> { "Ocorreu um erro inesperado" });
            }
        }

        private static async Task HandleExceptionAsync(HttpContext context, HttpStatusCode statusCode, List<string> messages)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)statusCode;

            var response = new ErrorResponseJson(messages);
            var json = JsonSerializer.Serialize(response);

            await context.Response.WriteAsync(json);
        }
    }
}