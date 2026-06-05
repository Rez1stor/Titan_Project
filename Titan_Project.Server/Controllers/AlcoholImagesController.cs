using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Titan_Project.Server.Contracts.Seeding;
using Titan_Project.Server.Domain.Model;
using Titan_Project.Server.Infrastructure.Data;
using Titan_Project.Server.Infrastructure.Images;
using Titan_Project.Server.Infrastructure.Seeding;

namespace Titan_Project.Server.Controllers;

[ApiController]
[Route("api/dev/alcohol-images")]
[AllowAnonymous]
public sealed class AlcoholImagesController : ControllerBase
{
    private readonly AppDBContext db;
    private readonly IAlcoholSeedService seedService;
    private readonly IProductImageStore imageStore;
    private readonly IWebHostEnvironment environment;

    public AlcoholImagesController(AppDBContext db, IAlcoholSeedService seedService, IProductImageStore imageStore, IWebHostEnvironment environment)
    {
        this.db = db ?? throw new ArgumentNullException(nameof(db));
        this.seedService = seedService ?? throw new ArgumentNullException(nameof(seedService));
        this.imageStore = imageStore ?? throw new ArgumentNullException(nameof(imageStore));
        this.environment = environment ?? throw new ArgumentNullException(nameof(environment));
    }

    [HttpPost("backfill")]
    public async Task<ActionResult<AlcoholSeedResultDto>> BackfillExisting(CancellationToken cancellationToken)
    {
        var products = await db.AlcoholProducts.ToListAsync(cancellationToken);
        if (products.Count == 0)
        {
            return Ok(new AlcoholSeedResultDto { GeneratedAtUtc = DateTime.UtcNow, OutputFilePath = string.Empty, ImageDirectory = string.Empty });
        }

        var requestItems = products.Select(MapProduct).ToList();
        var result = await seedService.GenerateAsync(requestItems, "alcohol-seed.json", cancellationToken);

        // Update products in the database with downloaded photos
        foreach (var item in result.Items ?? new List<AlcoholSeedExportItemDto>())
        {
            var product = products.FirstOrDefault(p => p.ProductId == item.ProductId);
            if (product != null)
            {
                product.ImageUrl = imageStore.GetPublicUrl(item.ProductId);
                product.ImageSourceUrl = item.SourceImageUrl;
                product.ImageLocalPath = item.LocalImagePath;
            }
        }

        await db.SaveChangesAsync(cancellationToken);

        return Ok(result);
    }

    [HttpPost("upload/{productId:int}")]
    [RequestSizeLimit(52_428_800)]
    public async Task<ActionResult<object>> UploadImage(int productId, [FromForm] IFormFile file, [FromForm] string productName, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("Image file is required.");
        }

        var extension = ResolveImageExtension(file.FileName, file.ContentType);
        if (extension == null)
        {
            return BadRequest("Unsupported image format. Please upload JPG, JPEG, PNG, WEBP, GIF, or BMP.");
        }

        var webRoot = environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot");
        var imageDirectory = Path.Combine(webRoot, "product-images");
        Directory.CreateDirectory(imageDirectory);

        var product = await db.AlcoholProducts.FirstOrDefaultAsync(p => p.ProductId == productId, cancellationToken);
        var effectiveName = productName ?? product?.Name ?? $"product-{productId}";
        var safeName = string.Join('-', (effectiveName).Split(Path.GetInvalidFileNameChars(), StringSplitOptions.RemoveEmptyEntries));
        var fileName = $"{safeName}-{productId}{extension}";
        var localPath = Path.Combine(imageDirectory, fileName);

        await using (var stream = System.IO.File.Create(localPath))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        await imageStore.UpsertAsync(productId, effectiveName, null, localPath, cancellationToken);

        return Ok(new
        {
            productId,
            productName,
            localPath,
            imageUrl = $"/product-images/{fileName}"
        });
    }

    private static string? ResolveImageExtension(string? fileName, string? contentType)
    {
        var extension = Path.GetExtension(fileName ?? string.Empty).ToLowerInvariant();
        if (IsSupportedImageExtension(extension))
        {
            return extension;
        }

        return contentType?.ToLowerInvariant() switch
        {
            "image/jpeg" => ".jpg",
            "image/jpg" => ".jpg",
            "image/png" => ".png",
            "image/webp" => ".webp",
            "image/gif" => ".gif",
            "image/bmp" => ".bmp",
            _ => null
        };
    }

    private static bool IsSupportedImageExtension(string extension)
    {
        return extension is ".jpg" or ".jpeg" or ".png" or ".webp" or ".gif" or ".bmp";
    }

    private static AlcoholSeedItemDto MapProduct(AlcoholProduct product)
    {
        var beer = product as BeerProduct;
        var wine = product as WineProduct;

        return new AlcoholSeedItemDto
        {
            ProductId = product.ProductId,
            Name = product.Name,
            CategoryName = product.Category.ToString(),
            Description = product.Description,
            Abv = product.Abv,
            Price = product.Price,
            CountryOfOrigin = product.CountryOfOrigin,
            BeerIbu = beer?.Ibu,
            BeerSrm = beer?.Srm,
            BeerColor = beer?.Color,
            BeerStyle = beer?.Style,
            WineColor = wine?.Color,
            WineStyle = wine?.Style,
            WineSweetness = wine?.Sweetness,
            WineAromas = wine?.Aromas ?? new List<Titan_Project.Server.Domain.Enums.WineAroma>()
        };
    }
}
