using FoTestApi.Models;
using FoTestApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace FoTestApi.Controllers
{
    /// <summary>
    /// Controller for managing persons in the database.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class PersonsController : ControllerBase
    {
        private readonly PersonService _personService;

        /// <summary>
        /// Initializes a new instance of the <see cref="PersonsController"/> class.
        /// </summary>
        /// <param name="personService">The person service.</param>
        public PersonsController(PersonService personService) =>
            _personService = personService;

        /// <summary>
        /// Gets all persons.
        /// </summary>
        /// <returns>A list of all persons.</returns>
        [HttpGet]
        public async Task<List<Person>> Get() =>
            await _personService.GetAsync();

        /// <summary>
        /// Searches persons by a query string matching first or last name.
        /// </summary>
        /// <param name="query">The query string to search for in first or last names.</param>
        /// <returns>A list of persons where first name or last name matches the query.</returns>
        /// <response code="200">Returns the matching persons.</response>
        [HttpGet("search/{query}")]
        [ProducesResponseType(typeof(List<Person>), 200)]
        public async Task<List<Person>> SearchByQuery(string query) =>
            await _personService.SearchAsync(query);

        /// <summary>
        /// Gets a person by ID.
        /// </summary>
        /// <param name="id">The ID of the person.</param>
        /// <returns>The person with the specified ID.</returns>
        /// <response code="200">Returns the person.</response>
        /// <response code="404">If the person is not found.</response>
        [HttpGet("{id:length(24)}")]
        [ProducesResponseType(typeof(Person), 200)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<Person>> Get(string id)
        {
            var person = await _personService.GetAsync(id);

            if (person is null)
            {
                return NotFound();
            }

            return person;
        }

        /// <summary>
        /// Creates a new person.
        /// </summary>
        /// <param name="newPerson">The person to create.</param>
        /// <returns>The created person.</returns>
        /// <response code="201">Returns the newly created person.</response>
        [HttpPost]
        [ProducesResponseType(typeof(Person), 201)]
        public async Task<IActionResult> Post(Person newPerson)
        {
            await _personService.CreateAsync(newPerson);

            return CreatedAtAction(nameof(Get), new { id = newPerson.Id }, newPerson);
        }

        /// <summary>
        /// Updates an existing person.
        /// </summary>
        /// <param name="id">The ID of the person to update.</param>
        /// <param name="updatedPerson">The updated person data.</param>
        /// <response code="204">If the update is successful.</response>
        /// <response code="404">If the person is not found.</response>
        [HttpPut("{id:length(24)}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Update(string id, Person updatedPerson)
        {
            var person = await _personService.GetAsync(id);

            if (person is null)
            {
                return NotFound();
            }

            updatedPerson.Id = person.Id;

            await _personService.UpdateAsync(id, updatedPerson);

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
            var person = await _personService.GetAsync(id);

            if (person is null)
            {
                return NotFound();
            }

            await _personService.RemoveAsync(id);

            return NoContent();
        }
    }
}