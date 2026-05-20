using System.Collections.Generic;
using Titan_Project.Server.Domain.Enums;

namespace Titan_Project.Server.Contracts.Products;

public class WineDto : ProductDto
{
    public WineStyle Style { get; set; }
    public WineColor Color { get; set; }

    public List<WineAromaDto> Aromas { get; set; } = new();
    public WineSweetness Sweetness { get; set; }
}