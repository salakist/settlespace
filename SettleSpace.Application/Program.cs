using System.Text;
using SettleSpace.Application.Authentication;
using SettleSpace.Application.Persons.Mapping;
using SettleSpace.Application.Transactions.Mapping;
using SettleSpace.Application.Authentication.Services;
using SettleSpace.Application.Debts.Mapping;
using SettleSpace.Application.Debts.Services;
using SettleSpace.Application.Persons.Services;
using SettleSpace.Application.Transactions.Services;
using SettleSpace.Application.Middleware;
using SettleSpace.Domain.Persons;
using SettleSpace.Domain.Transactions;
using SettleSpace.Domain.Auth;
using SettleSpace.Domain.Debts.Services;
using SettleSpace.Domain.Persons.Services;
using SettleSpace.Domain.Transactions.Services;
using SettleSpace.Infrastructure;
using SettleSpace.Infrastructure.Persons;
using SettleSpace.Infrastructure.Transactions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text.Json.Serialization;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.Configure<SettleSpaceDatabaseSettings>(
    builder.Configuration.GetSection("SettleSpaceDatabase"));
builder.Services.Configure<AuthSettings>(
    builder.Configuration.GetSection(AuthSettings.SectionName));

var authSettings = builder.Configuration
    .GetSection(AuthSettings.SectionName)
    .Get<AuthSettings>() ?? throw new InvalidOperationException("Auth settings are missing.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = authSettings.Issuer,
            ValidAudience = authSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(authSettings.JwtKey)),
            ClockSkew = TimeSpan.Zero
        };
    });

// Register DDD pattern services
builder.Services.AddScoped<IPersonRepository, PersonRepository>();
builder.Services.AddScoped<ITransactionRepository, TransactionRepository>();
builder.Services.AddScoped<IPersonDomainService, PersonDomainService>();
builder.Services.AddScoped<ITransactionDomainService, TransactionDomainService>();
builder.Services.AddScoped<IPasswordValidator, PasswordValidator>();
builder.Services.AddScoped<IPasswordGenerator, PasswordGenerator>();
builder.Services.AddScoped<IPasswordHashingService, PasswordHashingService>();
builder.Services.AddScoped<IPersonMapper, PersonMapper>();
builder.Services.AddScoped<IPersonDisplayNameResolver, PersonDisplayNameResolver>();
builder.Services.AddScoped<ITransactionMapper, TransactionMapper>();
builder.Services.AddScoped<IDebtMapper, DebtMapper>();
builder.Services.AddScoped<IPersonApplicationService, PersonApplicationService>();
builder.Services.AddScoped<ITransactionApplicationService, TransactionApplicationService>();
builder.Services.AddScoped<IDebtApplicationService, DebtApplicationService>();
builder.Services.AddScoped<IDebtDomainService, DebtDomainService>();
builder.Services.AddScoped<IAuthService, AuthService>();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddRouting(options => options.LowercaseUrls = true);
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    c.IncludeXmlComments(xmlPath);
});

var app = builder.Build();

// Register exception handling middleware (must be early in the pipeline)
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

await app.RunAsync();

