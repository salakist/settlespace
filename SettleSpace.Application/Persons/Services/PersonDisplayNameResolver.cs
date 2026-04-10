using SettleSpace.Domain.Persons;

namespace SettleSpace.Application.Persons.Services;

public interface IPersonDisplayNameResolver
{
    Task<Dictionary<string, string>> ResolveAsync(List<string> personIds);
}

public class PersonDisplayNameResolver(IPersonRepository personRepository) : IPersonDisplayNameResolver
{
    public async Task<Dictionary<string, string>> ResolveAsync(List<string> personIds)
    {
        var distinctIds = personIds
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.Ordinal)
            .ToList();

        if (distinctIds.Count == 0)
        {
            return new Dictionary<string, string>(StringComparer.Ordinal);
        }

        var people = await personRepository.GetByIdsAsync(distinctIds);
        var resolvedNames = distinctIds.ToDictionary(id => id, id => id, StringComparer.Ordinal);

        foreach (var person in people)
        {
            if (string.IsNullOrWhiteSpace(person.Id))
            {
                continue;
            }

            resolvedNames[person.Id] = string.IsNullOrWhiteSpace(person.DisplayName)
                ? person.Id
                : person.DisplayName;
        }

        return resolvedNames;
    }
}
