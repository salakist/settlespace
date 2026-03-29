using FoTestApi.Application.Commands;
using FoTestApi.Application.DTOs;
using FoTestApi.Application.Services;
using FoTestApi.Controllers;
using FoTestApi.Domain.Entities;
using FoTestApi.Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace FoTestApi.Application.Tests.Controllers;

public class PersonsControllerTests
{
    private readonly Mock<IPersonApplicationService> _serviceMock = new();
    private readonly PersonsController _controller;

    public PersonsControllerTests()
    {
        _controller = new PersonsController(_serviceMock.Object);
    }

    // -----------------------------------------------------------------------
    // GET all
    // -----------------------------------------------------------------------

    [Fact]
    public async Task Get_ReturnsOkWithMappedDtos()
    {
        var persons = new List<PersonEntity>
        {
            new() { Id = "1", FirstName = "John", LastName = "Doe" }
        };
        _serviceMock.Setup(s => s.GetAllPersonsAsync()).ReturnsAsync(persons);

        var result = await _controller.Get();

        var ok   = Assert.IsType<OkObjectResult>(result.Result);
        var dtos = Assert.IsAssignableFrom<List<PersonDto>>(ok.Value);
        Assert.Single(dtos);
        Assert.Equal("John", dtos[0].FirstName);
    }

    // -----------------------------------------------------------------------
    // GET by id
    // -----------------------------------------------------------------------

    [Fact]
    public async Task GetById_ExistingPerson_ReturnsOkWithDto()
    {
        var person = new PersonEntity { Id = "507f1f77bcf86cd799439011", FirstName = "John", LastName = "Doe" };
        _serviceMock.Setup(s => s.GetPersonByIdAsync(person.Id!)).ReturnsAsync(person);

        var result = await _controller.Get(person.Id!);

        var ok  = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<PersonDto>(ok.Value);
        Assert.Equal("John", dto.FirstName);
    }

    [Fact]
    public async Task GetById_PersonNotFound_ReturnsNotFound()
    {
        _serviceMock.Setup(s => s.GetPersonByIdAsync(It.IsAny<string>()))
                    .ReturnsAsync((PersonEntity?)null);

        var result = await _controller.Get("507f1f77bcf86cd799439011");

        Assert.IsType<NotFoundResult>(result.Result);
    }

    // -----------------------------------------------------------------------
    // POST
    // -----------------------------------------------------------------------

    [Fact]
    public async Task Post_ValidCommand_ReturnsCreated()
    {
        var command = new CreatePersonCommand { FirstName = "John", LastName = "Doe" };
        var person  = new PersonEntity { Id = "507f1f77bcf86cd799439011", FirstName = "John", LastName = "Doe" };
        _serviceMock.Setup(s => s.CreatePersonAsync(command)).ReturnsAsync(person);

        var result = await _controller.Post(command);

        var created = Assert.IsType<CreatedAtActionResult>(result);
        var dto     = Assert.IsType<PersonDto>(created.Value);
        Assert.Equal(person.Id, dto.Id);
    }

    [Fact]
    public async Task Post_DuplicatePerson_ReturnsConflict()
    {
        var command = new CreatePersonCommand { FirstName = "John", LastName = "Doe" };
        _serviceMock.Setup(s => s.CreatePersonAsync(command))
                    .ThrowsAsync(new DuplicatePersonException("John", "Doe"));

        var result = await _controller.Post(command);

        Assert.IsType<ConflictObjectResult>(result);
    }

    [Fact]
    public async Task Post_InvalidName_ReturnsBadRequest()
    {
        var command = new CreatePersonCommand { FirstName = "", LastName = "Doe" };
        _serviceMock.Setup(s => s.CreatePersonAsync(command))
                    .ThrowsAsync(new InvalidOperationException("FirstName cannot be empty."));

        var result = await _controller.Post(command);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    // -----------------------------------------------------------------------
    // PUT
    // -----------------------------------------------------------------------

    [Fact]
    public async Task Update_ValidCommand_ReturnsNoContent()
    {
        var id      = "507f1f77bcf86cd799439011";
        var command = new UpdatePersonCommand { FirstName = "Jane", LastName = "Doe" };
        _serviceMock.Setup(s => s.UpdatePersonAsync(It.IsAny<UpdatePersonCommand>()))
                    .Returns(Task.CompletedTask);

        var result = await _controller.Update(id, command);

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task Update_PersonNotFound_ReturnsNotFound()
    {
        var id      = "507f1f77bcf86cd799439011";
        var command = new UpdatePersonCommand { FirstName = "Jane", LastName = "Doe" };
        _serviceMock.Setup(s => s.UpdatePersonAsync(It.IsAny<UpdatePersonCommand>()))
                    .ThrowsAsync(new InvalidOperationException("Person with ID 'x' not found."));

        var result = await _controller.Update(id, command);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Update_DuplicateName_ReturnsConflict()
    {
        var id      = "507f1f77bcf86cd799439011";
        var command = new UpdatePersonCommand { FirstName = "Jane", LastName = "Doe" };
        _serviceMock.Setup(s => s.UpdatePersonAsync(It.IsAny<UpdatePersonCommand>()))
                    .ThrowsAsync(new DuplicatePersonException("Jane", "Doe"));

        var result = await _controller.Update(id, command);

        Assert.IsType<ConflictObjectResult>(result);
    }

    // -----------------------------------------------------------------------
    // DELETE
    // -----------------------------------------------------------------------

    [Fact]
    public async Task Delete_ExistingPerson_ReturnsNoContent()
    {
        _serviceMock.Setup(s => s.DeletePersonAsync(It.IsAny<DeletePersonCommand>()))
                    .Returns(Task.CompletedTask);

        var result = await _controller.Delete("507f1f77bcf86cd799439011");

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task Delete_PersonNotFound_ReturnsNotFound()
    {
        _serviceMock.Setup(s => s.DeletePersonAsync(It.IsAny<DeletePersonCommand>()))
                    .ThrowsAsync(new InvalidOperationException("Person with ID 'x' not found."));

        var result = await _controller.Delete("507f1f77bcf86cd799439011");

        Assert.IsType<NotFoundResult>(result);
    }
}
