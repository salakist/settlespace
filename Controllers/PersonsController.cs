using FoTestApi.Models;
using FoTestApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace FoTestApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PersonsController : ControllerBase
    {
        private readonly PersonService _personService;

        public PersonsController(PersonService personService) =>
            _personService = personService;

        [HttpGet]
        public async Task<List<Person>> Get() =>
            await _personService.GetAsync();

        [HttpGet("{id:length(24)}")]
        public async Task<ActionResult<Person>> Get(string id)
        {
            var person = await _personService.GetAsync(id);

            if (person is null)
            {
                return NotFound();
            }

            return person;
        }

        [HttpPost]
        public async Task<IActionResult> Post(Person newPerson)
        {
            await _personService.CreateAsync(newPerson);

            return CreatedAtAction(nameof(Get), new { id = newPerson.Id }, newPerson);
        }

        [HttpPut("{id:length(24)}")]
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

        [HttpDelete("{id:length(24)}")]
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