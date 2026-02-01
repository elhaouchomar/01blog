# 01Blog Backend Architecture

## Overview
This is a Spring Boot REST API for a blogging platform with social features. The application follows a **layered architecture** pattern with clear separation of concerns.

## Technology Stack
- **Framework**: Spring Boot 2.7.18
- **Language**: Java 11
- **Database**: H2 (development) / PostgreSQL (production-ready)
- **Security**: Spring Security + JWT Authentication
- **ORM**: Spring Data JPA
- **Validation**: Hibernate Validator
- **Build Tool**: Maven

## Project Structure

```
com.blog._blog/
├── Application.java                 # Main Spring Boot application entry point
│
├── config/                          # Configuration classes
│   ├── ApplicationConfig.java       # Application-wide beans (PasswordEncoder, etc.)
│   ├── SecurityConfiguration.java   # Spring Security configuration
│   ├── JwtAuthenticationFilter.java # JWT token validation filter
│   ├── WebConfig.java              # CORS and web-related configurations
│   ├── RateLimiterInterceptor.java # Rate limiting for API requests
│   └── DataSeeder.java             # Database initialization with sample data
│
├── controller/                      # REST API endpoints (Presentation Layer)
│   ├── AuthenticationController.java  # /api/v1/auth/** - Login, register
│   ├── UserController.java           # /api/v1/users/** - User management
│   ├── PostController.java           # /api/v1/posts/** - Post CRUD operations
│   ├── NotificationController.java   # /api/v1/notifications/** - Notifications
│   ├── ReportController.java         # /api/v1/reports/** - Content reporting
│   ├── SearchController.java         # /api/v1/search/** - Search functionality
│   └── DashboardController.java      # /api/v1/dashboard/** - Admin dashboard
│
├── service/                         # Business logic layer
│   ├── AuthenticationService.java    # Authentication & token management
│   ├── UserService.java             # User operations & following
│   ├── PostService.java             # Post CRUD & interactions (likes, comments)
│   ├── NotificationService.java     # Notification creation & management
│   ├── ReportService.java           # Report handling
│   ├── SearchService.java           # Search across posts & users
│   ├── DashboardService.java        # Admin analytics & stats
│   └── FileStorageService.java      # File upload handling (images, media)
│
├── repository/                      # Data access layer (JPA Repositories)
│   ├── UserRepository.java          # User database queries
│   ├── PostRepository.java          # Post database queries
│   ├── CommentRepository.java       # Comment database queries
│   ├── NotificationRepository.java  # Notification database queries
│   └── ReportRepository.java        # Report database queries
│
├── entity/                          # Domain models (JPA entities)
│   ├── User.java                    # User entity with authentication details
│   ├── Post.java                    # Blog post entity
│   ├── Comment.java                 # Comment entity
│   ├── Notification.java            # Notification entity
│   ├── Report.java                  # Content report entity
│   ├── Role.java                    # User role enum (USER, ADMIN)
│   └── NotificationType.java        # Notification type enum
│
├── dto/                             # Data Transfer Objects (API contracts)
│   ├── AuthenticationRequest.java   # Login request
│   ├── AuthenticationResponse.java  # Login/register response with JWT
│   ├── RegisterRequest.java         # Registration request
│   ├── UserDTO.java                 # User response
│   ├── UserSummaryDTO.java          # Minimal user info
│   ├── PostDTO.java                 # Post response with relationships
│   ├── CreatePostRequest.java       # Post creation request
│   ├── CommentDTO.java              # Comment response
│   ├── CreateCommentRequest.java    # Comment creation request
│   ├── NotificationDTO.java         # Notification response
│   ├── ReportDTO.java               # Report response
│   ├── ReportedUserDTO.java         # Reported user info
│   ├── CreateReportRequest.java     # Report creation request
│   ├── DashboardStatsDTO.java       # Admin dashboard statistics
│   └── PlatformActivityDTO.java     # Platform activity metrics
│
├── exception/                       # Custom exceptions & error handling
│   ├── GlobalExceptionHandler.java  # Centralized exception handler (@ControllerAdvice)
│   ├── UserNotFoundException.java
│   ├── PostNotFoundException.java
│   ├── UnauthorizedActionException.java
│   ├── UserAlreadyExistsException.java
│   ├── InvalidPostTitleException.java
│   ├── InvalidPostContentException.java
│   ├── FileValidationException.java
│   ├── SelfFollowException.java
│   ├── AlreadyFollowingException.java
│   ├── NotFollowingException.java
│   ├── SelfReportException.java
│   ├── DuplicateReportException.java
│   └── ReportNotFoundException.java
│
├── security/                        # Security utilities
│   └── JwtService.java             # JWT token generation & validation
│
└── util/                           # Utility classes
    ├── FileValidator.java          # File upload validation
    └── TimeAgo.java                # Time formatting utilities
```

## Architecture Layers

### 1. **Presentation Layer (Controllers)**
- Handles HTTP requests/responses
- Validates input using `@Valid` and `@RequestBody`
- Delegates business logic to services
- Returns DTOs (never entities)
- Handles API versioning (`/api/v1/`)

### 2. **Business Logic Layer (Services)**
- Contains core application logic
- Enforces business rules and validations
- Manages transactions with `@Transactional`
- Coordinates between multiple repositories
- Converts entities to DTOs

### 3. **Data Access Layer (Repositories)**
- Extends `JpaRepository` for database operations
- Custom queries using `@Query` annotations
- Method name query derivation
- Returns entities (not DTOs)

### 4. **Domain Layer (Entities)**
- JPA entities mapping to database tables
- Contains entity relationships (`@OneToMany`, `@ManyToOne`, etc.)
- Uses Lombok annotations for boilerplate reduction
- Includes validation annotations

## Key Design Patterns

### 1. **DTO Pattern**
- Separates external API representation from internal domain model
- Prevents over-fetching and circular reference issues
- Provides API versioning flexibility

### 2. **Repository Pattern**
- Abstracts data access logic
- Provides clean separation from business logic

### 3. **Dependency Injection**
- Constructor-based injection (recommended)
- Promotes testability and loose coupling

### 4. **Exception Handling Strategy**
- Custom exceptions for domain-specific errors
- Global exception handler for consistent error responses
- Proper HTTP status codes

## Security Architecture

### Authentication Flow
1. User sends credentials to `/api/v1/auth/login`
2. `AuthenticationService` validates credentials
3. JWT token generated and returned
4. Client includes token in `Authorization: Bearer <token>` header
5. `JwtAuthenticationFilter` validates token for protected endpoints
6. Spring Security context populated with user details

### Authorization
- Role-based access control (ADMIN, USER)
- Method-level security with `@PreAuthorize`
- Resource ownership validation in services

## API Endpoints Summary

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login

### Users
- `GET /api/v1/users/me` - Get current user
- `GET /api/v1/users/{id}` - Get user by ID
- `GET /api/v1/users/suggestions` - Get user suggestions
- `POST /api/v1/users/{id}/follow` - Follow/unfollow user
- `PUT /api/v1/users/{id}/ban` - Ban/unban user (ADMIN)
- `DELETE /api/v1/users/{id}` - Delete user (ADMIN)

### Posts
- `GET /api/v1/posts` - Get all posts (paginated)
- `GET /api/v1/posts/{id}` - Get single post
- `POST /api/v1/posts` - Create post
- `PUT /api/v1/posts/{id}` - Update post
- `DELETE /api/v1/posts/{id}` - Delete post
- `POST /api/v1/posts/{id}/like` - Toggle like
- `POST /api/v1/posts/{id}/comments` - Add comment
- `PUT /api/v1/posts/{id}/visibility` - Toggle visibility (ADMIN)

### Notifications
- `GET /api/v1/notifications` - Get user notifications
- `PUT /api/v1/notifications/{id}/read` - Mark as read
- `PUT /api/v1/notifications/read-all` - Mark all as read

### Reports
- `GET /api/v1/reports` - Get all reports (ADMIN)
- `POST /api/v1/reports` - Create report
- `PUT /api/v1/reports/{id}/resolve` - Resolve report (ADMIN)

### Search
- `GET /api/v1/search?q={query}` - Search posts and users

### Dashboard (ADMIN)
- `GET /api/v1/dashboard/stats` - Get platform statistics

## Database Schema

### Core Tables
- **users**: User accounts and authentication
- **posts**: Blog posts with content and metadata
- **comments**: Comments on posts
- **notifications**: User notifications
- **reports**: Content/user reports
- **user_followers**: Many-to-many relationship for following

### Key Relationships
- User → Posts (One-to-Many)
- User → Comments (One-to-Many)
- Post → Comments (One-to-Many)
- User → Notifications (One-to-Many)
- User ↔ User (Many-to-Many followers)

## Best Practices Implemented

### Code Organization
✅ Clear package structure by layer
✅ Single Responsibility Principle
✅ Meaningful naming conventions
✅ Consistent code style

### Security
✅ Password hashing with BCrypt
✅ JWT token-based authentication
✅ Input validation
✅ SQL injection prevention (JPA)
✅ CORS configuration

### Data Handling
✅ DTO pattern for API responses
✅ Entity validation
✅ Null safety checks
✅ Transaction management

### Error Handling
✅ Global exception handler
✅ Custom domain exceptions
✅ Meaningful error messages
✅ Proper HTTP status codes

## Configuration Files

### application.properties / application.yml
```properties
# Database configuration
spring.datasource.url=jdbc:h2:file:./blogdb
spring.jpa.hibernate.ddl-auto=update

# JWT configuration
jwt.secret=your-secret-key
jwt.expiration=86400000

# File upload
spring.servlet.multipart.max-file-size=10MB
```

## Testing Strategy
- Unit tests for services (business logic)
- Integration tests for repositories
- Controller tests with MockMvc
- Security tests for authentication

## Future Enhancements
- [ ] Caching with Redis
- [ ] Message queue for async operations (notifications)
- [ ] API rate limiting per user
- [ ] File storage with S3/CDN
- [ ] Full-text search with Elasticsearch
- [ ] Metrics and monitoring (Actuator + Prometheus)
- [ ] API documentation (Swagger/OpenAPI)

## Development Guidelines

### Adding a New Feature
1. Create/update entity if needed
2. Create repository interface
3. Implement service with business logic
4. Create DTOs for request/response
5. Create controller endpoints
6. Add custom exceptions if needed
7. Update tests

### Code Review Checklist
- [ ] Follows package structure
- [ ] Proper exception handling
- [ ] Input validation
- [ ] Security considerations
- [ ] Transaction boundaries correct
- [ ] DTOs used instead of entities
- [ ] Tests included
- [ ] No hardcoded values

## Contact & Support
For questions about the architecture, refer to this document or contact the development team.
