# URL Shortener - Ommax Interview Project

A microservice-based URL shortener application built with Symfony (backend) and React and Vite (frontend). This project demonstrates REST API development, clean code practices, and modern web development architecture.

## Features

### Backend API (Symfony)
- Shorten any valid URL
- Deterministic short codes (same URL = same code)
- Track click counts for shortened URLs
- Get statistics for shortened URLs
- List all shortened URLs with pagination
- RESTful API design with OpenAPI documentation
- Unit and integration tests
- CORS support for frontend consumption

### Frontend SPA (React + TypeScript)
- Form to enter and shorten URLs
- Display shortened URLs with copy functionality
- List all shortened URLs with click counts
- Pagination for large datasets
- Responsive design with Tailwind CSS
- Real-time updates after shortening URLs

## Architecture

### Microservice Design
This application follows microservice principles:
- **Single Responsibility**: Focused solely on URL shortening
- **Independent Deployment**: Backend and frontend can be deployed separately
- **API-First**: RESTful API as the primary interface
- **Stateless**: No server-side session management
- **Scalable**: Can be horizontally scaled as needed

### Technology Stack

**Backend:**
- PHP 8.4
- Symfony 7.3
- PostgreSQL 13
- Doctrine ORM
- Nelmio API Doc (Swagger UI)
- Nelmio CORS Bundle
- PHPUnit for testing

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ and npm (for frontend development)
- Make (recommended, for easy commands)

### Automated Setup (Recommended)

**Run the setup script:**
```bash
chmod +x setup.sh
./setup.sh
```

This will:
1. Check prerequisites (Docker, Make)
2. Start Docker containers (PHP, PostgreSQL, Nginx)
3. Install backend dependencies (Composer)
4. Create database and run migrations
5. Install frontend dependencies (npm)
5. **Start the frontend development server automatically**

**Access the application:**
- Frontend: http://localhost:5176
- Backend API: http://localhost:8080
- API Docs: http://localhost:8080/api/doc

**To stop all services:**
```bash
make stop-all
```

### Manual Setup

#### Backend (runs in Docker)

1. **Start Docker containers:**
```bash
make up
# or
docker compose up -d
```

2. **Install dependencies (in Docker):**
```bash
make composer-install
# or
docker compose exec php composer install
```

3. **Create database (in Docker):**
```bash
make db-create
# or
docker compose exec php php bin/console doctrine:database:create
docker compose exec php php bin/console doctrine:migrations:migrate
```

Backend will be available at: `http://localhost:8080`

#### Frontend Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Configure API URL:**
Edit `frontend/.env`:
```
VITE_API_URL=http://localhost:8080/api
```

3. **Start development server:**
```bash
npm run dev
# or
make frontend-dev
```

The frontend will be available at: `http://localhost:5176`

## API Documentation

### Swagger UI
Access interactive API documentation at:
```
http://localhost:8080/api/doc
```

### API Endpoints

#### 1. Shorten URL
```http
POST /api/urls/shorten
Content-Type: application/json

{
  "url": "https://www.example.com/very-long-url"
}
```

**Response:**
```json
{
  "originalUrl": "https://www.example.com/very-long-url",
  "shortCode": "a1b2c3d4",
  "shortUrl": "http://localhost:8080/api/urls/a1b2c3d4",
  "clicks": 0,
  "createdAt": "2025-11-25T12:00:00+00:00"
}
```

#### 2. Resolve Short URL
```http
GET /api/urls/{shortCode}
```

Returns the original URL and increments click count.

#### 3. Get URL Statistics
```http
GET /api/urls/{shortCode}/stats
```

Returns statistics without incrementing clicks.

#### 4. List All URLs
```http
GET /api/urls?page=1&limit=10
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

## Testing

### Run All Tests
```bash
cd symfony
php bin/phpunit
```

### Run Specific Test Suite
```bash
# Service tests
php bin/phpunit tests/Service/

# Controller tests
php bin/phpunit tests/Controller/
```

### Test Database
Tests automatically use a separate test database configured in `.env.test`.

## Clean Code Practices

This project demonstrates:

1. **SOLID Principles**
   - Single Responsibility: Each class has one clear purpose
   - Dependency Injection: Services injected via constructor
   - Interface Segregation: Small, focused interfaces

2. **Clean Architecture**
   - Domain logic separated from infrastructure
   - Repository pattern for data access
   - Service layer for business logic
   - Controller as thin presentation layer

3. **Code Quality**
   - Type hints and return types
   - Comprehensive error handling
   - Custom exceptions for domain errors
   - Validation at entry points
   - Unit and integration testing

4. **Best Practices**
   - RESTful API design
   - API versioning ready
   - Documentation with OpenAPI
   - Environment-based configuration
   - Database migrations for schema management

## Database Schema

```
short_urls
├── id (PK)
├── original_url (unique)
├── short_code (unique, indexed)
├── clicks (default: 0)
└── created_at
```

## Make Commands

```bash
make up              # Start containers
make down            # Stop containers
make shell           # Enter PHP container
make composer-install # Install PHP dependencies
make symfony-console # Run Symfony console
make db-create       # Create database
make test-db-create  # Create test database
make fixtures-load   # Load fixtures
make serve           # Start Symfony Server
```

## Production Checklist

Some things to consider before deploying this:

- **Rate limiting** - prevent abuse (Symfony has a rate limiter component)
- **Caching** - Redis for frequently accessed URLs
- **Monitoring** - track response times and error rates
- **Database** - read replicas if traffic gets high
- **Backups** - automated daily backups with retention policy
- **CDN** - serve frontend through CloudFlare or similar

## Architecture Notes

### Why Microservice Architecture?
This project is built as a focused service handling only URL shortening. Each component (frontend, backend, database) can scale independently, which is useful for production deployments.

### API Design
Using REST keeps things simple - standard HTTP methods, JSON responses, easy to consume from any client. The OpenAPI docs at `/api/doc` make it easy to test endpoints.

### Code Organization
Followed SOLID principles where it made sense:
- Separated concerns (Controller → Service → Repository)
- Dependency injection for flexibility
- Type hints everywhere for better IDE support and fewer bugs
- Tests cover the critical paths

## License

MIT License - Feel free to use this project as reference.
