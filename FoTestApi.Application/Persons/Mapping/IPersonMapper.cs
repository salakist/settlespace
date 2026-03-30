using FoTestApi.Application.Persons.Commands;
using FoTestApi.Application.Persons.DTOs;
using FoTestApi.Domain.Persons.Entities;

namespace FoTestApi.Application.Persons.Mapping
{
    public interface IPersonMapper
    {
        PersonDto ToDto(Person entity);
        Person ToEntity(CreatePersonCommand command, string password);
        Person ToEntity(string id, UpdatePersonCommand command, string? existingPassword);
    }
}



