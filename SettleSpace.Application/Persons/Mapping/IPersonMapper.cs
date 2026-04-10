using SettleSpace.Application.Persons.Commands;
using SettleSpace.Application.Persons.DTOs;
using SettleSpace.Domain.Persons.Entities;

namespace SettleSpace.Application.Persons.Mapping;

public interface IPersonMapper
{
    PersonDto ToDto(Person entity);
    Person ToEntity(CreatePersonCommand command, string password, PersonRole role);
    Person ToEntity(string id, UpdatePersonCommand command, string? existingPassword, PersonRole role);
}
