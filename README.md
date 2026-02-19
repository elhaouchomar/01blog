# 01Blog

A full-stack blogging and social platform built with Angular + Spring Boot.

## Subject

01Blog is a community-style blog application where users can:
- publish posts with media,
- interact through likes/comments/follows,
- receive in-app notifications,
- report harmful content,
- and (for admins) moderate users/posts from a dedicated dashboard.

The project combines a modern SPA frontend with a secure REST API backend and PostgreSQL persistence.

## Core Functionality

### User Features
- Authentication with register, login, logout.
- Personal and public profiles (`/profile`, `/profile/:id`).
- Create, edit, delete, hide/unhide posts.
- Upload image/video attachments for posts.
- Post and comment likes.
- Comment creation and deletion.
- Follow/unfollow other users.
- Search users and posts.
- Notification center (mark single/all as read).

### Moderation / Admin Features
- Admin-only dashboard pages:
  - overview stats,
  - post management,
  - user management,
  - reports management.
- Ban/unban users.
- Delete users.
- Provision users from admin panel.
- Review reports and update report status.
- View platform stats: totals, pending reports, activity, most reported users.

### Security and Hardening
- JWT auth with token stored in `HttpOnly` cookie (`auth_token`).
- CSRF protection with cookie token (`XSRF-TOKEN`) and `X-XSRF-TOKEN` header on unsafe methods.
- Spring Security with role-based protection (`ADMIN` routes).
- Request rate limiting (write-focused) on:
  - `/api/auth/**`
  - `/api/posts/**`
  - `/api/reports/**`
- Server-side validation/sanitization for auth, posts, comments, reports, and profile updates.
- Media upload validation (extension + declared MIME + content-sniffed MIME via Apache Tika + size limit).

## Tech Stack

- Frontend: Angular 21, TypeScript, Angular Material, Bootstrap
- Backend: Spring Boot 2.7, Spring Security, Spring Data JPA, JWT (jjwt), JSoup, Apache Tika
- Database: PostgreSQL 16
- Containers: Docker, Docker Compose

## Architecture

- `frontend/`: Angular SPA (route guards, HTTP interceptor, signals-based state service)
- `backend/`: Spring Boot REST API (auth, posts, users, notifications, reports, dashboard)
- `docker-compose.yml`: local orchestration for DB + backend + frontend

## Quick Start (Docker)

From repo root:

```bash
docker compose up --build
```

Services:
- Frontend: `http://localhost:4200`
- Backend API: `http://localhost:8080/api`
- PostgreSQL: `localhost:5433` (container `5432`)

### Docker Compose Usage

```bash
# Start all services (foreground)
docker compose up --build

# Start all services (background)
docker compose up -d --build

# Stop services
docker compose down

# Stop and remove volumes (resets DB data)
docker compose down -v

# Rebuild and restart a single service
docker compose build backend
docker compose up -d backend

# Logs
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

## Usage

1. Open `http://localhost:4200`.
2. Register a new account (or login with an existing user).
3. Go to **Network** and subscribe/follow users.
4. Go to **Home** to view your feed.
   - Normal users only see posts from users they follow (plus their own posts).
   - Admin users can see all posts.
5. Create posts, like/comment, follow/unfollow, and report content as needed.
6. If your account is banned, the app shows a single restriction message and signs you out.

## Local Development Setup

### Prerequisites
- Java 17+
- Node.js + npm
- PostgreSQL (local or Docker)

### 1. Start PostgreSQL

Create/use a DB matching backend defaults:
- database: `blogdb`
- username: `bloguser`
- password: `blogpass`

Or run only DB with compose:

```bash
docker compose up -d db
```

### 2. Run Backend

```bash
cd backend
./mvnw spring-boot:run
```

Backend runs on `http://localhost:8080`.

Optional (enable seed/mock data):

```bash
cd backend
SPRING_SQL_INIT_MODE=always ./mvnw spring-boot:run
```

### 3. Run Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:4200`.

## Backend Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/blogdb` | PostgreSQL JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | `bloguser` | DB username |
| `SPRING_DATASOURCE_PASSWORD` | `blogpass` | DB password |
| `SPRING_SQL_INIT_MODE` | `never` | Set `always` to run `data.sql` seed data |
| `JWT_SECRET` | built-in local fallback | Base64-encoded JWT signing key (set your own in production) |
| `JWT_EXPIRATION_MS` | `86400000` | Token validity duration |
| `APP_AUTH_COOKIE_SECURE` | `true` | Use `false` in non-HTTPS local dev |
| `FILE_UPLOAD_DIR` | `uploads` | Upload storage directory |
| `FILE_UPLOAD_MAX_SIZE_BYTES` | `10485760` | Max upload size (10 MB) |

## Seed Data

When `SPRING_SQL_INIT_MODE=always`, the backend seeds mock users/posts/comments/likes/follows from `backend/src/main/resources/data.sql`.

## API Route Overview

- Auth: `/api/auth/*`
- Posts & comments: `/api/posts/*`
- Users/profile/follow: `/api/users/*`
- Notifications: `/api/notifications/*`
- Reports: `/api/reports/*`
- Admin dashboard stats: `/api/dashboard/stats`
- Search: `/api/search`
- Uploaded media static serving: `/uploads/*`

## Development Commands

### Backend

```bash
cd backend
./mvnw test
./mvnw package
```

### Frontend

```bash
cd frontend
npm run build
npm test
```

## Project Structure

```text
01-blog/
├── backend/
│   ├── src/main/java/com/blog/_blog/
│   │   ├── config/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── entity/
│   │   └── security/
│   └── src/main/resources/
├── frontend/
│   └── src/app/
│       ├── pages/
│       ├── components/
│       ├── core/
│       ├── layout/
│       └── shared/
└── docker-compose.yml
```

## Notes

- This project is configured for localhost development CORS (`http://localhost:*`, `http://127.0.0.1:*`).
- Keep `JWT_SECRET` private in non-dev environments.
- For production, run with HTTPS and set `APP_AUTH_COOKIE_SECURE=true`.
