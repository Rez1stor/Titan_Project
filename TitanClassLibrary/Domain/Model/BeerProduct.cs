namespace Titan_Project.Server.Domain.Model;

using Titan_Project.Server.Domain.Enums;

public class BeerProduct : AlcoholProduct
{
    private const decimal MinIbu = 0;
    private const decimal MaxIbu = 120;
    private const decimal MinSrm = 0;
    private const decimal MaxSrm = 80;

    private decimal _ibu;
    private decimal _srm;
    private BeerColor _color;
    private BeerStyle _style;

    public decimal Ibu 
    { 
        get => _ibu;
        set {
            if (Ibu < MinIbu || Ibu > MaxIbu)
                throw new ArgumentOutOfRangeException(nameof(Ibu), Ibu, $"IBU must be between {MinIbu} and {MaxIbu}.");
            _ibu = value; 
        }
    }
    public decimal Srm 
    { 
        get => _srm;
        set
        {
            if (Srm < MinSrm || Srm > MaxSrm)
                throw new ArgumentOutOfRangeException(nameof(Srm), Srm, $"SRM must be between {MinSrm} and {MaxSrm}.");
            _srm = value;
        }
    }
    public BeerColor Color 
    { 
        get => _color;
        set
        {
            if (Enum.IsDefined(typeof(BeerColor), value) == false)
                throw new ArgumentOutOfRangeException(nameof(Color), value, "Invalid beer color.");
            _color = value;
        }
    }
    public BeerStyle Style
    {
        get => _style;
        set
        {
            if (Enum.IsDefined(typeof(BeerStyle), value) == false)
                throw new ArgumentOutOfRangeException(nameof(Style), value, "Invalid beer style.");
            _style = value;
        }
    }
    public override AlcoholCategory Category { get => AlcoholCategory.Beer; }
}