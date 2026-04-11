using SettleSpace.Application.Persons.Commands;
using SettleSpace.Application.Persons.DTOs;
using SettleSpace.Application.Persons.Queries;
using SettleSpace.Domain.Persons.Entities;
using SettleSpace.Domain.Persons;

namespace SettleSpace.Application.Persons.Mapping;

public interface IPersonMapper
{
    PersonDto ToDto(Person entity);
    PersonSearchFilter ToSearchFilter(PersonSearchQuery query);
    Person ToEntity(CreatePersonCommand command, string password, PersonRole role);
    Person ToEntity(string id, UpdatePersonCommand command, string? existingPassword, PersonRole role);
}
