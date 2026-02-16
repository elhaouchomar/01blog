# 01Blog

Full-stack blogging platform with an Angular frontend and a Spring Boot backend.

## Tech Stack
- Frontend: Angular 21, TypeScript, Angular Material, Bootstrap
- Backend: Spring Boot 2.7, Spring Security, JWT, JPA/Hibernate
- Database: PostgreSQL (default via environment variables)

## Repository Structure
- `frontend/` Angular application
- `backend/` Spring Boot API

## Prerequisites
- Node.js 18+
- npm 11+
- Java 17+

## Run Locally
1. Start backend
```bash
cd backend
./mvnw spring-boot:run
```
Backend URL: `http://localhost:8080`

2. Start frontend
```bash
cd frontend
npm install
npm start
```
Frontend URL: `http://localhost:4200`

## API Base
All backend routes are under `http://localhost:8080/api`.

### Main Endpoint Groups
- Auth: `/api/auth/*`
- Users: `/api/users/*`
- Posts: `/api/posts/*`
- Reports: `/api/reports/*`
- Notifications: `/api/notifications/*`
- Dashboard (admin): `/api/dashboard/*`
- Search: `/api/search`

## Security Notes
- JWT is issued as an `HttpOnly` cookie.
- CSRF protection is enabled for state-changing requests.
- Role-based access control is enforced for admin routes.
- Passwords are hashed with BCrypt.

## Additional Setup Guides
- `backend/README.md`
- `frontend/README.md`
