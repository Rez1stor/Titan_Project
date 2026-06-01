# Docker

## Wymagania

- Docker Desktop (lub Docker Engine + Compose v2)

## Uruchomienie

```bash
cd Titan_Project
docker compose up --build -d
```

Aplikacja: http://localhost:8080  
API (przez proxy): http://localhost:8080/api/products  
Health: http://localhost:8080/health  
OpenAPI: http://localhost:8080/openapi/v1.json  

## Zatrzymanie

```bash
docker compose down
```

Usunięcie wolumenu bazy:

```bash
docker compose down -v
```

## Serwisy

| Serwis | Opis |
|--------|------|
| `db` | PostgreSQL 16 |
| `api` | ASP.NET Core Web API (port wewnętrzny 8080) |
| `web` | React (build) + nginx — port **8080** na hoście |

## Seed danych (opcjonalnie)

```bash
docker compose run --rm api dotnet Titan_Project.Server.dll --seed-db
```
