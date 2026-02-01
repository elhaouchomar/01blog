# 01Blog Backend - Getting Started

## Prerequisites
- Java 11 or higher
- Maven 3.6+
- IDE (IntelliJ IDEA, Eclipse, or VS Code with Java extensions)

## Quick Start

### 1. Clone and Navigate
```bash
cd backend
```

### 2. Build the Project
```bash
./mvnw clean install
```

### 3. Run the Application
```bash
./mvnw spring-boot:run
```

The API will be available at: `http://localhost:8080`

## Configuration

### Database
By default, the application uses **H2 database** (file-based) for easy development:
- Database file: `./blogdb.mv.db`
- Console: `http://localhost:8080/h2-console` (if enabled)

### Environment Variables
Create `application-dev.properties` for local development:
```properties
# JWT Configuration
jwt.secret=your-super-secret-key-change-this-in-production
jwt.expiration=86400000

# Database
spring.datasource.url=jdbc:h2:file:./blogdb
spring.jpa.hibernate.ddl-auto=update

# File Upload
file.upload-dir=./uploads
spring.servlet.multipart.max-file-size=10MB
```

## API Testing

### Sample Requests

#### 1. Register a New User
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

#### 2. Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER"
  }
}
```

#### 3. Get Current User (Authenticated)
```bash
curl -X GET http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 4. Create a Post
```bash
curl -X POST http://localhost:8080/api/v1/posts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Post",
    "content": "This is the content of my first blog post!"
  }'
```

## Development Workflow

### Hot Reload
Spring Boot DevTools is enabled for automatic restart during development.

### Testing
```bash
# Run all tests
./mvnw test

# Run specific test
./mvnw test -Dtest=UserServiceTest
```

### Logging
Adjust logging levels in `application.properties`:
```properties
logging.level.com.blog._blog=DEBUG
logging.level.org.springframework.security=DEBUG
```

## Common Issues

### Port Already in Use
Change the port in `application.properties`:
```properties
server.port=8081
```

### Database Locked
Stop all running instances of the application before restarting.

### JWT Token Issues
Ensure the `jwt.secret` is configured and matches between requests.

## Production Deployment

### Build for Production
```bash
./mvnw clean package -DskipTests
```

The JAR file will be in `target/01blog-0.0.1-SNAPSHOT.jar`

### Run Production Build
```bash
java -jar target/01blog-0.0.1-SNAPSHOT.jar
```

### Environment-Specific Configuration
Create `application-prod.properties`:
```properties
# Production Database (PostgreSQL)
spring.datasource.url=jdbc:postgresql://localhost:5432/blogdb
spring.datasource.username=dbuser
spring.datasource.password=dbpassword

# Security
jwt.secret=${JWT_SECRET}

# Hibernate
spring.jpa.hibernate.ddl-auto=validate
```

Run with profile:
```bash
java -jar target/01blog-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

## Default Credentials (Development Only)

After running for the first time, the `DataSeeder` creates:

- **Admin User**
  - Email: `admin@blog.com`
  - Password: `admin123`
  
- **Regular User**
  - Email: `user@blog.com`
  - Password: `user123`

**⚠️ Change these immediately in production!**

## API Documentation

For detailed API documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md)

### API Versioning
All endpoints are prefixed with `/api/v1/`

### Error Response Format
```json
{
  "status": 400,
  "message": "Validation error",
  "errors": {
    "email": "Email already exists"
  }
}
```

## Database Management

### View Database Console (H2)
Add to `application.properties`:
```properties
spring.h2.console.enabled=true
```

Access at: `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:file:./blogdb`
- Username: `sa`
- Password: (leave blank)

### Reset Database
Delete the `blogdb.mv.db` file and restart the application.

## Contributing

1. Follow the package structure defined in ARCHITECTURE.md
2. Write tests for new features
3. Use meaningful commit messages
4. Keep DTOs separate from entities
5. Handle exceptions properly

## Project Structure
```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/blog/_blog/
│   │   │   ├── config/        # Configuration
│   │   │   ├── controller/    # REST Controllers
│   │   │   ├── service/       # Business Logic
│   │   │   ├── repository/    # Data Access
│   │   │   ├── entity/        # Domain Models
│   │   │   ├── dto/           # Data Transfer Objects
│   │   │   ├── exception/     # Custom Exceptions
│   │   │   ├── security/      # Security Components
│   │   │   └── util/          # Utilities
│   │   └── resources/
│   │       └── application.properties
│   └── test/
├── pom.xml
├── ARCHITECTURE.md
└── README.md
```

## Troubleshooting

### Maven Build Issues
```bash
./mvnw clean install -U
```

### Lombok Not Working
Ensure Lombok plugin is installed in your IDE and annotation processing is enabled.

### CORS Errors
Configure CORS in `WebConfig.java` to allow your frontend origin.

## Support
For architecture questions, see [ARCHITECTURE.md](./ARCHITECTURE.md)
