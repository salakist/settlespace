using FoTestApi.Application.Services;
using FoTestApi.Application.Commands;
using FoTestApi.Application.DTOs;
using FoTestApi.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace FoTestApi.Controllers
{
    /// <summary>
    /// Controller for managing persons in the database.
    /// Implements REST endpoints following DDD principles.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class PersonsController : ControllerBase
    {
        private readonly IPersonApplicationService _applicationService;

        /// <summary>
        /// Initializes a new instance of the <see cref="PersonsController"/> class.
        /// </summary>
        /// <param name="applicationService">The person application service.</param>
        public PersonsController(IPersonApplicationService applicationService) =>
            _applicationService = applicationService;

        /// <summary>
        /// Gets all persons.
        /// </summary>
        /// <returns>A list of all persons.</returns>
        /// <response code="200">Returns all persons.</response>
        [HttpGet]
        [ProducesResponseType(typeof(List<PersonDto>), 200)]
        public async Task<ActionResult<List<PersonDto>>> Get()
        {
            var persons = await _applicationService.GetAllPersonsAsync();
            return Ok(persons.Select(MapToDto).ToList());
        }

        /// <summary>
        /// Searches persons by a query string matching first or last name (case-insensitive).
        /// </summary>
        /// <param name="query">The query string to search for in first or last names.</param>
        /// <returns>A list of persons where first name or last name matches the query.</returns>
        /// <response code="200">Returns the matching persons.</response>
        [HttpGet("search/{query}")]
        [ProducesResponseType(typeof(List<PersonDto>), 200)]
        public async Task<ActionResult<List<PersonDto>>> SearchByQuery(string query)
        {
            var persons = await _applicationService.SearchPersonsAsync(query);
            return Ok(persons.Select(MapToDto).ToList());
        }

        /// <summary>
        /// Gets a person by ID.
        /// </summary>
        /// <param name="id">The ID of the person.</param>
        /// <returns>The person with the specified ID.</returns>
        /// <response code="200">Returns the person.</response>
        /// <response code="404">If the person is not found.</response>
        [HttpGet("{id:length(24)}")]
        [ProducesResponseType(typeof(PersonDto), 200)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<PersonDto>> Get(string id)
        {
            var person = await _applicationService.GetPersonByIdAsync(id);

            if (person is null)
            {
                return NotFound();
            }

            return Ok(MapToDto(person));
        }

        /// <summary>
        /// Creates a new person.
        /// </summary>
        /// <param name="command">The create person command with first and last name.</param>
        /// <returns>The created person.</returns>
        /// <response code="201">Returns the newly created person.</response>
        /// <response code="409">If a person with the same first and last name already exists.</response>
        /// <response code="400">If the password is weak or another validation fails.</response>
        [HttpPost]
        [ProducesResponseType(typeof(PersonDto), 201)]
        [ProducesResponseType(409)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> Post([FromBody] CreatePersonCommand command)
        {
            var person = await _applicationService.CreatePersonAsync(command);
            return CreatedAtAction(nameof(Get), new { id = person.Id }, MapToDto(person));
        }

        /// <summary>
        /// Updates an existing person.
        /// </summary>
        /// <param name="id">The ID of the person to update.</param>
        /// <param name="command">The update person command with updated first and last name.</param>
        /// <response code="204">If the update is successful.</response>
        /// <response code="404">If the person is not found.</response>
        /// <response code="409">If the update would create a duplicate.</response>
        /// <response code="400">If the password is weak or another validation fails.</response>
        [HttpPut("{id:length(24)}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(404)]
        [ProducesResponseType(409)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> Update(string id, [FromBody] UpdatePersonCommand command)
        {
            command.Id = id;
            await _applicationService.UpdatePersonAsync(command);
            return NoContent();
        }

        /// <summary>
        /// Deletes a person by ID.
        /// </summary>
        /// <param name="id">The ID of the person to delete.</param>
        /// <response code="204">If the deletion is successful.</response>
        /// <response code="404">If the person is not found.</response>
        [HttpDelete("{id:length(24)}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Delete(string id)
        {
            await _applicationService.DeletePersonAsync(new DeletePersonCommand { Id = id });
            return NoContent();
        }

        /// <summary>
        /// Maps a PersonEntity to a PersonDto.
        /// </summary>
        private static PersonDto MapToDto(PersonEntity entity) =>
            new PersonDto { Id = entity.Id, FirstName = entity.FirstName, LastName = entity.LastName, Password = entity.Password };
    }
}
