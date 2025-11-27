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

## Production Considerations

### Security
- **Rate Limiting**: Implement per-IP rate limits (e.g., 100 requests/hour) to prevent abuse
  - Consider using Symfony Rate Limiter component or API Gateway
  - Example: `composer require symfony/rate-limiter`
- **API Authentication**: Add JWT or OAuth2 for protected endpoints
- **Input Sanitization**: Already implemented with URL validation
- **DDoS Protection**: Use CloudFlare or AWS Shield

### Performance
- **Caching**: Cache frequent lookups with Redis
  ```yaml
  # config/packages/cache.yaml
  framework:
      cache:
          app: cache.adapter.redis
          default_redis_provider: redis://localhost
  ```
- **Database Optimization**:
  - Add composite indexes for common queries
  - Use read replicas for scaling
  - Consider PostgreSQL connection pooling (PgBouncer)
- **CDN**: Serve frontend static files through CDN (CloudFront, CloudFlare)

### Scalability
- **Horizontal Scaling**: Deploy multiple API instances behind load balancer
- **Database**: Master-slave replication for read-heavy workloads
- **Short Code Collision**: Current MD5 approach is deterministic; consider adding retry logic for rare collisions

### Monitoring & Observability
- **Logging**: Use Monolog with ELK stack or Datadog
- **Metrics**: Track API response times, error rates, top URLs
- **Alerting**: Set up alerts for high error rates or slow responses
- **Health Checks**: Add `/health` endpoint for load balancer monitoring

### Deployment
- **Environment Variables**: Use `.env.example` as template
- **Database Migrations**: Always run before deployment
- **Zero-Downtime**: Use blue-green or rolling deployments
- **Backup Strategy**: Automated daily database backups with point-in-time recovery

## 📖 Additional Questions Answered

### What is a Microservice?
A microservice is an architectural style where an application is composed of small, independent services that:
- Run in their own process
- Communicate via APIs (typically REST or message queues)
- Can be deployed independently
- Focus on a single business capability
- Use lightweight protocols

**Advantages:**
- **Scalability**: Scale individual services based on demand
- **Flexibility**: Use different technologies per service
- **Resilience**: Failure in one service doesn't crash the entire system
- **Easy Deployment**: Deploy and update services independently
- **Team Autonomy**: Different teams can work on different services

### What are the Advantages of REST API?
- **Stateless**: Each request contains all needed information
- **Cacheable**: Responses can be cached for better performance
- **Uniform Interface**: Standard HTTP methods (GET, POST, PUT, DELETE)
- **Client-Server Separation**: Frontend and backend evolve independently
- **Layered System**: Can add proxies, load balancers, etc.
- **Platform Independent**: Any client can consume the API
- **Easy to Understand**: Based on standard HTTP conventions

### Clean Code Explained
Clean code is code that is:

1. **Readable**: Easy to understand at first glance
   - Descriptive names for variables, functions, and classes
   - Proper formatting and indentation
   - Clear structure and organization

2. **Maintainable**: Easy to modify and extend
   - Small, focused functions and classes
   - Low coupling between components
   - High cohesion within components

3. **Testable**: Easy to write tests for
   - Pure functions where possible
   - Dependency injection for flexibility
   - Clear separation of concerns

4. **Simple**: No unnecessary complexity
   - YAGNI (You Aren't Gonna Need It)
   - DRY (Don't Repeat Yourself)
   - KISS (Keep It Simple, Stupid)

**In this project:**
- Clear naming: `UrlShortenerService`, `shortenUrl()`, `incrementClicks()`
- Single responsibility: Each class does one thing well
- Type safety: TypeScript and PHP type hints
- Error handling: Custom exceptions with meaningful messages
- Documentation: OpenAPI specs, comments where needed
- Testing: Comprehensive test coverage

## Author

Built for Ommax interview by Oscar

## License

This is a demo project for interview purposes.
