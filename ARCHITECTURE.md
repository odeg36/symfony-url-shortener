# Architecture Diagrams

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                         │
│                     http://localhost:5176                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ HTTP Requests
                            │ (REST API Calls)
                            ▼
┌────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND SPA                      │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Components                            │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │ UrlShortenerForm                             │  │    │
│  │  │  - URL input validation                      │  │    │
│  │  │  - Submit to API                             │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │ ShortenedUrlDisplay                          │  │    │
│  │  │  - Show success message                      │  │    │
│  │  │  - Copy to clipboard                         │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │ UrlList                                      │  │    │
│  │  │  - Table with pagination                     │  │    │
│  │  │  - Click counts                              │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │              API Client (api.ts)                    │   │
│  │  - shortenUrl()                                     │   │
│  │  - getAllUrls()                                     │   │
│  │  - getUrlStats()                                    │   │
│  └────────────────────────────────────────────────────┘    │
└───────────────────────────┬────────────────────────────────┘
                            │
                            │ CORS Enabled
                            │ JSON Requests/Responses
                            ▼
┌────────────────────────────────────────────────────────────┐
│                   SYMFONY BACKEND API                      │
│                  http://localhost:8080/api                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │          UrlShortenerController                    │    │
│  │                                                    │    │
│  │  POST   /api/urls/shorten                          │    │
│  │  GET    /api/urls                                  │    │
│  │  GET    /api/urls/{shortCode}                      │    │
│  │  GET    /api/urls/{shortCode}/stats                │    │
│  │                                                    │    │
│  │  - Request validation                              │    │
│  │  - Error handling                                  │    │
│  │  - Response formatting                             │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                        │
│                   ▼                                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │          UrlShortenerService                       │    │
│  │                                                    │    │
│  │  + shortenUrl(url: string): ShortUrl               │    │
│  │  + resolveShortCode(code: string): ShortUrl        │    │
│  │  + incrementClicks(shortUrl: ShortUrl): void       │    │
│  │  - generateShortCode(url: string): string          │    │
│  │                                                    │    │
│  │  Business Logic:                                   │    │
│  │  - URL validation                                  │    │
│  │  - MD5 hash generation                             │    │
│  │  - Duplicate detection                             │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                        │
│                   ▼                                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │          ShortUrlRepository                        │    │
│  │                                                    │    │
│  │  + findByOriginalUrl(url: string): ?ShortUrl       │    │
│  │  + findByShortCode(code: string): ?ShortUrl        │    │
│  │  + findAll(): ShortUrl[]                           │    │
│  │  + count(): int                                    │    │
│  │                                                    │    │
│  │  Data Access Layer (Doctrine ORM)                  │    │
│  └────────────────┬───────────────────────────────────┘    │
└────────────────────┼───────────────────────────────────────┘
                     │
                     │ SQL Queries
                     │ (via Doctrine ORM)
                     ▼
┌────────────────────────────────────────────────────────────┐
│                     POSTGRESQL DATABASE                    │
│                                                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │                 short_urls table                   │    │
│  │                                                    │    │
│  │  id              SERIAL PRIMARY KEY                │    │
│  │  original_url    VARCHAR(2048) UNIQUE NOT NULL     │    │
│  │  short_code      VARCHAR(20) UNIQUE NOT NULL       │    │
│  │  clicks          INTEGER DEFAULT 0                 │    │
│  │  created_at      TIMESTAMP NOT NULL                │    │
│  │                                                    │    │
│  │  Indexes:                                          │    │
│  │  - PRIMARY KEY (id)                                │    │
│  │  - UNIQUE INDEX (original_url)                     │    │
│  │  - UNIQUE INDEX (short_code)                       │    │
│  └────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────┘
```

---

## Request Flow - Shorten URL

```
┌─────────┐
│  USER   │
└────┬────┘
     │
     │ 1. Enter URL in form
     ▼
┌─────────────────────────┐
│  UrlShortenerForm       │
│  React Component        │
└────┬────────────────────┘
     │
     │ 2. Submit form
     │ api.shortenUrl(url)
     ▼
┌─────────────────────────┐
│  HTTP POST Request      │
│  /api/urls/shorten      │
│  { "url": "..." }       │
└────┬────────────────────┘
     │
     │ 3. CORS check
     │ Content-Type validation
     ▼
┌─────────────────────────────┐
│  UrlShortenerController     │
│  - Parse request body       │
│  - Extract URL              │
└────┬────────────────────────┘
     │
     │ 4. Call service
     │ service.shortenUrl(url)
     ▼
┌─────────────────────────────┐
│  UrlShortenerService        │
│  - Validate URL             │
│  - Check if exists          │
│  - Generate short code      │
│  - Save to database         │
└────┬────────────────────────┘
     │
     │ 5a. Check existing
     │ repository.findByOriginalUrl()
     ▼
┌─────────────────────────────┐
│  ShortUrlRepository         │
│  SELECT * FROM short_urls   │
│  WHERE original_url = ?     │
└────┬────────────────────────┘
     │
     │ 5b. If not found
     │ 6. Generate hash
     │ MD5(url) → first 8 chars
     │
     │ 7. Create entity
     │ new ShortUrl(url, code)
     │
     │ 8. Persist to DB
     │ repository.save()
     ▼
┌─────────────────────────────┐
│  PostgreSQL                 │
│  INSERT INTO short_urls     │
└────┬────────────────────────┘
     │
     │ 9. Return entity
     ▼
┌─────────────────────────────┐
│  Controller formats         │
│  response with full URL     │
└────┬────────────────────────┘
     │
     │ 10. JSON Response
     │ {
     │   "originalUrl": "...",
     │   "shortCode": "abc123",
     │   "shortUrl": "http://...",
     │   "clicks": 0,
     │   "createdAt": "..."
     │ }
     ▼
┌─────────────────────────────┐
│  Frontend receives          │
│  Updates state              │
│  Shows success message      │
└─────────────────────────────┘
```

---

## Request Flow - Resolve Short URL

```
USER clicks short URL
         │
         ▼
┌─────────────────────────────┐
│  GET /api/urls/{shortCode}  │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│  UrlShortenerController     │
│  - Extract shortCode param  │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│  UrlShortenerService        │
│  1. resolveShortCode()      │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│  ShortUrlRepository         │
│  SELECT * FROM short_urls   │
│  WHERE short_code = ?       │
└────┬────────────────────────┘
     │
     │ Found? Yes
     ▼
┌─────────────────────────────┐
│  UrlShortenerService        │
│  2. incrementClicks()       │
│     shortUrl.clicks++       │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│  PostgreSQL                 │
│  UPDATE short_urls          │
│  SET clicks = clicks + 1    │
│  WHERE id = ?               │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│  Return to Frontend         │
│  {                          │
│    "originalUrl": "...",    │
│    "clicks": 1              │
│  }                          │
└─────────────────────────────┘
```

---

## Clean Architecture Layers

```
┌────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                      │
│                                                            │
│  ┌──────────────────────────────────────────────────┐      │
│  │ Controllers                                      │      │
│  │ - HTTP request/response handling                 │      │
│  │ - Input validation                               │      │
│  │ - Response formatting                            │      │
│  │ - Error handling                                 │      │
│  └──────────────────────────────────────────────────┘      │
└───────────────────────────┬────────────────────────────────┘
                            │
                            │ Calls
                            ▼
┌────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                        │
│                                                            │
│  ┌──────────────────────────────────────────────────┐      │
│  │ Services                                         │      │
│  │ - Business logic                                 │      │
│  │ - Domain rules                                   │      │
│  │ - Orchestration                                  │      │
│  │ - Validation                                     │      │
│  └──────────────────────────────────────────────────┘      │
└───────────────────────────┬────────────────────────────────┘
                            │
                            │ Uses
                            ▼
┌────────────────────────────────────────────────────────────┐
│                     DOMAIN LAYER                           │
│                                                            │
│  ┌──────────────────────────────────────────────────┐      │
│  │ Entities                                         │      │
│  │ - Domain objects                                 │      │
│  │ - Business rules                                 │      │
│  │ - No dependencies                                │      │
│  └──────────────────────────────────────────────────┘      │
└───────────────────────────┬────────────────────────────────┘
                            │
                            │ Persisted by
                            ▼
┌────────────────────────────────────────────────────────────┐
│                 INFRASTRUCTURE LAYER                       │
│                                                            │
│  ┌──────────────────────────────────────────────────┐      │
│  │ Repositories                                     │      │
│  │ - Data access                                    │      │
│  │ - Query building                                 │      │
│  │ - ORM interaction                                │      │
│  │                                                  │      │
│  │ External Services                                │      │
│  │ - Database                                       │      │
│  │ - Cache                                          │      │
│  │ - File system                                    │      │
│  └──────────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────────┘

Dependency Direction: ↓ (Top depends on Bottom, never reversed)
```

---

## Testing Strategy Diagram

```
┌────────────────────────────────────────────────────────────┐
│                      UNIT TESTS                            │
│                                                            │
│  Test individual components in isolation                   │
│                                                            │
│  ┌──────────────────────────────────────────────────┐      │
│  │ UrlShortenerServiceTest                          │      │
│  │                                                  │      │
│  │ Mock: Repository, Validator                      │      │
│  │                                                  │      │
│  │ Tests:                                           │      │
│  │ ✓ URL validation                                 │      │
│  │ ✓ Short code generation                          │      │
│  │ ✓ Deterministic behavior                         │      │
│  │ ✓ Click increment                                │      │
│  │ ✓ Error handling                                 │      │
│  │ ✓ Edge cases                                     │      │
│  └──────────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────────┘
                            │
                            │ Fast, isolated
                            │ No database
                            ▼
┌────────────────────────────────────────────────────────────┐
│                  INTEGRATION TESTS                         │
│                                                            │
│  Test full request-response cycle                          │
│                                                            │
│  ┌──────────────────────────────────────────────────┐      │
│  │ UrlShortenerControllerTest                       │      │
│  │                                                  │      │
│  │ Uses: Real database (test env)                   │      │
│  │                                                  │      │
│  │ Tests:                                           │      │
│  │ ✓ POST /api/urls/shorten                         │      │
│  │ ✓ GET /api/urls                                  │      │
│  │ ✓ GET /api/urls/{code}                           │      │
│  │ ✓ GET /api/urls/{code}/stats                     │      │
│  │ ✓ HTTP status codes                              │      │
│  │ ✓ Response format                                │      │
│  │ ✓ Pagination                                     │      │
│  │ ✓ Error responses                                │      │
│  └──────────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────────┘
                            │
                            │ Slower, realistic
                            │ Full stack
                            ▼
┌────────────────────────────────────────────────────────────┐
│                   MANUAL TESTING                           │
│                                                            │
│  Test through UI and Swagger                               │
│                                                            │
│  ┌──────────────────────────────────────────────────┐      │
│  │ Frontend Testing                                 │      │
│  │ - Form submission                                │      │
│  │ - Display updates                                │      │
│  │ - Pagination                                     │      │
│  │ - Copy functionality                             │      │
│  │                                                  │      │
│  │ API Testing (Swagger UI)                         │      │
│  │ - Direct API calls                               │      │
│  │ - Response inspection                            │      │
│  │ - Error scenarios                                │      │
│  └──────────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture (Production Ready)

```
                         ┌──────────────┐
                         │     CDN      │
                         │  (Frontend)  │
                         └──────┬───────┘
                                │
                     ┌──────────▼──────────┐
                     │   Load Balancer     │
                     └──────────┬──────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
        │  API Server  │ │ API Server │ │ API Server │
        │   Instance   │ │  Instance  │ │  Instance  │
        │    (PHP)     │ │   (PHP)    │ │   (PHP)    │
        └───────┬──────┘ └─────┬──────┘ └─────┬──────┘
                │               │               │
                └───────────────┼───────────────┘
                                │
                    ┌───────────▼────────────┐
                    │    Redis Cache         │
                    │  (Optional)            │
                    └───────────┬────────────┘
                                │
                    ┌───────────▼────────────┐
                    │  PostgreSQL Primary    │
                    └───────────┬────────────┘
                                │
                    ┌───────────▼────────────┐
                    │  PostgreSQL Replicas   │
                    │  (Read-only)           │
                    └────────────────────────┘
```

---

## SOLID Principles in Action

```
┌─────────────────────────────────────────────────────────────┐
│ S - Single Responsibility Principle                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  UrlShortenerController → HTTP handling ONLY                │
│  UrlShortenerService    → Business logic ONLY               │
│  ShortUrlRepository     → Data access ONLY                  │
│                                                             │
│  Each class has ONE reason to change                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ O - Open/Closed Principle                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Can extend behavior without modifying existing code        │
│                                                             │
│  Example: Add new short code algorithm                      │
│  - Create new ShortCodeGeneratorInterface                   │
│  - Inject into service                                      │
│  - No changes to existing code                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ L - Liskov Substitution Principle                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Repository can be replaced with any implementation         │
│  - In-memory for testing                                    │
│  - Different database                                       │
│  - Behavior remains consistent                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ I - Interface Segregation Principle                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Small, focused interfaces                                  │
│  - Repository only has needed methods                       │
│  - No "fat" interfaces with unused methods                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ D - Dependency Inversion Principle                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  High-level modules don't depend on low-level modules       │
│                                                             │
│  Service depends on Repository interface (abstraction)      │
│  Not on concrete Doctrine implementation                    │
│                                                             │
│  Dependency injection via constructor                       │
└─────────────────────────────────────────────────────────────┘
```

This completes the architecture documentation!
