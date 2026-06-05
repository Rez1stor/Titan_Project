using System.Collections.Generic;
using System.Threading.Tasks;
using TitanClassLibrary.Contracts.Catalog;

namespace TitanClassLibrary.Application.Catalog;

public interface IAdminCatalogBeerService
{
    Task<IReadOnlyList<CatalogBeerSuggestionDto>> SuggestAsync(string? query, int count);
    Task<CatalogBeerAutofillResponse> GetDetailsAsync(string beerId);
}
