using FoTestApi.Domain.Persons.Exceptions;

namespace FoTestApi.Domain.Tests.Persons.Exceptions
{
    public class WeakPasswordExceptionTests
    {
        [Fact]
        public void ConstructorWithoutArgumentsUsesDefaultPrefixedMessage()
        {
            var exception = new WeakPasswordException();

            Assert.Equal("Weak password: Password does not meet security requirements.", exception.Message);
        }

        [Fact]
        public void ConstructorWithMessageUsesPrefixedMessage()
        {
            var exception = new WeakPasswordException("Password must contain a digit.");

            Assert.Equal("Weak password: Password must contain a digit.", exception.Message);
        }

        [Fact]
        public void ConstructorWithMessageAndInnerExceptionPreservesInnerException()
        {
            var innerException = new InvalidOperationException("root cause");

            var exception = new WeakPasswordException("Password is too short.", innerException);

            Assert.Equal("Weak password: Password is too short.", exception.Message);
            Assert.Same(innerException, exception.InnerException);
        }
    }
}
