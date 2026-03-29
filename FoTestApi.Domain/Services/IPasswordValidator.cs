namespace FoTestApi.Domain.Services
{
    public interface IPasswordValidator
    {
        void Validate(string? password);
    }
}