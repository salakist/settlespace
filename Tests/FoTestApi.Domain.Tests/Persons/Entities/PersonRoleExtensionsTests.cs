using FoTestApi.Domain.Persons.Entities;

namespace FoTestApi.Domain.Tests.Persons.Entities;

public class PersonRoleExtensionsTests
{
    [Theory]
    [InlineData(PersonRole.ADMIN)]
    [InlineData(PersonRole.MANAGER)]
    public void IsStaffRoleReturnsTrueForAdminAndManager(PersonRole role)
    {
        Assert.True(role.IsStaffRole());
    }

    [Fact]
    public void IsStaffRoleReturnsFalseForUser()
    {
        Assert.False(PersonRole.USER.IsStaffRole());
    }
}