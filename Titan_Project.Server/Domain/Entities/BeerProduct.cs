namespace Titan_Project.Server.Domain.Entities;

using Titan_Project.Server.Domain.Enums;

public class BeerProduct : AlcoholProduct
{
    private const decimal MinIbu = 0;
    private const decimal MaxIbu = 120;
    private const decimal MinSrm = 0;
    private const decimal MaxSrm = 80;

    public decimal Ibu { get; private set; }
    public decimal Srm { get; private set; }
    public BeerColor Color { get; private set; }
    public BeerStyle Style { get; private set; }
    public override AlcoholCategory Category => AlcoholCategory.Beer;

    private BeerProduct() { }

    private BeerProduct(
        string name,
        string description,
        decimal abv,
        decimal price,
        string countryOfOrigin,
        decimal ibu,
        decimal srm,
        BeerColor color,
        BeerStyle style,
        Guid? id = null)
        : base(name, description, abv, price, countryOfOrigin, id)
    {
        ValidateBeer(ibu, srm, color, style);

        Ibu = ibu;
        Srm = srm;
        Color = color;
        Style = style;
    }

    // Factory method: creates valid BeerProduct instance
    public static BeerProduct Create(
        string name,
        string description,
        decimal abv,
        decimal price,
        string countryOfOrigin,
        decimal ibu,
        decimal srm,
        BeerColor color,
        BeerStyle style,
        Guid? id = null)
    {
        return new BeerProduct(name, description, abv, price, countryOfOrigin, ibu, srm, color, style, id);
    }


    private static void ValidateBeer(decimal ibu, decimal srm, BeerColor color, BeerStyle style)
    {
        if (ibu < MinIbu || ibu > MaxIbu)
             throw new ArgumentOutOfRangeException(nameof(ibu), ibu, $"IBU must be between {MinIbu} and {MaxIbu}.");
        if (srm < MinSrm || srm > MaxSrm)
             throw new ArgumentOutOfRangeException(nameof(srm), srm, $"SRM must be between {MinSrm} and {MaxSrm}.");
        if (Enum.IsDefined(typeof(BeerColor), color) == false)
             throw new ArgumentOutOfRangeException(nameof(color), color, "Invalid beer color.");
        if (Enum.IsDefined(typeof(BeerStyle), style) == false)
             throw new ArgumentOutOfRangeException(nameof(style), style, "Invalid beer style.");
    }

}