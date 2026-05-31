EF Core Initial Migration (InitialCreate)

It's safer to generate provider-specific EF Core migrations locally using your environment's `dotnet-ef` tool so the migration contains accurate provider metadata.

Steps:

1. Ensure `dotnet-ef` is available:
   - `dotnet tool install --global dotnet-ef` (if not already installed)

2. From the solution root, run:

   dotnet ef migrations add InitialCreate --project TitanClassLibrary --startup-project Titan_Project.Server --context AppDBContext -o Migrations

   This will create the `TitanClassLibrary/Migrations/InitialCreate` migration files.

3. Review the generated migration and model snapshot, then commit the `TitanClassLibrary/Migrations` folder to the repository.

4. To apply the migration to the configured database:

   dotnet ef database update --project TitanClassLibrary --startup-project Titan_Project.Server --context AppDBContext

Notes:
- The script `scripts/create_initial_migration.ps1` automates the above steps.
- Do NOT run the migration against production databases unless you know what you are doing.