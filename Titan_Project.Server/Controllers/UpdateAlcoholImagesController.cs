using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Titan_Project.Server.Contracts.Seeding;
using Titan_Project.Server.Domain.Model;
using Titan_Project.Server.Infrastructure.Data;
using Titan_Project.Server.Infrastructure.Images;
using Titan_Project.Server.Infrastructure.Seeding;
using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Titan_Project.Server.Controllers;

[ApiController]
[Route("api/alcohol-images")]
[AllowAnonymous]
public sealed class UpdateAlcoholImagesController : ControllerBase
{
    private readonly AppDBContext _db;
    private readonly IAlcoholSeedService _seedService;
    private readonly IProductImageStore _imageStore;
    private readonly IWebHostEnvironment _environment;

    public UpdateAlcoholImagesController(AppDBContext db, IAlcoholSeedService seedService, IProductImageStore imageStore, IWebHostEnvironment environment)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _seedService = seedService ?? throw new ArgumentNullException(nameof(seedService));
        _imageStore = imageStore ?? throw new ArgumentNullException(nameof(imageStore));
        _environment = environment ?? throw new ArgumentNullException(nameof(environment));
    }

    /// <summary>
    /// Завантажує фотки для товарів одного стилю
    /// </summary>
    [HttpPost("update-by-style")]
    public async Task<ActionResult<object>> UpdateImagesByStyle([FromBody] UpdateImagesRequestDto request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Style))
        {
            return BadRequest(new { message = "Style is required" });
        }

        var productsWithoutImages = request.Type.ToLower() switch
        {
            "beer" => await _db.BeerProducts
                .Where(p => p.Style.ToString() == request.Style && p.ImageUrl == null && p.ImageLocalPath == null)
                .Cast<AlcoholProduct>()
                .ToListAsync(cancellationToken),
            
            "wine" => await _db.WineProducts
                .Where(p => p.Style.ToString() == request.Style && p.ImageUrl == null && p.ImageLocalPath == null)
                .Cast<AlcoholProduct>()
                .ToListAsync(cancellationToken),
            
            _ => new List<AlcoholProduct>()
        };

        return await ProcessImagesAsync(productsWithoutImages, cancellationToken);
    }

    /// <summary>
    /// Завантажує фотки для всіх товарів без зображень
    /// </summary>
    [HttpPost("update-all")]
    public async Task<ActionResult<object>> UpdateAllImages([FromQuery] string? imageStyle, CancellationToken cancellationToken)
    {
        var productsWithoutImages = await _db.AlcoholProducts
            .Where(p => p.ImageUrl == null && p.ImageLocalPath == null)
            .ToListAsync(cancellationToken);

        return await ProcessImagesAsync(productsWithoutImages, cancellationToken);
    }

    private async Task<ActionResult<object>> ProcessImagesAsync(List<AlcoholProduct> products, CancellationToken cancellationToken)
    {
        if (products.Count == 0)
        {
            return Ok(new
            {
                message = "No products without images found",
                updatedCount = 0
            });
        }

        var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var imageRoot = Path.Combine(webRoot, "product-images");
        Directory.CreateDirectory(imageRoot);

        var requestItems = products.Select(product =>
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
        }).ToList();

        var result = await _seedService.GenerateAsync(requestItems, "alcohol-seed.json", cancellationToken);

        foreach (var item in result.Items ?? new List<AlcoholSeedExportItemDto>())
        {
            var product = products.FirstOrDefault(existing => existing.ProductId == item.ProductId);
            if (product != null)
            {
                product.ImageUrl = _imageStore.GetPublicUrl(product.ProductId);
                product.ImageSourceUrl = item.SourceImageUrl;
                product.ImageLocalPath = item.LocalImagePath;
            }
        }

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            message = $"Successfully matched and updated images for {products.Count} products",
            updatedCount = products.Count,
            outputFilePath = result.OutputFilePath,
            imageDirectory = result.ImageDirectory
        });
    }
}

public class UpdateImagesRequestDto
{
    public required string Type { get; set; }
    public required string Style { get; set; }
    public string? ImageStyle { get; set; }
}