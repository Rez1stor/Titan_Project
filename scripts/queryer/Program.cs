using System;
using Dapper;
using Npgsql;

var connStr = "Host=localhost;Port=5432;Database=titan_db;Username=postgres;Password=admin";
using var conn = new NpgsqlConnection(connStr);
var rows = conn.Query("SELECT \"ProductId\", \"Name\", \"ImageUrl\", \"ImageSourceUrl\", \"ImageLocalPath\" FROM \"AlcoholProducts\" ORDER BY \"ProductId\" LIMIT 20;");
foreach(var r in rows)
{
    Console.WriteLine($"{r.ProductId}\t{r.Name}\t{r.ImageUrl}\t{r.ImageSourceUrl}\t{r.ImageLocalPath}");
}
