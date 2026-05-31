using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using System.Linq;
using System.Collections.Generic;
using Titan_Project.Server.Application.Abstractions;
using Titan_Project.Server.Application.Auth;
using Titan_Project.Server.Infrastructure.Auth;
using Titan_Project.Server.Infrastructure.Catalog;
using Titan_Project.Server.Infrastructure.Images;
using Titan_Project.Server.Infrastructure.Persistence;
using Titan_Project.Server.Infrastructure.Seeding;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;
using Scalar.AspNetCore;
using Titan_Project.Server.Infrastructure.Data;
using System.Text.Json.Serialization;
using Titan_Project.Server.Domain.Model;
using Titan_Project.Server.Contracts.Seeding;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
                    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
                });
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        document.Components ??= new();
        document.Components.SecuritySchemes = new Dictionary<string, IOpenApiSecurityScheme>()
        {
            ["Bearer"] = new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                Description = "JWT Authorization header using the Bearer scheme."
            }
        };

        document.Security = [
            new OpenApiSecurityRequirement{
                {new OpenApiSecuritySchemeReference("Bearer"), new List<string>()}
            }
            ];

        return Task.CompletedTask;
    });
});
// Add service defaults & Aspire client integrations.
builder.AddServiceDefaults();

builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddSingleton<Titan_Project.Server.Infrastructure.Catalog.BeerCatalogProvider>();
builder.Services.AddSingleton<Titan_Project.Server.Infrastructure.Catalog.WineCatalogProvider>();

builder.Services.AddDbContext<AppDBContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured.")));

builder.Services.AddOpenApi();
builder.Services.AddHttpContextAccessor();

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(opts =>
    {
        opts.Cookie.Name = "titan.session";
        opts.Cookie.HttpOnly = true;
        opts.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
            ? CookieSecurePolicy.SameAsRequest
            : CookieSecurePolicy.Always;
        // In development ensure cookie works with local dev server (localhost)
        if (builder.Environment.IsDevelopment())
        {
            opts.Cookie.Domain = "localhost";
            opts.Cookie.SameSite = SameSiteMode.None;
        }
        else
        {
            opts.Cookie.SameSite = SameSiteMode.Lax;
        }
        opts.ExpireTimeSpan = TimeSpan.FromDays(7);
        opts.SlidingExpiration = true;
        opts.Events.OnRedirectToLogin = ctx =>
        {
            ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        opts.Events.OnRedirectToAccessDenied = ctx =>
        {
            ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });
builder.Services.AddAuthorization();
builder.Services.Configure<PasswordHasherOptions>(o => o.IterationCount = 600_000);

builder.Services.AddSingleton<BeerCatalogProvider>();
builder.Services.AddSingleton<WineCatalogProvider>();
builder.Services.AddSingleton<IPasswordHasher, IdentityPasswordHasher>();
builder.Services.AddScoped<IUserRepository, InMemoryUserRepository>();
builder.Services.AddScoped<ICurrentUserContext, HttpContextCurrentUser>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IProductImageStore, DbProductImageStore>();
builder.Services.AddHttpClient<IAlcoholSeedService, OpenFoodFactsAlcoholSeedService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});

    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
        {
            if (builder.Environment.IsDevelopment())
            {
                policy.WithOrigins(
                        "http://localhost:5173",
                        "http://127.0.0.1:5173",
                        "http://localhost:56560",
                        "http://127.0.0.1:56560"
                    )
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            }
            else
            {
                policy.AllowAnyOrigin()
                      .AllowAnyHeader()
                      .AllowAnyMethod();
            }
        });
    });
var app = builder.Build();
app.UseCors();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDBContext>();
    // Apply migrations if any exist; otherwise create schema from model for development
    try
    {
        var applied = dbContext.Database.GetAppliedMigrations();
        var pending = dbContext.Database.GetPendingMigrations();

        if (pending.Any())
        {
            dbContext.Database.Migrate();
        }
        else if (!applied.Any())
        {
            // No migrations applied and no pending migrations.
            // Create schema if the database is empty, but do not delete existing data on startup.
            dbContext.Database.EnsureCreated();
        }
    }
    catch (Exception ex)
    {
        // write full exception details for diagnostics; in production handle appropriately
        Console.WriteLine("Database initialization error: " + ex.ToString());
    }
}

// Seed an in-memory admin user for initial management (only when using InMemoryUserRepository)
using (var scope = app.Services.CreateScope())
{
    var users = scope.ServiceProvider.GetRequiredService<IUserRepository>();
    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
    var exist = await users.ExistsByUsernameAsync("admin", CancellationToken.None);
    if (!exist)
    {
        var admin = new Titan_Project.Server.Domain.Model.User
        {
            Username = "admin",
            Email = "admin@local",
            PasswordHash = hasher.Hash("admin"),
            Role = Titan_Project.Server.Application.Security.Roles.Admin,
        };

        await users.AddAsync(admin, CancellationToken.None);
    }
}

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDBContext>();
    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

    await EnsureAlcoholImageColumnsAsync(db);

    if (app.Environment.IsDevelopment() && !args.Contains("--seed-db"))
    {
        var beerSeeds = new[]
        {
            (Name: "Pilsner Urquell", Description: "Classic Czech pilsner with crisp bitterness.", Abv: 4.4m, Price: 3.99m, Country: "Czech Republic", Ibu: 40m, Srm: 4m, Color: Titan_Project.Server.Domain.Enums.BeerColor.Pale, Style: Titan_Project.Server.Domain.Enums.BeerStyle.Pilsner),
            (Name: "Heineken Original", Description: "Well-known Dutch lager with a clean finish.", Abv: 5.0m, Price: 3.49m, Country: "Netherlands", Ibu: 23m, Srm: 3m, Color: Titan_Project.Server.Domain.Enums.BeerColor.Pale, Style: Titan_Project.Server.Domain.Enums.BeerStyle.Helles),
            (Name: "Stella Artois", Description: "Belgian lager with a balanced malt profile.", Abv: 5.2m, Price: 3.89m, Country: "Belgium", Ibu: 24m, Srm: 4m, Color: Titan_Project.Server.Domain.Enums.BeerColor.Amber, Style: Titan_Project.Server.Domain.Enums.BeerStyle.Pilsner),
            (Name: "Guinness Draught", Description: "Iconic Irish stout with roasted notes.", Abv: 4.2m, Price: 4.49m, Country: "Ireland", Ibu: 45m, Srm: 35m, Color: Titan_Project.Server.Domain.Enums.BeerColor.Dark, Style: Titan_Project.Server.Domain.Enums.BeerStyle.Stout),
            (Name: "Sierra Nevada Pale Ale", Description: "American pale ale with bright hop character.", Abv: 5.6m, Price: 4.29m, Country: "United States", Ibu: 38m, Srm: 6m, Color: Titan_Project.Server.Domain.Enums.BeerColor.Amber, Style: Titan_Project.Server.Domain.Enums.BeerStyle.PaleAle)
        };

        var wineSeeds = new[]
        {
            (Name: "La Marca Prosecco", Description: "Fresh sparkling prosecco with orchard fruit notes.", Abv: 11.0m, Price: 13.99m, Country: "Italy", Color: Titan_Project.Server.Domain.Enums.WineColor.White, Style: Titan_Project.Server.Domain.Enums.WineStyle.Sparkling, Sweetness: Titan_Project.Server.Domain.Enums.WineSweetness.Dry),
            (Name: "Yellow Tail Shiraz", Description: "Easy-drinking Australian shiraz with dark fruit.", Abv: 13.5m, Price: 9.99m, Country: "Australia", Color: Titan_Project.Server.Domain.Enums.WineColor.Red, Style: Titan_Project.Server.Domain.Enums.WineStyle.Still, Sweetness: Titan_Project.Server.Domain.Enums.WineSweetness.SemiDry),
            (Name: "Kim Crawford Sauvignon Blanc", Description: "Vibrant New Zealand white with citrus and herb notes.", Abv: 12.5m, Price: 15.99m, Country: "New Zealand", Color: Titan_Project.Server.Domain.Enums.WineColor.White, Style: Titan_Project.Server.Domain.Enums.WineStyle.Still, Sweetness: Titan_Project.Server.Domain.Enums.WineSweetness.Dry),
            (Name: "Taylor Fladgate 10 Year Tawny Port", Description: "Aged fortified port with caramel and dried fruit.", Abv: 20.0m, Price: 24.99m, Country: "Portugal", Color: Titan_Project.Server.Domain.Enums.WineColor.Red, Style: Titan_Project.Server.Domain.Enums.WineStyle.Fortified, Sweetness: Titan_Project.Server.Domain.Enums.WineSweetness.Sweet),
            (Name: "Chateau Ste. Michelle Riesling", Description: "Aromatic Washington Riesling with bright acidity.", Abv: 12.0m, Price: 12.49m, Country: "United States", Color: Titan_Project.Server.Domain.Enums.WineColor.White, Style: Titan_Project.Server.Domain.Enums.WineStyle.Dessert, Sweetness: Titan_Project.Server.Domain.Enums.WineSweetness.SemiSweet)
        };

        if (!db.Users.Any())
        {
            for (int i = 1; i <= 5; i++)
            {
                db.Users.Add(new Titan_Project.Server.Domain.Model.User
                {
                    Username = $"user{i}",
                    Email = $"user{i}@local",
                    PasswordHash = hasher.Hash("password"),
                    Country = "Local",
                    Role = Titan_Project.Server.Application.Security.Roles.User
                });
            }
        }

        if (!db.AlcoholProducts.Any())
        {
            foreach (var beerSeed in beerSeeds)
            {
                db.BeerProducts.Add(new Titan_Project.Server.Domain.Model.BeerProduct()
                {
                    Name = beerSeed.Name,
                    Description = beerSeed.Description,
                    Abv = beerSeed.Abv,
                    Price = beerSeed.Price,
                    CountryOfOrigin = beerSeed.Country,
                    Ibu = beerSeed.Ibu,
                    Srm = beerSeed.Srm,
                    Color = beerSeed.Color,
                    Style = beerSeed.Style
                });
            }

            foreach (var wineSeed in wineSeeds)
            {
                db.WineProducts.Add(new Titan_Project.Server.Domain.Model.WineProduct()
                {
                    Name = wineSeed.Name,
                    Description = wineSeed.Description,
                    Abv = wineSeed.Abv,
                    Price = wineSeed.Price,
                    CountryOfOrigin = wineSeed.Country,
                    Color = wineSeed.Color,
                    Style = wineSeed.Style,
                    Sweetness = wineSeed.Sweetness
                });
            }
        }

        if (!db.Users.Any() || !db.AlcoholProducts.Any())
        {
            await db.SaveChangesAsync();
        }

        if (!db.Reviews.Any())
        {
            var user = db.Users.FirstOrDefault();
            var products = db.AlcoholProducts.OrderBy(p => p.ProductId).Take(5).ToList();
            if (user != null && products.Any())
            {
                int idx = 1;
                foreach (var p in products)
                {
                    db.Reviews.Add(new Titan_Project.Server.Domain.Model.Review(user.UserId, p.ProductId, (idx % 5) + 1, $"Seed review {idx}"));
                    idx++;
                }

                await db.SaveChangesAsync();
            }
        }
    }
}

// Автоматичне завантаження фоток для товарів без зображень
if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDBContext>();
        var productsWithoutImages = await db.AlcoholProducts
            .Where(p => p.ImageUrl == null && p.ImageLocalPath == null)
            .ToListAsync();

        if (productsWithoutImages.Any())
        {
            Console.WriteLine($"🖼️ Завантаження фоток для {productsWithoutImages.Count} товарів без зображень...");
            
            var seedService = scope.ServiceProvider.GetRequiredService<IAlcoholSeedService>();
            var imageStore = scope.ServiceProvider.GetRequiredService<IProductImageStore>();

            var requestItems = productsWithoutImages.Select(p =>
            {
                var beer = p as BeerProduct;
                var wine = p as WineProduct;
                return new AlcoholSeedItemDto
                {
                    ProductId = p.ProductId,
                    Name = p.Name,
                    CategoryName = p.Category.ToString(),
                    Description = p.Description,
                    Abv = p.Abv,
                    Price = p.Price,
                    CountryOfOrigin = p.CountryOfOrigin,
                    BeerIbu = beer?.Ibu,
                    BeerSrm = beer?.Srm,
                    BeerColor = beer?.Color,
                    BeerStyle = beer?.Style,
                    WineColor = wine?.Color,
                    WineStyle = wine?.Style,
                    WineSweetness = wine?.Sweetness,
                    WineAromas = wine?.Aromas ?? new List<Titan_Project.Server.Domain.Enums.WineAroma>()
                };
            }).ToList();

            var result = await seedService.GenerateAsync(requestItems, "alcohol-seed.json", CancellationToken.None);

            // Оновлюємо продукти в БД з завантаженими фотками
            foreach (var item in result.Items ?? new List<AlcoholSeedExportItemDto>())
            {
                var product = productsWithoutImages.FirstOrDefault(p => p.ProductId == item.ProductId);
                if (product != null)
                {
                    product.ImageUrl = imageStore.GetPublicUrl(item.ProductId);
                    product.ImageSourceUrl = item.SourceImageUrl;
                    product.ImageLocalPath = item.LocalImagePath;
                }
            }

            await db.SaveChangesAsync();
            Console.WriteLine($"✅ Фотки успішно завантажені для {productsWithoutImages.Count} товарів!");
        }
    }
}

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapScalarApiReference();
    app.MapOpenApi();
}

// Development helper: accept X-User-Id header and populate HttpContext.User
if (app.Environment.IsDevelopment())
{
    app.UseMiddleware<Titan_Project.Server.Infrastructure.Auth.DevHeaderAuthMiddleware>();
}

app.UseAuthentication();
app.UseAuthorization();

app.UseFileServer();

app.MapControllers();
app.MapDefaultEndpoints();

// If started with --seed-db argument, perform seeding and exit
if (args.Contains("--seed-db"))
{
    Console.WriteLine("Seeding database as requested (--seed-db)");
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDBContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        try
        {
            // Ensure DB ready
            var pending = db.Database.GetPendingMigrations();
            if (pending.Any()) db.Database.Migrate();
            else db.Database.EnsureCreated();

            // Replace placeholder product data in development seed runs so the existing DB reflects real products.
            if (db.Reviews.Any())
            {
                db.Reviews.RemoveRange(db.Reviews);
                await db.SaveChangesAsync();
            }

            if (db.AlcoholProducts.Any())
            {
                db.AlcoholProducts.RemoveRange(db.AlcoholProducts);
                await db.SaveChangesAsync();
            }

            // Seed users
            if (!db.Users.Any())
            {
                for (int i = 1; i <= 5; i++)
                {
                    db.Users.Add(new Titan_Project.Server.Domain.Model.User
                    {
                        Username = $"user{i}",
                        Email = $"user{i}@local",
                        PasswordHash = hasher.Hash("password"),
                        Country = "Local",
                        Role = Titan_Project.Server.Application.Security.Roles.User
                    });
                }
                await db.SaveChangesAsync();
                Console.WriteLine("Seeded 5 users");
            }

            // Seed products (5 beers, 5 wines)
            if (!db.AlcoholProducts.Any())
            {
                var beerSeeds = new[]
                {
                    (Name: "Pilsner Urquell", Description: "Classic Czech pilsner with crisp bitterness.", Abv: 4.4m, Price: 3.99m, Country: "Czech Republic", Ibu: 40m, Srm: 4m, Color: Titan_Project.Server.Domain.Enums.BeerColor.Pale, Style: Titan_Project.Server.Domain.Enums.BeerStyle.Pilsner),
                    (Name: "Heineken Original", Description: "Well-known Dutch lager with a clean finish.", Abv: 5.0m, Price: 3.49m, Country: "Netherlands", Ibu: 23m, Srm: 3m, Color: Titan_Project.Server.Domain.Enums.BeerColor.Pale, Style: Titan_Project.Server.Domain.Enums.BeerStyle.Helles),
                    (Name: "Stella Artois", Description: "Belgian lager with a balanced malt profile.", Abv: 5.2m, Price: 3.89m, Country: "Belgium", Ibu: 24m, Srm: 4m, Color: Titan_Project.Server.Domain.Enums.BeerColor.Amber, Style: Titan_Project.Server.Domain.Enums.BeerStyle.Pilsner),
                    (Name: "Guinness Draught", Description: "Iconic Irish stout with roasted notes.", Abv: 4.2m, Price: 4.49m, Country: "Ireland", Ibu: 45m, Srm: 35m, Color: Titan_Project.Server.Domain.Enums.BeerColor.Dark, Style: Titan_Project.Server.Domain.Enums.BeerStyle.Stout),
                    (Name: "Sierra Nevada Pale Ale", Description: "American pale ale with bright hop character.", Abv: 5.6m, Price: 4.29m, Country: "United States", Ibu: 38m, Srm: 6m, Color: Titan_Project.Server.Domain.Enums.BeerColor.Amber, Style: Titan_Project.Server.Domain.Enums.BeerStyle.PaleAle)
                };

                var wineSeeds = new[]
                {
                    (Name: "La Marca Prosecco", Description: "Fresh sparkling prosecco with orchard fruit notes.", Abv: 11.0m, Price: 13.99m, Country: "Italy", Color: Titan_Project.Server.Domain.Enums.WineColor.White, Style: Titan_Project.Server.Domain.Enums.WineStyle.Sparkling, Sweetness: Titan_Project.Server.Domain.Enums.WineSweetness.Dry),
                    (Name: "Yellow Tail Shiraz", Description: "Easy-drinking Australian shiraz with dark fruit.", Abv: 13.5m, Price: 9.99m, Country: "Australia", Color: Titan_Project.Server.Domain.Enums.WineColor.Red, Style: Titan_Project.Server.Domain.Enums.WineStyle.Still, Sweetness: Titan_Project.Server.Domain.Enums.WineSweetness.SemiDry),
                    (Name: "Kim Crawford Sauvignon Blanc", Description: "Vibrant New Zealand white with citrus and herb notes.", Abv: 12.5m, Price: 15.99m, Country: "New Zealand", Color: Titan_Project.Server.Domain.Enums.WineColor.White, Style: Titan_Project.Server.Domain.Enums.WineStyle.Still, Sweetness: Titan_Project.Server.Domain.Enums.WineSweetness.Dry),
                    (Name: "Taylor Fladgate 10 Year Tawny Port", Description: "Aged fortified port with caramel and dried fruit.", Abv: 20.0m, Price: 24.99m, Country: "Portugal", Color: Titan_Project.Server.Domain.Enums.WineColor.Red, Style: Titan_Project.Server.Domain.Enums.WineStyle.Fortified, Sweetness: Titan_Project.Server.Domain.Enums.WineSweetness.Sweet),
                    (Name: "Chateau Ste. Michelle Riesling", Description: "Aromatic Washington Riesling with bright acidity.", Abv: 12.0m, Price: 12.49m, Country: "United States", Color: Titan_Project.Server.Domain.Enums.WineColor.White, Style: Titan_Project.Server.Domain.Enums.WineStyle.Dessert, Sweetness: Titan_Project.Server.Domain.Enums.WineSweetness.SemiSweet)
                };

                foreach (var beerSeed in beerSeeds)
                {
                    var beer = new Titan_Project.Server.Domain.Model.BeerProduct()
                    {
                        Name = beerSeed.Name,
                        Description = beerSeed.Description,
                        Abv = beerSeed.Abv,
                        Price = beerSeed.Price,
                        CountryOfOrigin = beerSeed.Country,
                        Ibu = beerSeed.Ibu,
                        Srm = beerSeed.Srm,
                        Color = beerSeed.Color,
                        Style = beerSeed.Style
                    };
                    db.BeerProducts.Add(beer);
                }

                foreach (var wineSeed in wineSeeds)
                {
                    var wineProduct = new Titan_Project.Server.Domain.Model.WineProduct()
                    {
                        Name = wineSeed.Name,
                        Description = wineSeed.Description,
                        Abv = wineSeed.Abv,
                        Price = wineSeed.Price,
                        CountryOfOrigin = wineSeed.Country,
                        Color = wineSeed.Color,
                        Style = wineSeed.Style,
                        Sweetness = wineSeed.Sweetness
                    };
                    db.WineProducts.Add(wineProduct);
                }

                await db.SaveChangesAsync();
                Console.WriteLine("Seeded 5 beers and 5 wines");
            }

            // Seed reviews - attach to first 5 products
            if (!db.Reviews.Any())
            {
                var user = db.Users.FirstOrDefault();
                var products = db.AlcoholProducts.Take(5).ToList();
                if (user != null && products.Any())
                {
                    int idx = 1;
                    foreach (var p in products)
                    {
                        db.Reviews.Add(new Titan_Project.Server.Domain.Model.Review(user.UserId, p.ProductId, (idx % 5) + 1, $"Seed review {idx}"));
                        idx++;
                    }
                    await db.SaveChangesAsync();
                    Console.WriteLine("Seeded reviews");
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error during seeding: " + ex.Message);
        }
    }

    Console.WriteLine("Seeding finished, exiting.");
    return;
}

static async Task EnsureAlcoholImageColumnsAsync(AppDBContext db)
{
    var sql = """
        ALTER TABLE IF EXISTS "AlcoholProducts"
            ADD COLUMN IF NOT EXISTS "ImageUrl" text,
            ADD COLUMN IF NOT EXISTS "ImageSourceUrl" text,
            ADD COLUMN IF NOT EXISTS "ImageLocalPath" text;
        """;

    await db.Database.ExecuteSqlRawAsync(sql);
}

app.Run();
