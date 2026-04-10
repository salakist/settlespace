using SettleSpace.Application.Authentication.Services;
using SettleSpace.Application.Persons.Mapping;
using SettleSpace.Application.Persons.Services;
using SettleSpace.Application.Persons.Commands;
using SettleSpace.Application.Persons.DTOs;
using SettleSpace.Domain.Persons.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SettleSpace.Application.Persons
{
    /// <summary>
    /// Controller for managing persons in the database.
    /// Implements REST endpoints following DDD principles.
    /// </summary>
    /// <remarks>
    /// Initializes a new instance of the <see cref="PersonsController"/> class.
    /// </remarks>
    /// <param name="applicationService">The person application service.</param>
    /// <param name="personMapper">The mapper from domain entities to DTOs.</param>
    /// <param name="authService">The auth service used to resolve the caller identity from the request claims.</param>
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PersonsController(IPersonApplicationService applicationService, IPersonMapper personMapper, IAuthService authService) : ControllerBase
    {
        /// <summary>
        /// Gets all persons.
        /// </summary>
        /// <returns>A list of all persons.</returns>
        /// <response code="200">Returns all persons.</response>
        /// <response code="401">If the caller is not authenticated.</response>
        [HttpGet]
        [ProducesResponseType(typeof(List<PersonDto>), 200)]
        [ProducesResponseType(typeof(ProblemDetails), 401)]
        public async Task<ActionResult<List<PersonDto>>> Get()
        {
            var (personId, personRole) = authService.ResolveAuthContext(User);
            var persons = await applicationService.GetPersonsAsync(personId, personRole);
            return Ok(persons.ConvertAll(personMapper.ToDto));
        }

        /// <summary>
        /// Gets a person by ID.
        /// </summary>
        /// <param name="id">The ID of the person.</param>
        /// <returns>The person with the specified ID.</returns>
        /// <response code="200">Returns the person.</response>
        /// <response code="404">If the person is not found.</response>
        /// <response code="401">If the caller is not authenticated.</response>
        [HttpGet("{id:length(24)}")]
        [ProducesResponseType(typeof(PersonDto), 200)]
        [ProducesResponseType(typeof(ProblemDetails), 404)]
        [ProducesResponseType(typeof(ProblemDetails), 401)]
        public async Task<ActionResult<PersonDto>> Get(string id)
        {
            var (personId, personRole) = authService.ResolveAuthContext(User);
            var person = await applicationService.GetPersonByIdAsync(id, personId, personRole) ?? throw new PersonNotFoundException(id);
            return Ok(personMapper.ToDto(person));
        }

        /// <summary>
        /// Searches persons by a query string matching first or last name (case-insensitive).
        /// </summary>
        /// <param name="query">The query string to search for in first or last names.</param>
        /// <returns>A list of persons where first name or last name matches the query.</returns>
        /// <response code="200">Returns the matching persons.</response>
        /// <response code="401">If the caller is not authenticated.</response>
        [HttpGet("search/{query}")]
        [ProducesResponseType(typeof(List<PersonDto>), 200)]
        [ProducesResponseType(typeof(ProblemDetails), 401)]
        public async Task<ActionResult<List<PersonDto>>> SearchByQuery(string query)
        {
            var (personId, personRole) = authService.ResolveAuthContext(User);
            var persons = await applicationService.SearchPersonsAsync(query, personId, personRole);
            return Ok(persons.ConvertAll(personMapper.ToDto));
        }

        /// <summary>
        /// Gets the currently authenticated person.
        /// </summary>
        [HttpGet("me")]
        [ProducesResponseType(typeof(PersonDto), 200)]
        [ProducesResponseType(typeof(ProblemDetails), 401)]
        [ProducesResponseType(typeof(ProblemDetails), 404)]
        public async Task<ActionResult<PersonDto>> GetCurrent()
        {
            var (personId, _) = authService.ResolveAuthContext(User);
            var person = await applicationService.GetPersonByIdAsync(personId) ?? throw new PersonNotFoundException(personId);
            return Ok(personMapper.ToDto(person));
        }

        /// <summary>
        /// Creates a new person.
        /// </summary>
        /// <param name="command">The create person command with first and last name.</param>
        /// <returns>The created person.</returns>
        /// <response code="201">Returns the newly created person.</response>
        /// <response code="409">If a person with the same first and last name already exists.</response>
        /// <response code="400">If the password is weak or another validation fails.</response>
        /// <response code="401">If the caller is not authenticated.</response>
        [HttpPost]
        [ProducesResponseType(typeof(PersonDto), 201)]
        [ProducesResponseType(typeof(ProblemDetails), 409)]
        [ProducesResponseType(typeof(ProblemDetails), 400)]
        [ProducesResponseType(typeof(ProblemDetails), 401)]
        public async Task<IActionResult> Post([FromBody] CreatePersonCommand command)
        {
            var (personId, personRole) = authService.ResolveAuthContext(User);
            var person = await applicationService.CreatePersonAsync(command, personId, personRole);
            return CreatedAtAction(nameof(Get), new { id = person.Id }, personMapper.ToDto(person));
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
        /// <response code="401">If the caller is not authenticated.</response>
        [HttpPut("{id:length(24)}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(typeof(ProblemDetails), 404)]
        [ProducesResponseType(typeof(ProblemDetails), 409)]
        [ProducesResponseType(typeof(ProblemDetails), 400)]
        [ProducesResponseType(typeof(ProblemDetails), 401)]
        public async Task<IActionResult> Update(string id, [FromBody] UpdatePersonCommand command)
        {
            var (personId, personRole) = authService.ResolveAuthContext(User);
            await applicationService.UpdatePersonAsync(id, command, personId, personRole);
            return NoContent();
        }

        /// <summary>
        /// Updates the currently authenticated person.
        /// </summary>
        [HttpPut("me")]
        [ProducesResponseType(204)]
        [ProducesResponseType(typeof(ProblemDetails), 400)]
        [ProducesResponseType(typeof(ProblemDetails), 401)]
        [ProducesResponseType(typeof(ProblemDetails), 404)]
        [ProducesResponseType(typeof(ProblemDetails), 409)]
        public async Task<IActionResult> UpdateCurrent([FromBody] UpdatePersonCommand command)
        {
            var (personId, _) = authService.ResolveAuthContext(User);
            await applicationService.UpdatePersonAsync(personId, command);
            return NoContent();
        }

        /// <summary>
        /// Deletes a person by ID.
        /// </summary>
        /// <param name="id">The ID of the person to delete.</param>
        /// <response code="204">If the deletion is successful.</response>
        /// <response code="404">If the person is not found.</response>
        /// <response code="401">If the caller is not authenticated.</response>
        [HttpDelete("{id:length(24)}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(typeof(ProblemDetails), 404)]
        [ProducesResponseType(typeof(ProblemDetails), 401)]
        public async Task<IActionResult> Delete(string id)
        {
            var (personId, personRole) = authService.ResolveAuthContext(User);
            await applicationService.DeletePersonAsync(id, personId, personRole);
            return NoContent();
        }
    }
}
