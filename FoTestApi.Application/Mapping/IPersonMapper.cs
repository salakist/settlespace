using FoTestApi.Application.Commands;
using FoTestApi.Application.DTOs;
using FoTestApi.Domain.Entities;

namespace FoTestApi.Application.Mapping
{
    public interface IPersonMapper
    {
        PersonDto ToDto(PersonEntity entity);
        PersonEntity ToEntity(CreatePersonCommand command, string password);
        PersonEntity ToEntity(UpdatePersonCommand command, string? existingPassword);
    }
}
