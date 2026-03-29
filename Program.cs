using FoTestApi.Services;
using FoTestApi;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.Configure<FoTestDatabaseSettings>(
    builder.Configuration.GetSection("FoTestDatabase"));

builder.Services.AddSingleton<PersonService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
