# URL Shortener - Presentation Notes
## Ommax Interview - 30 Minutes

---

## Agenda (30 min)
1. **Introduction & Demo** (5 min)
2. **Architecture Overview** (5 min)
3. **Technical Implementation** (10 min)
4. **Code Walkthrough** (5 min)
5. **Q&A - Interview Questions** (5 min)

---

## 1. Introduction & Demo (5 min)

### Project Overview
- **Goal**: Build a URL shortener microservice like bit.ly
- **Technologies**: Symfony (PHP 8.4), React + TypeScript, PostgreSQL
- **Features**: Shorten URLs, track clicks, list all URLs, RESTful API

### Live Demo
1. Show frontend application
2. Shorten a URL
3. Display shortened URL and copy functionality
4. Show list of URLs with click counts
5. Test pagination
6. Show Swagger API documentation

**Demo URLs to use:**
- https://www.symfony.com/doc/current/index.html
- https://react.dev/learn
- https://tailwindcss.com/docs

---

## 2. Architecture Overview (5 min)

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND SPA                     │
│         React + TypeScript + Tailwind CSS           │
│                  (Port: 5176)                       │
└─────────────────┬───────────────────────────────────┘
                  │ HTTP/REST API
                  │ (CORS enabled)
                  ▼
┌────────────────────────────────────────────────────┐
│              SYMFONY BACKEND API                   │
│                  (Port: 8080)                      │
│  ┌──────────────────────────────────────────────┐  │
│  │         Controllers (Presentation)           │  │
│  │    - UrlShortenerController                  │  │
│  │    - Exception Handling                      │  │
│  └───────────────┬──────────────────────────────┘  │
│                  │                                 │
│  ┌───────────────▼──────────────────────────────┐  │
│  │         Services (Business Logic)            │  │
│  │    - UrlShortenerService                     │  │
│  │    - URL Validation                          │  │
│  │    - Short Code Generation                   │  │
│  └───────────────┬──────────────────────────────┘  │
│                  │                                 │
│  ┌───────────────▼──────────────────────────────┐  │
│  │       Repositories (Data Access)             │  │
│  │    - ShortUrlRepository                      │  │
│  │    - Doctrine ORM                            │  │
│  └───────────────┬──────────────────────────────┘  │
└──────────────────┼─────────────────────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │   PostgreSQL    │
         │    Database     │
         │  (Port: 5432)   │
         └─────────────────┘
```

### Microservice Characteristics
**Single Responsibility**: Only handles URL shortening
**Independent**: Can be deployed without other services
**API-First**: REST API as main interface
**Stateless**: No server sessions
**Scalable**: Horizontal scaling ready

---

## 3. Technical Implementation (10 min)

### Backend Architecture (Symfony)

#### Entity Layer
```php
ShortUrl Entity
├── id (Primary Key)
├── originalUrl (unique, max 2048 chars)
├── shortCode (unique, 8 chars, indexed)
├── clicks (counter, default 0)
└── createdAt (timestamp)
```

#### Service Layer - Key Features
1. **URL Validation**
   - Symfony Validator component
   - HTTP/HTTPS protocols only
   - Valid domain with TLD required

2. **Deterministic Short Code Generation**
   - MD5 hash of URL (first 8 characters)
   - Same URL always gets same code
   - Simple and collision-resistant

3. **Click Tracking**
   - Increment on resolve endpoint
   - Separate stats endpoint (no increment)

#### API Endpoints

**1. POST /api/urls/shorten**
- Input: `{"url": "https://example.com"}`
- Returns: Short URL with metadata

**2. GET /api/urls/{shortCode}**
- Resolves short code
- Increments click counter
- Returns original URL

**3. GET /api/urls/{shortCode}/stats**
- Returns stats WITHOUT incrementing clicks

**4. GET /api/urls?page=1&limit=10**
- Paginated list of all URLs
- Sorted by creation date (newest first)

### Frontend Architecture (React)

#### Component Structure
```
App
├── UrlShortenerForm (form with validation)
├── ShortenedUrlDisplay (success message + copy button)
└── UrlList (table with pagination)
```

#### Key Features
- **TypeScript**: Type-safe API calls
- **Tailwind CSS**: Responsive, modern design
- **State Management**: React hooks (useState, useEffect)
- **API Integration**: Fetch API with error handling

---

## 4. Code Walkthrough (5 min)

### Clean Code Examples

#### 1. Single Responsibility Principle
```php
class UrlShortenerService {
    // One responsibility: URL shortening business logic
    public function shortenUrl(?string $originalUrl): ShortUrl
    public function resolveShortCode(string $shortCode): ShortUrl
    public function incrementClicks(ShortUrl $shortUrl): void
}
```

#### 2. Dependency Injection
```php
public function __construct(
    private readonly ShortUrlRepository $repository,
    private readonly ValidatorInterface $validator
) {}
```

#### 3. Custom Exceptions
```php
InvalidUrlException         // For invalid URLs
ShortUrlNotFoundException   // For non-existent codes
ShortUrlPersistenceException // For database errors
```

#### 4. Type Safety
```php
public function shortenUrl(?string $originalUrl): ShortUrl
// Clear input and output types
```

#### 5. Test Coverage
```php
Service tests (deterministic behavior, edge cases)
Controller integration tests (API endpoints)
Error handling tests (invalid inputs)
```

### Clean Code Highlights
- **Readable**: Clear method names, no cryptic abbreviations
- **Maintainable**: Separated concerns, easy to modify
- **Testable**: Mocked dependencies, isolated tests
- **Simple**: No over-engineering, straightforward logic

---

## 5. Q&A - Interview Questions (5 min)

### Question 1: What is a Microservice?

**Answer:**
A microservice is an architectural approach where applications are built as a collection of small, independent services that:

**Characteristics:**
- Run in their own process
- Communicate via lightweight APIs (REST, gRPC)
- Can be deployed independently
- Focus on a single business capability
- Own their data (database per service)

**Advantages:**
1. **Scalability**: Scale only the services that need it
   - Example: If URL resolving has high traffic, scale only that service

2. **Flexibility**: Use different tech stacks per service
   - This service: PHP/Symfony, another could be Node.js

3. **Resilience**: Failure isolation
   - If one service fails, others continue working

4. **Development Speed**: Teams work independently
   - No need to coordinate deployments

5. **Easy Maintenance**: Smaller codebases
   - Easier to understand and modify

**This Project as Microservice:**
- Single responsibility: URL shortening only
- API-first design: Can be consumed by any client
- Independent deployment: Frontend and backend separate
- Stateless: Can scale horizontally

---

### Question 2: Advantages of REST API?

**Answer:**
REST (Representational State Transfer) offers several key advantages:

1. **Stateless Architecture**
   - Each request is self-contained
   - No server-side session management
   - Easy to scale horizontally

2. **Cacheable**
   - Responses can be cached
   - Better performance and reduced server load
   - Example: GET /api/urls can be cached

3. **Uniform Interface**
   - Standard HTTP methods:
     - GET: Retrieve data
     - POST: Create resources
     - PUT/PATCH: Update resources
     - DELETE: Remove resources
   - Predictable and easy to learn

4. **Client-Server Separation**
   - Frontend and backend evolve independently
   - Multiple clients (web, mobile, etc.) use same API

5. **Layered System**
   - Can add proxies, load balancers, caching layers
   - API gateway, CDN, etc.

6. **Platform Independent**
   - Any language/platform can consume it
   - Just need HTTP support

7. **Self-Documenting**
   - With OpenAPI/Swagger
   - Interactive documentation and testing

**In This Project:**
- OpenAPI documentation at `/api/doc`
- Standard HTTP methods
- JSON responses
- CORS enabled for cross-origin requests

---

### Question 3: Explain Clean Code

**Answer:**
Clean code is code that is easy to read, understand, and maintain.

**Core Principles:**

1. **Readable**
   - Clear, descriptive names
   - Example: `shortenUrl()` not `process()`
   - Self-documenting code

2. **Simple**
   - KISS
   - No unnecessary complexity
   - One function does one thing

3. **DRY: Don't Repeat Yourself**
   - Reuse code through functions/classes
   - Example: `formatShortUrl()` method used everywhere

4. **SOLID Principles**

5. **Testable**
   - Easy to write unit tests
   - Dependency injection

**Examples from This Project:**

**Bad Code:**
```php
function x($u) {
    $c = substr(md5($u), 0, 8);
    // save to db
    return $c;
}
```

**Clean Code:**
```php
public function shortenUrl(string $originalUrl): ShortUrl
{
    $this->validateUrl($originalUrl);
    $shortCode = $this->generateShortCode($originalUrl);
    return $this->saveShortUrl($originalUrl, $shortCode);
}
```

**Benefits:**
- **Less bugs**: Easier to spot errors
- **Faster development**: Easy to understand and modify
- **Better collaboration**: Others can read your code
- **Lower maintenance cost**: Less time debugging

---

## Additional Technical Details

### Database Indexes
```sql
CREATE INDEX idx_short_code ON short_urls(short_code);
CREATE UNIQUE INDEX idx_original_url ON short_urls(original_url);
```

### Error Handling
- API returns proper HTTP status codes
- 400: Bad Request (invalid URL)
- 404: Not Found (short code doesn't exist)
- 500: Server Error (database issues)

### Security Considerations
- URL validation prevents XSS
- Input sanitization
- Rate limiting (to be implemented)
- CORS properly configured

### Testing Strategy
- **Unit Tests**: Service logic, no database
- **Integration Tests**: Full API flow with test database
- **Test Coverage**: Critical paths covered

---

## Future Enhancements

1. **Rate Limiting**: Prevent abuse
2. **Analytics**: Detailed click tracking (geo, referrer, device)
3. **Custom Short Codes**: Let users choose their code
4. **Expiration**: URLs expire after time period
5. **User Accounts**: Associate URLs with users
6. **QR Codes**: Generate QR codes for short URLs
7. **Link Preview**: Show preview before redirecting
8. **API Authentication**: JWT tokens for API access

---

## Questions to Expect

### Technical Questions
1. **Why Symfony?**
   - Mature framework, excellent documentation
   - Strong ORM (Doctrine)
   - Built-in validation, security features
   - Good for REST APIs

2. **Why MD5 for short codes?**
   - Deterministic (same URL = same code)
   - Fast computation
   - Collision unlikely for short URLs
   - Could use base62 encoding for custom codes

3. **How to handle collisions?**
   - MD5 collisions extremely rare
   - Unique constraint in database
   - Could append incrementing number if needed

4. **How to scale this?**
   - Horizontal scaling: Multiple app instances
   - Database read replicas
   - Redis caching for frequent lookups
   - CDN for frontend
   - Load balancer for API

### Process Questions
1. **How long did this take?**
   - Backend: ~4 hours
   - Frontend: ~2 hours
   - Testing & Documentation: ~2 hours

2. **What was most challenging?**
   - Comprehensive test coverage
   - API design decisions

3. **What would you improve?**
   - Add more analytics
   - Implement caching
   - On collision append incrementing number
   - Add rate limiting
   - Better error messages
   - Translation messages
   - Admin & Security Layer
   - Module to bulk URLs (Form or File uploadl) and short them.

---

## Key Takeaways

**Requirements Met:**
- All 4 API endpoints implemented
- Deterministic short codes
- Click tracking
- Full test coverage
- SPA frontend with CSS framework
- Clean code principles demonstrated

**Best Practices:**
- RESTful API design
- Clean architecture
- Comprehensive testing
- Documentation
- Type safety
- Error handling

**Ready for Production:**
- Scalable architecture
- Database migrations
- Environment configuration
- CORS enabled
- API documentation

---

## Thank You!

**Questions?**

**Contact:** [Your Email/GitHub]
