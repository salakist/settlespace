# FoTest API

A RESTful CRUD API for managing a collection of persons, built as a demonstration project to showcase full-stack development from scratch.

## Purpose

This API provides a simple yet complete example of building a modern web API with:
- RESTful endpoints for Create, Read, Update, Delete operations
- MongoDB database integration
- Comprehensive documentation with Swagger/OpenAPI
- Clean architecture with separation of concerns
- Search functionality for persons by name

## Tech Stack

- **Framework:** ASP.NET Core 8.0 (Web API)
- **Language:** C# 12
- **Database:** MongoDB (local instance)
- **Documentation:** Swagger/OpenAPI
- **Build Tool:** .NET CLI
- **IDE:** Visual Studio Code / Visual Studio

## Prerequisites

- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) (running locally on `localhost:27017`)
- [GitHub CLI](https://cli.github.com/) (optional, for repository management)

## Project Structure

```
fo-test/
├── fo-test.sln                 # Solution file
├── FoTestApi/                  # Main API project
│   ├── Controllers/            # API controllers
│   │   └── PersonsController.cs
│   ├── Models/                 # Data models
│   │   ├── Person.cs
│   │   └── FoTestDatabaseSettings.cs
│   ├── Services/               # Business logic services
│   │   └── PersonService.cs
│   ├── appsettings.json        # Configuration
│   ├── FoTestApi.csproj        # Project file
│   ├── Program.cs              # Application entry point
│   └── fo-test.http            # HTTP test file
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/salakist/fo-test.git
cd fo-test
```

### 2. Database Setup

Ensure MongoDB is running locally:

```bash
# Start MongoDB (Windows Service or manually)
mongod --dbpath "C:\data\db"  # Adjust path as needed
```

The API will automatically create the `fo-test` database and `persons` collection on first use.

### 3. Build the Solution

```bash
dotnet build
```

### 4. Run the API

```bash
dotnet run --project FoTestApi\FoTestApi.csproj
```

The API will start on `http://localhost:5279` (or next available port).

## API Documentation

### Base URL
```
http://localhost:5279/api
```

### Endpoints

#### Persons Management

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/persons` | Get all persons | - | `200 OK` - Array of persons |
| GET | `/persons/{id}` | Get person by ID | - | `200 OK` - Person object<br>`404 Not Found` |
| POST | `/persons` | Create new person | Person JSON | `201 Created` - Created person |
| PUT | `/persons/{id}` | Update person | Person JSON | `204 No Content`<br>`404 Not Found` |
| DELETE | `/persons/{id}` | Delete person | - | `204 No Content`<br>`404 Not Found` |
| GET | `/persons/search/{query}` | Search persons by name | - | `200 OK` - Array of matching persons |

#### Person Model

```json
{
  "id": "string",           // MongoDB ObjectId (auto-generated)
  "firstName": "string",    // Required
  "lastName": "string"      // Required
}
```

#### Search Functionality

The search endpoint `/api/persons/search/{query}` returns all persons where:
- `firstName` equals the query string, OR
- `lastName` equals the query string

Example: `GET /api/persons/search/John` returns persons named "John" (first or last name).

## Testing the API

### Using Swagger UI

Navigate to `http://localhost:5279/swagger` for interactive API documentation and testing.

### Using HTTP Test File

The project includes `fo-test.http` with sample requests. Open it in VS Code with REST Client extension.

### Manual Testing Examples

```bash
# Get all persons
curl -X GET "http://localhost:5279/api/persons"

# Create a person
curl -X POST "http://localhost:5279/api/persons" \
     -H "Content-Type: application/json" \
     -d '{"firstName":"John","lastName":"Doe"}'

# Search persons
curl -X GET "http://localhost:5279/api/persons/search/John"
```

## Configuration

Database settings are configured in `appsettings.json`:

```json
{
  "FoTestDatabase": {
    "ConnectionString": "mongodb://localhost:27017",
    "DatabaseName": "fo-test",
    "PersonsCollectionName": "persons"
  }
}
```

## Development

### Adding New Features

1. Update models in `Models/` folder
2. Add business logic in `Services/` folder
3. Create/update controllers in `Controllers/` folder
4. Update this README with new endpoints

### Running Tests

```bash
dotnet test
```

(Note: Unit tests not implemented in this demo project)

## Deployment

This is a development/demo project. For production deployment:

1. Configure production MongoDB connection
2. Set up HTTPS certificates
3. Configure logging and monitoring
4. Use environment variables for sensitive configuration
5. Deploy to cloud platform (Azure, AWS, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational purposes. Feel free to use and modify as needed.

## Contact

For questions or issues, please open a GitHub issue in this repository.