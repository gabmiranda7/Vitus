FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080
 
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["src/Vitus.API/Vitus.API.csproj", "src/Vitus.API/"]
COPY ["src/Vitus.Application/Vitus.Application.csproj", "src/Vitus.Application/"]
COPY ["src/Vitus.Communication/Vitus.Communication.csproj", "src/Vitus.Communication/"]
COPY ["src/Vitus.Domain/Vitus.Domain.csproj", "src/Vitus.Domain/"]
COPY ["src/Vitus.Infrastructure/Vitus.Infrastructure.csproj", "src/Vitus.Infrastructure/"]
RUN dotnet restore "./src/Vitus.API/Vitus.API.csproj"
COPY . .
WORKDIR "/src/src/Vitus.API"
RUN dotnet build "./Vitus.API.csproj" -c $BUILD_CONFIGURATION -o /app/build
 
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Vitus.API.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false
 
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
RUN mkdir -p /app/storage/exames /app/storage/templates
ENTRYPOINT ["dotnet", "Vitus.API.dll"]