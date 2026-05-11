using Titan_Project.Server.Domain.Enums;
using System;

namespace Titan_Project.Server.Domain.Entities;

public abstract class AlcoholProduct
{
    private const decimal MinAbv = 0;
    private const decimal MinPrice = 0;
    private const decimal MaxAbv = 100;
    private const int MaxDescriptionLength = 2000;
    private const int MaxNameLength = 255;
    private const int MaxCountryOfOriginLength = 100;

    public Guid Id { get; protected set; } = Guid.NewGuid();
    public string Name { get; protected set; } = string.Empty;
    public string Description { get; protected set; } = string.Empty;
    public decimal Abv { get; protected set; }
    public decimal Price { get; protected set; }
    public string CountryOfOrigin { get; protected set; } = string.Empty;
    public abstract AlcoholCategory Category { get; }

    protected AlcoholProduct() { }

    protected AlcoholProduct(string name, string description, decimal abv, decimal price, string countryOfOrigin, Guid? id = null)
    {
        ValidateBaseProperties(name, abv, price, description, countryOfOrigin);
        Id = id ?? Guid.NewGuid();
        Name = name.Trim();
        Description = description?.Trim() ?? string.Empty;
        Abv = abv;
        Price = price;
        CountryOfOrigin = countryOfOrigin.Trim();
    }
    
    public void Initialize(string name, string description, decimal abv, decimal price, string countryOfOrigin, Guid? id)
    {
        throw new NotImplementedException();
    }
    protected static void ValidateBaseProperties(string name, decimal abv, decimal price, string description, string countryOfOrigin)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Product name cannot be empty.", nameof(name));

        if (name.Length > MaxNameLength )
            throw new ArgumentException($"Product name cannot exceed {MaxNameLength} characters.", nameof(name));

        if(string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("Product description cannot be empty.", nameof(description));

        if (description.Length > MaxDescriptionLength)
            throw new ArgumentException($"Product description cannot exceed {MaxDescriptionLength} characters.", nameof(description));

        if (abv < MinAbv || abv > MaxAbv)
            throw new ArgumentOutOfRangeException(nameof(abv), abv, $"ABV must be between {MinAbv} and {MaxAbv}.");

        if (price < MinPrice)
            throw new ArgumentOutOfRangeException(nameof(price), price, $"Price cannot be negative (minimum: {MinPrice}).");
      
        if (string.IsNullOrWhiteSpace(countryOfOrigin))
            throw new ArgumentException("Country of origin cannot be empty. ", nameof(countryOfOrigin));

        if (countryOfOrigin.Length > MaxCountryOfOriginLength)
            throw new ArgumentException($"Country of origin cannot exceed {MaxCountryOfOriginLength} characters.", nameof(countryOfOrigin));
    }

    
}
