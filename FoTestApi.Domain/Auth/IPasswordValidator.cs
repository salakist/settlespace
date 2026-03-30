namespace FoTestApi.Domain.Auth
{
    public interface IPasswordValidator
    {
        void Validate(string? password);
    }
}
