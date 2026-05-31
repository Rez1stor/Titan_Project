#!/usr/bin/env pwsh
Write-Host "Creating EF Core InitialCreate migration (TitanClassLibrary -> AppDBContext)"

# Ensure dotnet-ef is installed
if (-not (Get-Command dotnet-ef -ErrorAction SilentlyContinue)) {
    Write-Host "dotnet-ef not found. Installing as a local tool is recommended. Attempting global install..."
    dotnet tool install --global dotnet-ef || Write-Host "Install failed; please install dotnet-ef manually: dotnet tool install --global dotnet-ef"
}

Write-Host "Running: dotnet ef migrations add InitialCreate --project TitanClassLibrary --startup-project Titan_Project.Server --context AppDBContext -o Migrations"
dotnet ef migrations add InitialCreate --project TitanClassLibrary --startup-project Titan_Project.Server --context AppDBContext -o Migrations

Write-Host "If successful, review and commit the generated 'TitanClassLibrary/Migrations' folder. To apply to database run:"
Write-Host "  dotnet ef database update --project TitanClassLibrary --startup-project Titan_Project.Server --context AppDBContext"