<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\ShortUrl;
use App\Exception\InvalidUrlException;
use App\Exception\ShortUrlNotFoundException;
use App\Exception\ShortUrlPersistenceException;
use App\Exception\UnreachableUrlException;
use App\Repository\ShortUrlRepository;
use Doctrine\DBAL\Exception as DBALException;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Exception;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

final class UrlShortenerService
{
    public function __construct(
        private readonly ShortUrlRepository $repository,
        private readonly ValidatorInterface $validator,
        private readonly EntityManagerInterface $entityManager,
        private readonly HttpClientInterface $httpClient,
        private readonly string $baseUrl,
    ) {
    }

    public function getAllUrlsPaginated(int $page = 1, int $limit = 10): array
    {
        $page = max(1, $page);
        $limit = max(1, min(100, $limit));

        $total = $this->repository->count([]);
        $offset = ($page - 1) * $limit;

        $urls = $this->repository->findBy([], ['createdAt' => 'DESC'], $limit, $offset);
        $data = array_map(fn (ShortUrl $url) => $this->formatShortUrl($url), $urls);

        return [
            'data' => $data,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'totalPages' => (int) ceil($total / $limit),
            ],
        ];
    }

    public function shortenUrl(?string $originalUrl): ShortUrl
    {
        if (null === $originalUrl || '' === trim($originalUrl)) {
            throw new InvalidUrlException('Please provide a URL to shorten');
        }

        // Normalize the URL before processing
        $originalUrl = $this->normalizeUrl($originalUrl);

        // Validate URL format (requireTld=false allows newer TLDs like .io, .ai, etc.)
        $violations = $this->validator->validate($originalUrl, [
            new Assert\Url(
                protocols: ['http', 'https'],
                requireTld: false,
                message: 'The URL "{{ value }}" is not valid. Only HTTP and HTTPS URLs are allowed.'
            ),
        ]);

        // Additional validation: ensure URL has a domain with at least one dot
        $parsedUrl = parse_url($originalUrl);
        if (!isset($parsedUrl['host']) || !str_contains($parsedUrl['host'], '.')) {
            throw new InvalidUrlException($originalUrl);
        }

        if (count($violations) > 0) {
            throw new InvalidUrlException($originalUrl);
        }
        $this->validateUrlIsReachable($originalUrl);

        // Generate deterministic short code
        $shortCode = $this->generateShortCode($originalUrl);
        $shortUrl = new ShortUrl($originalUrl, $shortCode);

        try {
            // Optimistic insert: try to create directly
            $this->entityManager->persist($shortUrl);
            $this->entityManager->flush();
        } catch (UniqueConstraintViolationException $e) {
            // Duplicate detected - fetch and return existing record
            $existing = $this->repository->findByOriginalUrl($originalUrl);
            if (null !== $existing) {
                return $existing;
            }
            // Should not happen, but safety check
            throw new ShortUrlPersistenceException();
        } catch (DBALException $e) {
            // Other database errors
            throw new ShortUrlPersistenceException();
        }

        return $shortUrl;
    }

    public function resolveShortCode(string $shortCode): ShortUrl
    {
        $shortUrl = $this->repository->findByShortCode($shortCode);

        if (null === $shortUrl) {
            throw new ShortUrlNotFoundException($shortCode);
        }

        return $shortUrl;
    }

    public function incrementClicks(ShortUrl $shortUrl): void
    {
        $shortUrl->incrementClicks();
        try {
            $this->entityManager->flush();
        } catch (DBALException $e) {
            throw new ShortUrlPersistenceException();
        }
    }

    /**
     * Check if URL is actually reachable (HEAD request with 5s timeout).
     */
    private function validateUrlIsReachable(string $url): void
    {
        try {
            $response = $this->httpClient->request('HEAD', $url, [
                'timeout' => 5,
                'max_redirects' => 3,
                'headers' => [
                    'User-Agent' => 'URL-Shortener-Bot/1.0',
                ],
            ]);

            $statusCode = $response->getStatusCode();

            // Accept 2xx and 3xx status codes as valid
            if ($statusCode >= 400) {
                throw new UnreachableUrlException($url);
            }
        } catch (Exception $e) {
            // If it's already our exception, re-throw it
            if ($e instanceof UnreachableUrlException) {
                throw $e;
            }
            // Otherwise, wrap any network/HTTP errors
            throw new UnreachableUrlException($url);
        }
    }

    /**
     * Normalize URL (trim, lowercase host, handle trailing slashes).
     */
    private function normalizeUrl(string $url): string
    {
        $url = trim($url);

        $parsedUrl = parse_url($url);
        if (!$parsedUrl) {
            return $url;
        }

        return $this->buildNormalizedUrl($parsedUrl);
    }

    /**
     * @param array<string, mixed> $parsedUrl
     */
    private function buildNormalizedUrl(array $parsedUrl): string
    {
        $normalized = $this->buildBaseUrl($parsedUrl);
        $normalized .= $this->buildPath($parsedUrl);
        $normalized .= $this->buildQueryAndFragment($parsedUrl);

        return $normalized;
    }

    /**
     * @param array<string, mixed> $parsedUrl
     */
    private function buildBaseUrl(array $parsedUrl): string
    {
        $base = '';

        if (isset($parsedUrl['scheme']) && is_string($parsedUrl['scheme'])) {
            $base .= strtolower($parsedUrl['scheme']).'://';
        }

        if (isset($parsedUrl['host']) && is_string($parsedUrl['host'])) {
            $base .= strtolower($parsedUrl['host']);
        }

        if (isset($parsedUrl['port']) && is_int($parsedUrl['port'])) {
            $scheme = isset($parsedUrl['scheme']) && is_string($parsedUrl['scheme']) ? $parsedUrl['scheme'] : '';
            $base .= $this->buildPort($scheme, $parsedUrl['port']);
        }

        return $base;
    }

    private function buildPort(string $scheme, int $port): string
    {
        $isDefaultPort = ('http' === $scheme && 80 === $port)
            || ('https' === $scheme && 443 === $port);

        return $isDefaultPort ? '' : ':'.$port;
    }

    /**
     * @param array<string, mixed> $parsedUrl
     */
    private function buildPath(array $parsedUrl): string
    {
        $path = isset($parsedUrl['path']) && is_string($parsedUrl['path']) ? $parsedUrl['path'] : '/';

        if ('/' === $path || '' === $path) {
            return '';
        }

        return $path;
    }

    /**
     * @param array<string, mixed> $parsedUrl
     */
    private function buildQueryAndFragment(array $parsedUrl): string
    {
        $result = '';

        if (isset($parsedUrl['query']) && is_string($parsedUrl['query'])) {
            $result .= '?'.$parsedUrl['query'];
        }

        if (isset($parsedUrl['fragment']) && is_string($parsedUrl['fragment'])) {
            $result .= '#'.$parsedUrl['fragment'];
        }

        return $result;
    }

    /**
     * Generate deterministic short code using MD5 hash.
     * Same URL always gets the same code (useful for deduplication).
     */
    private function generateShortCode(string $url): string
    {
        return substr(md5($url), 0, 8);
    }

    public function formatShortUrl(ShortUrl $shortUrl): array
    {
        return [
            'originalUrl' => $shortUrl->getOriginalUrl(),
            'shortCode' => $shortUrl->getShortCode(),
            'shortUrl' => $this->baseUrl.'/'.$shortUrl->getShortCode(),
            'clicks' => $shortUrl->getClicks(),
            'createdAt' => $shortUrl->getCreatedAt()->format('c'),
        ];
    }
}
