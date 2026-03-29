namespace FoTestApi.Domain.Services
{
    public interface IPersonDomainService
    {
        Task EnsureUniqueAsync(string firstName, string lastName, string? excludeId = null);
    }
}
