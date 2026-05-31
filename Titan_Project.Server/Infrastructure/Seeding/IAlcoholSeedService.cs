using Titan_Project.Server.Contracts.Seeding;

namespace Titan_Project.Server.Infrastructure.Seeding;

public interface IAlcoholSeedService
{
    Task<AlcoholSeedResultDto> GenerateAsync(IReadOnlyCollection<AlcoholSeedItemDto> products, string? outputFileName, CancellationToken cancellationToken);
    Task<List<Titan_Project.Server.Contracts.Seeding.AlcoholImageCandidateDto>> FindCandidatesAsync(string productName, string categoryName, string? extraFactor, CancellationToken cancellationToken);
}