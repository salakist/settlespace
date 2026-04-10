using SettleSpace.Application.Authentication;
using SettleSpace.Application.Authentication.Services;
using SettleSpace.Application.Persons;
using SettleSpace.Application.Persons.Commands;
using SettleSpace.Application.Persons.DTOs;
using SettleSpace.Application.Persons.Mapping;
using SettleSpace.Application.Persons.Services;
using SettleSpace.Domain.Persons.Entities;
using SettleSpace.Domain.Persons.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Moq;

namespace SettleSpace.Application.Tests.Persons;

public class PersonsControllerTests
{
    private readonly Mock<IPersonApplicationService> _serviceMock = new();
    private readonly Mock<IAuthService> _authServiceMock = new();
    private readonly PersonsController _controller;

    public PersonsControllerTests()
    {
        _controller = new PersonsController(_serviceMock.Object, new PersonMapper(), _authServiceMock.Object);
    }

    // -----------------------------------------------------------------------
    // GET all
    // -----------------------------------------------------------------------

    [Fact]
    public async Task GetReturnsOkWithMappedDtos()
    {
        var persons = new List<Person>
        {
            new() { Id = "1", FirstName = "John", LastName = "Doe", Password = "hashed::secret" }
        };
        _serviceMock.Setup(s => s.GetPersonsAsync("user-1", PersonRole.ADMIN)).ReturnsAsync(persons);
        SetUser("user-1", PersonRole.ADMIN);

        var result = await _controller.Get();

        var ok   = Assert.IsType<OkObjectResult>(result.Result);
        var dtos = Assert.IsAssignableFrom<List<PersonDto>>(ok.Value);
        Assert.Single(dtos);
        Assert.Equal("John", dtos[0].FirstName);
        Assert.Null(typeof(PersonDto).GetProperty("Password"));
    }

    // -----------------------------------------------------------------------
    // GET by id
    // -----------------------------------------------------------------------

    [Fact]
    public async Task GetByIdExistingPersonReturnsOkWithDto()
    {
        var person = new Person { Id = "507f1f77bcf86cd799439011", FirstName = "John", LastName = "Doe" };
        _serviceMock.Setup(s => s.GetPersonByIdAsync(person.Id!, "user-1", PersonRole.ADMIN)).ReturnsAsync(person);
        SetUser("user-1", PersonRole.ADMIN);

        var result = await _controller.Get(person.Id!);

        var ok  = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<PersonDto>(ok.Value);
        Assert.Equal("John", dto.FirstName);
    }

    [Fact]
    public async Task GetByIdPersonNotFoundThrowsPersonNotFoundException()
    {
        _serviceMock.Setup(s => s.GetPersonByIdAsync(It.IsAny<string>(), "user-1", PersonRole.ADMIN))
                    .ReturnsAsync((Person?)null);
        SetUser("user-1", PersonRole.ADMIN);

        var exception = await Assert.ThrowsAsync<PersonNotFoundException>(() => _controller.Get("507f1f77bcf86cd799439011"));

        Assert.Equal("Person with ID '507f1f77bcf86cd799439011' not found.", exception.Message);
    }

    [Fact]
    public async Task GetCurrentAuthenticatedUserReturnsCurrentPerson()
    {
        var person = new Person { Id = "507f1f77bcf86cd799439011", FirstName = "John", LastName = "Doe" };
        _serviceMock.Setup(s => s.GetPersonByIdAsync(person.Id!)).ReturnsAsync(person);
        SetUser(person.Id!, PersonRole.USER);

        var result = await _controller.GetCurrent();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<PersonDto>(ok.Value);
        Assert.Equal(person.Id, dto.Id);
    }

    // -----------------------------------------------------------------------
    // POST
    // -----------------------------------------------------------------------

    [Fact]
    public async Task PostValidCommandReturnsCreated()
    {
        var command = new CreatePersonCommand { FirstName = "John", LastName = "Doe", Password = "Strong@Pass1" };
        var person  = new Person { Id = "507f1f77bcf86cd799439011", FirstName = "John", LastName = "Doe", Password = "Strong@Pass1" };
        _serviceMock.Setup(s => s.CreatePersonAsync(command, "user-1", PersonRole.ADMIN)).ReturnsAsync(person);
        SetUser("user-1", PersonRole.ADMIN);

        var result = await _controller.Post(command);

        var created = Assert.IsType<CreatedAtActionResult>(result);
        var dto     = Assert.IsType<PersonDto>(created.Value);
        Assert.Equal(person.Id, dto.Id);
    }

    // -----------------------------------------------------------------------
    // PUT
    // -----------------------------------------------------------------------

    [Fact]
    public async Task UpdateValidCommandReturnsNoContent()
    {
        var id      = "507f1f77bcf86cd799439011";
        var command = new UpdatePersonCommand { FirstName = "Jane", LastName = "Doe" };
        _serviceMock.Setup(s => s.UpdatePersonAsync(id, command, "user-1", PersonRole.ADMIN))
                    .Returns(Task.CompletedTask);
        SetUser("user-1", PersonRole.ADMIN);

        var result = await _controller.Update(id, command);

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task UpdateCurrentAuthenticatedUserReturnsNoContent()
    {
        var id = "507f1f77bcf86cd799439011";
        var command = new UpdatePersonCommand { FirstName = "Jane", LastName = "Doe" };
        _serviceMock.Setup(s => s.UpdatePersonAsync(id, command))
            .Returns(Task.CompletedTask);
        SetUser(id, PersonRole.USER);

        var result = await _controller.UpdateCurrent(command);

        Assert.IsType<NoContentResult>(result);
    }

    // -----------------------------------------------------------------------
    // DELETE
    // -----------------------------------------------------------------------

    [Fact]
    public async Task DeleteExistingPersonReturnsNoContent()
    {
        _serviceMock.Setup(s => s.DeletePersonAsync("507f1f77bcf86cd799439011", "user-1", PersonRole.ADMIN))
                    .Returns(Task.CompletedTask);
        SetUser("user-1", PersonRole.ADMIN);

        var result = await _controller.Delete("507f1f77bcf86cd799439011");

        Assert.IsType<NoContentResult>(result);
    }

    private void SetUser(string personId, PersonRole role)
    {
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    [
                        new Claim(CustomClaimTypes.PersonId, personId),
                        new Claim(CustomClaimTypes.PersonRole, role.ToString())
                    ],
                    "TestAuth"))
            }
        };

        _authServiceMock
            .Setup(s => s.ResolveAuthContext(It.IsAny<ClaimsPrincipal>()))
            .Returns((personId, role));
    }
}



