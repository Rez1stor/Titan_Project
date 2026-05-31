using Titan_Project.Server.Domain.Enums;
using System;
using System.ComponentModel.DataAnnotations;

namespace Titan_Project.Server.Domain.Model;

public abstract class AlcoholProduct
{
    private const decimal MinAbv = 0;
    private const decimal MinPrice = 0;
    private const decimal MaxAbv = 100;
    private const int MaxDescriptionLength = 2000;
    private const int MaxNameLength = 255;
    private const int MaxCountryOfOriginLength = 100;

    private string _name = string.Empty;
    private string _description = string.Empty;
    private string _countryOfOrigin = string.Empty;
    private decimal _abv;
    private decimal _price;

    [Key]
    public int ProductId { get; set; }
    
    [Required]
    public string Name 
    { 
        get => _name; 
        set
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("Product name cannot be empty.", nameof(Name));
            if (value.Length > MaxNameLength)
                throw new ArgumentException($"Product name cannot exceed {MaxNameLength} characters.", nameof(Name));
            _name = value.Trim();
        }
    }
    
    public string Description 
    { 
        get => _description; 
        set 
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("Product description cannot be empty.", nameof(Description));
            if(value.Length > MaxDescriptionLength)
                throw new ArgumentException($"Product description cannot exceed {MaxDescriptionLength} characters.", nameof(Description));
            _description = value.Trim();
        }
     }
     
    public decimal Abv
    {
        get => _abv; 
        set
        {
            if (value < MinAbv || value > MaxAbv)
                throw new ArgumentOutOfRangeException(nameof(Abv), value, $"ABV must be between {MinAbv} and {MaxAbv}.");
            _abv = value;
        }
    }
    
    public decimal Price
    { 
        get => _price; 
        set
        {
            if (value < MinPrice)
                throw new ArgumentOutOfRangeException(nameof(Price), value, $"Price cannot be negative (minimum: {MinPrice}).");
            _price = value;
        }
    }
    
    public string CountryOfOrigin 
    { 
        get => _countryOfOrigin;
        set
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("Country of origin cannot be empty. ", nameof(CountryOfOrigin));
            if (value.Length > MaxCountryOfOriginLength)
                throw new ArgumentException($"Country of origin cannot exceed {MaxCountryOfOriginLength} characters.", nameof(CountryOfOrigin));
            _countryOfOrigin = value.Trim();
        }
    }

    // Нові властивості для зберігання посилань та файлів
    public string? ImageUrl { get; set; }
    public string? ImageSourceUrl { get; set; }
    public string? ImageLocalPath { get; set; }

    public abstract AlcoholCategory Category { get; }
    public virtual ICollection<User> Favorites { get; set; } = new List<User>();

    protected AlcoholProduct() { }

    protected AlcoholProduct(string name, string description, decimal abv, decimal price, string countryOfOrigin)
    {
        Name = name.Trim();
        Description = description?.Trim() ?? string.Empty;
        Abv = abv;
        Price = price;
        CountryOfOrigin = countryOfOrigin.Trim();
    }
}