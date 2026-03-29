using FoTestApi.Application.Commands;
using FoTestApi.Application.DTOs;
using FoTestApi.Domain.Entities;

namespace FoTestApi.Application.Mapping
{
    public class PersonMapper : IPersonMapper
    {
        public PersonDto ToDto(PersonEntity entity) =>
            new()
            {
                Id = entity.Id,
                FirstName = entity.FirstName,
                LastName = entity.LastName,
                PhoneNumber = entity.PhoneNumber,
                Email = entity.Email,
                DateOfBirth = entity.DateOfBirth,
                Addresses = entity.Addresses.Select(ToDto).ToList()
            };

        public PersonEntity ToEntity(CreatePersonCommand command, string password) =>
            BuildPersonEntity(command, null, password);

        public PersonEntity ToEntity(string id, UpdatePersonCommand command, string? existingPassword) =>
            BuildPersonEntity(command, id, existingPassword);

        private static PersonEntity BuildPersonEntity(PersonMutationCommand command, string? id, string? password) =>
            new()
            {
                Id = id,
                FirstName = command.FirstName,
                LastName = command.LastName,
                Password = password,
                PhoneNumber = command.PhoneNumber,
                Email = command.Email,
                DateOfBirth = command.DateOfBirth,
                Addresses = command.Addresses.Select(ToEntity).ToList()
            };

        private static AddressDto ToDto(Address address) =>
            new()
            {
                Label = address.Label,
                StreetLine1 = address.StreetLine1,
                StreetLine2 = address.StreetLine2,
                PostalCode = address.PostalCode,
                City = address.City,
                StateOrRegion = address.StateOrRegion,
                Country = address.Country
            };

        private static Address ToEntity(AddressCommand command) =>
            new()
            {
                Label = command.Label,
                StreetLine1 = command.StreetLine1,
                StreetLine2 = command.StreetLine2,
                PostalCode = command.PostalCode,
                City = command.City,
                StateOrRegion = command.StateOrRegion,
                Country = command.Country
            };
    }
}
