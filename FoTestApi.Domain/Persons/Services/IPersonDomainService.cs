namespace FoTestApi.Domain.Persons.Services
{
    public interface IPersonDomainService
    {
        Task EnsureUniqueAsync(string firstName, string lastName, string? excludeId = null);
    }
}

