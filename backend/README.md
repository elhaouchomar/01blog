# Backend (Spring Boot)

## Requirements
- Java 17+

## Run
```bash
./mvnw spring-boot:run
```

API base URL: `http://localhost:8080/api`

## Configuration
Key properties are in `src/main/resources/application.properties`.

- `spring.datasource.*` database connection
- `jwt.secret` JWT signing key
- `jwt.expiration-ms` token expiry
- `app.auth.cookie-secure` cookie secure flag
- `file.upload.max-size-bytes` upload size limit

## Security
- Spring Security + JWT authentication
- JWT transported in `HttpOnly` cookie (`auth_token`)
- CSRF token cookie (`XSRF-TOKEN`) for mutating requests
- BCrypt password hashing
- Method-level admin authorization on protected routes

## Build / Test
```bash
./mvnw test
./mvnw package
```
