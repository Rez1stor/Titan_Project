FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY TitanClassLibrary/TitanClassLibrary.csproj TitanClassLibrary/
COPY Titan_Project.Server/Titan_Project.Server.csproj Titan_Project.Server/
RUN dotnet restore Titan_Project.Server/Titan_Project.Server.csproj

COPY TitanClassLibrary/ TitanClassLibrary/
COPY Titan_Project.Server/ Titan_Project.Server/
RUN dotnet publish Titan_Project.Server/Titan_Project.Server.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=build /app/publish .

HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=40s \
    CMD curl -fsS http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "Titan_Project.Server.dll"]
