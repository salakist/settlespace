namespace FoTestApi.Domain.Persons.Entities
{
    public enum PersonRole
    {
        ADMIN,
        USER,
        MANAGER,
    }

    public static class PersonRoleExtensions
    {
        public static bool IsStaffRole(this PersonRole role)
        {
            return role is PersonRole.ADMIN or PersonRole.MANAGER;
        }
    }
}