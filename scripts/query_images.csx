#r "nuget: Npgsql, 7.0.0"
#r "nuget: Dapper, 2.0.123"
using System;
using System.Data;
using Npgsql;
using Dapper;

var connStr = "Host=localhost;Port=5432;Database=titan_db;Username=postgres;Password=admin";
using var conn = new NpgsqlConnection(connStr);
var rows = conn.Query("SELECT \"ProductId\", \"Name\", \"ImageUrl\", \"ImageSourceUrl\", \"ImageLocalPath\" FROM \"AlcoholProducts\" ORDER BY \"ProductId\" LIMIT 20;");
foreach(var r in rows)
{
    Console.WriteLine($"{r.ProductId}\t{r.Name}\t{r.ImageUrl}\t{r.ImageSourceUrl}\t{r.ImageLocalPath}");
}
