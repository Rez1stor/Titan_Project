namespace Titan_Project.Server.Domain.Model;

using Titan_Project.Server.Domain.Enums;

public class WineProduct : AlcoholProduct
{
    private WineColor _color;
    private WineStyle _style;
    private WineSweetness _sweetness;
    private List<WineAroma> _aromas = new(); 

    public WineColor Color
    {
        get => _color;
        set
        {
            if (!Enum.IsDefined(typeof(WineColor), value))
                throw new ArgumentOutOfRangeException(nameof(Color), value, "Invalid wine color.");
            _color = value;
        }
    }

    public WineStyle Style
    {
        get => _style;
        set
        {
            if (!Enum.IsDefined(typeof(WineStyle), value))
                throw new ArgumentOutOfRangeException(nameof(Style), value, "Invalid wine style.");
            _style = value;
        }
    }

    public WineSweetness Sweetness
    {
        get => _sweetness;
        set
        {
            if (!Enum.IsDefined(typeof(WineSweetness), value))
                throw new ArgumentOutOfRangeException(nameof(Sweetness), value, "Invalid sweetness level.");
            _sweetness = value;
        }
    }

    public List<WineAroma> Aromas
    {
        get => _aromas;
        set
        {
            _aromas = value ?? throw new ArgumentNullException(nameof(Aromas));
        }
    }

    public override AlcoholCategory Category => AlcoholCategory.Wine;
}