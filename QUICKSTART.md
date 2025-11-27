# Quick Start Guide

## Setup (First Time)

```bash
# Run the setup script
./setup.sh

# Or with Make:
make setup

# Or manually:
cd symfony && composer install
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate

cd ../frontend && npm install
```

## Running the Application

### Backend (Terminal 1)
```bash
cd symfony
symfony server:start
# or
php -S localhost:8080 -t public
```

### Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```

## Access Points

- **Frontend:** http://localhost:5176
- **API Swagger Docs:** http://localhost:8080/api/doc
- **API Base:** http://localhost:8080/api

## Testing

```bash
# Run all tests
cd symfony
php bin/phpunit

# Run specific tests
php bin/phpunit tests/Service/
php bin/phpunit tests/Controller/

# With coverage
php bin/phpunit --coverage-html coverage/
```

## API Examples

### Shorten URL
```bash
curl -X POST http://localhost:8080/api/urls/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.example.com"}'
```

### Get All URLs
```bash
curl http://localhost:8080/api/urls?page=1&limit=10
```

### Resolve Short URL
```bash
curl http://localhost:8080/api/urls/{shortCode}
```

### Get Stats
```bash
curl http://localhost:8080/api/urls/{shortCode}/stats
```

## Database

### Reset Database
```bash
cd symfony
php bin/console doctrine:database:drop --force
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate
```

### View Database
```bash
docker exec -it <postgres_container> psql -U postgres -d symfony
```

## Development

### Add New Migration
```bash
cd symfony
php bin/console make:migration
php bin/console doctrine:migrations:migrate
```

### Clear Cache
```bash
cd symfony
php bin/console cache:clear
```

### Frontend Build
```bash
cd frontend
npm run build
# Output in dist/
```

## Project Structure

```
symfony-interview/
├── symfony/              # Backend API
│   ├── src/
│   │   ├── Controller/   # API endpoints
│   │   ├── Entity/       # Database models
│   │   ├── Service/      # Business logic
│   │   ├── Repository/   # Data access
│   │   └── Exception/    # Custom exceptions
│   ├── tests/            # Unit & integration tests
│   └── config/           # Configuration files
│
├── frontend/             # React SPA
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── api.ts        # API client
│   │   └── App.tsx       # Main component
│   └── public/
│
├── README.md             # Full documentation
├── PRESENTATION.md       # Presentation notes
└── setup.sh              # Setup script
```

## Key Demo Points

1. Show frontend UI - clean, responsive design
2. Create a short URL - instant feedback
3. Copy short URL - works with one click
4. Show URL list - pagination, click counts
5. Open Swagger docs - interactive API testing
6. Run tests - show comprehensive coverage
7. Explain clean code examples
8. Answer technical questions

## Resources
- **Symfony Docs:** https://symfony.com/doc/current/
- **React Docs:** https://react.dev
- **Tailwind CSS:** https://tailwindcss.com/docs
- **OpenAPI:** https://swagger.io/specification/
