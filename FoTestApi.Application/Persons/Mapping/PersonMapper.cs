using FoTestApi.Application.Persons.Commands;
using FoTestApi.Application.Persons.DTOs;
using FoTestApi.Domain.Persons.Entities;

namespace FoTestApi.Application.Persons.Mapping
{
    public class PersonMapper : IPersonMapper
    {
        public PersonDto ToDto(Person entity) =>
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

        public Person ToEntity(CreatePersonCommand command, string password) =>
            BuildPerson(command, null, password);

        public Person ToEntity(string id, UpdatePersonCommand command, string? existingPassword) =>
            BuildPerson(command, id, existingPassword);

        private static Person BuildPerson(PersonMutationCommand command, string? id, string? password) =>
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



