<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\ShortUrl;
use App\Exception\InvalidUrlException;
use App\Exception\ShortUrlNotFoundException;
use App\Exception\UnreachableUrlException;
use App\Repository\ShortUrlRepository;
use App\Service\UrlShortenerService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Validator\ConstraintViolationList;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Contracts\HttpClient\ResponseInterface;

final class UrlShortenerServiceTest extends TestCase
{
    private function createUrlShortenerService(
        ?ShortUrlRepository $repository = null,
        ?ValidatorInterface $validator = null,
        ?EntityManagerInterface $entityManager = null,
        ?HttpClientInterface $httpClient = null,
    ): UrlShortenerService {
        $repository = $repository ?? $this->createMock(ShortUrlRepository::class);
        $validator = $validator ?? $this->createMock(ValidatorInterface::class);
        $entityManager = $entityManager ?? $this->createMock(EntityManagerInterface::class);
        $httpClient = $httpClient ?? $this->createMock(HttpClientInterface::class);

        return new UrlShortenerService(
            $repository,
            $validator,
            $entityManager,
            $httpClient,
            'http://localhost:8080'
        );
    }

    public function testShortenUrlCreatesNewShortUrl(): void
    {
        $url = 'https://example.com';

        $validator = $this->createMock(ValidatorInterface::class);
        $validator->method('validate')->willReturn(new ConstraintViolationList());

        $entityManager = $this->createMock(EntityManagerInterface::class);

        $repository = $this->createMock(ShortUrlRepository::class);
        $repository->method('findByOriginalUrl')->willReturn(null);

        $service = $this->createUrlShortenerService($repository, $validator, $entityManager);
        $shortUrl = $service->shortenUrl($url);

        $this->assertInstanceOf(ShortUrl::class, $shortUrl);
        $this->assertSame($url, $shortUrl->getOriginalUrl());
        $this->assertNotEmpty($shortUrl->getShortCode());
    }

    public function testShortenUrlReturnsExistingForSameUrl(): void
    {
        $url = 'https://example.com';
        $existingShortUrl = new ShortUrl($url, 'abc123');

        $validator = $this->createMock(ValidatorInterface::class);
        $validator->method('validate')->willReturn(new ConstraintViolationList());

        $repository = $this->createMock(ShortUrlRepository::class);
        $repository->method('findByOriginalUrl')->with($url)->willReturn($existingShortUrl);

        $service = $this->createUrlShortenerService($repository, $validator);
        $shortUrl = $service->shortenUrl($url);

        $this->assertSame($existingShortUrl, $shortUrl);
    }

    public function testShortenUrlThrowsExceptionForNullUrl(): void
    {
        $this->expectException(InvalidUrlException::class);
        $this->expectExceptionMessage('Please provide a URL to shorten');

        $service = $this->createUrlShortenerService();
        $service->shortenUrl(null);
    }

    public function testShortenUrlThrowsExceptionForEmptyUrl(): void
    {
        $this->expectException(InvalidUrlException::class);
        $this->expectExceptionMessage('Please provide a URL to shorten');

        $service = $this->createUrlShortenerService();
        $service->shortenUrl('');
    }

    public function testShortenUrlThrowsExceptionForInvalidUrl(): void
    {
        $violation = $this->createMock(\Symfony\Component\Validator\ConstraintViolation::class);
        $violations = new ConstraintViolationList([$violation]);

        $validator = $this->createMock(ValidatorInterface::class);
        $validator->method('validate')->willReturn($violations);

        $this->expectException(InvalidUrlException::class);

        $service = $this->createUrlShortenerService(null, $validator);
        $service->shortenUrl('not-a-valid-url');
    }

    public function testShortenUrlRejectsVariousInvalidUrls(): void
    {
        $invalidUrls = [
            'not-a-valid-url',
            'ftp://invalid-protocol.com',
            'just-text',
            'http://',
            'https://',
            'http://.',
            'http://..',
            'http://../',
            'http://?',
            'http://??',
            'http://#',
            'http://##',
            'http:// shouldfail.com',
            'http://foo.bar?q=Spaces should be encoded',
            '//',
            '//a',
            '///a',
            'javascript:alert(1)',
            'file:///etc/passwd',
            'data:text/html,<script>alert(1)</script>',
            'http://localhost',
            'http://127.0.0.1',
            'http://[::1]',
            'http://-error-.invalid/',
            'http://a.b-.co',
        ];

        $violation = $this->createMock(\Symfony\Component\Validator\ConstraintViolation::class);
        $violations = new ConstraintViolationList([$violation]);

        $validator = $this->createMock(ValidatorInterface::class);
        $validator->method('validate')->willReturn($violations);

        $service = $this->createUrlShortenerService(null, $validator);

        foreach ($invalidUrls as $invalidUrl) {
            try {
                $service->shortenUrl($invalidUrl);
                $this->fail("Expected InvalidUrlException for URL: {$invalidUrl}");
            } catch (InvalidUrlException $e) {
                $this->assertInstanceOf(InvalidUrlException::class, $e);
            }
        }
    }

    public function testShortenUrlGeneratesDeterministicShortCode(): void
    {
        $url = 'https://example.com/test';

        $validator = $this->createMock(ValidatorInterface::class);
        $validator->method('validate')->willReturn(new ConstraintViolationList());

        $entityManager = $this->createMock(EntityManagerInterface::class);

        $repository = $this->createMock(ShortUrlRepository::class);
        $repository->method('findByOriginalUrl')->willReturn(null);

        $service = $this->createUrlShortenerService($repository, $validator, $entityManager);
        $shortUrl1 = $service->shortenUrl($url);
        $shortUrl2 = $service->shortenUrl($url);

        $this->assertSame($shortUrl1->getShortCode(), $shortUrl2->getShortCode());
    }

    public function testResolveShortCodeReturnsShortUrl(): void
    {
        $shortCode = 'abc123';
        $shortUrl = new ShortUrl('https://example.com', $shortCode);

        $repository = $this->createMock(ShortUrlRepository::class);
        $repository->method('findByShortCode')->with($shortCode)->willReturn($shortUrl);

        $service = $this->createUrlShortenerService($repository);
        $result = $service->resolveShortCode($shortCode);

        $this->assertSame($shortUrl, $result);
    }

    public function testResolveShortCodeThrowsExceptionWhenNotFound(): void
    {
        $shortCode = 'nonexistent';

        $repository = $this->createMock(ShortUrlRepository::class);
        $repository->method('findByShortCode')->with($shortCode)->willReturn(null);

        $this->expectException(ShortUrlNotFoundException::class);

        $service = $this->createUrlShortenerService($repository);
        $service->resolveShortCode($shortCode);
    }

    public function testIncrementClicksIncreasesCounter(): void
    {
        $shortUrl = new ShortUrl('https://example.com', 'abc123');
        $initialClicks = $shortUrl->getClicks();

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $repository = $this->createMock(ShortUrlRepository::class);

        $service = $this->createUrlShortenerService($repository, null, $entityManager);
        $service->incrementClicks($shortUrl);

        $this->assertSame($initialClicks + 1, $shortUrl->getClicks());
    }

    public function testIncrementClicksMultipleTimes(): void
    {
        $shortUrl = new ShortUrl('https://example.com', 'abc123');

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $repository = $this->createMock(ShortUrlRepository::class);

        $service = $this->createUrlShortenerService($repository, null, $entityManager);
        $service->incrementClicks($shortUrl);
        $service->incrementClicks($shortUrl);
        $service->incrementClicks($shortUrl);

        $this->assertSame(3, $shortUrl->getClicks());
    }

    public function testFormatShortUrlReturnsCorrectStructure(): void
    {
        $shortUrl = new ShortUrl('https://example.com', 'abc123');

        $service = $this->createUrlShortenerService();
        $formatted = $service->formatShortUrl($shortUrl);

        $this->assertArrayHasKey('originalUrl', $formatted);
        $this->assertArrayHasKey('shortCode', $formatted);
        $this->assertArrayHasKey('shortUrl', $formatted);
        $this->assertArrayHasKey('clicks', $formatted);
        $this->assertArrayHasKey('createdAt', $formatted);
        $this->assertSame('https://example.com', $formatted['originalUrl']);
        $this->assertSame('abc123', $formatted['shortCode']);
        $this->assertStringContainsString('http://localhost:8080/abc123', $formatted['shortUrl']);
    }

    public function testGetAllUrlsPaginatedReturnsCorrectStructure(): void
    {
        $shortUrl1 = new ShortUrl('https://example1.com', 'abc123');
        $shortUrl2 = new ShortUrl('https://example2.com', 'def456');

        $repository = $this->createMock(ShortUrlRepository::class);
        $repository->method('count')->willReturn(2);
        $repository->method('findBy')->willReturn([$shortUrl1, $shortUrl2]);

        $service = $this->createUrlShortenerService($repository);
        $result = $service->getAllUrlsPaginated(1, 10);

        $this->assertArrayHasKey('data', $result);
        $this->assertArrayHasKey('pagination', $result);
        $this->assertCount(2, $result['data']);
        $this->assertSame(2, $result['pagination']['total']);
        $this->assertSame(1, $result['pagination']['page']);
        $this->assertSame(10, $result['pagination']['limit']);
    }

    public function testShortenUrlAcceptsNewTlds(): void
    {
        $validator = $this->createMock(ValidatorInterface::class);
        $validator->method('validate')->willReturn(new ConstraintViolationList());

        $entityManager = $this->createMock(EntityManagerInterface::class);

        $repository = $this->createMock(ShortUrlRepository::class);
        $repository->method('findByOriginalUrl')->willReturn(null);

        $service = $this->createUrlShortenerService($repository, $validator, $entityManager);

        // Test various modern TLDs
        $urls = [
            'https://example.io',
            'https://app.dev',
            'https://mysite.app',
            'https://blog.ai',
            'https://shop.co',
        ];

        foreach ($urls as $url) {
            $shortUrl = $service->shortenUrl($url);
            $this->assertInstanceOf(ShortUrl::class, $shortUrl);
            $this->assertSame($url, $shortUrl->getOriginalUrl());
        }
    }

    public function testShortenUrlRejectsUrlsWithoutDomain(): void
    {
        $validator = $this->createMock(ValidatorInterface::class);
        $validator->method('validate')->willReturn(new ConstraintViolationList());

        $this->expectException(InvalidUrlException::class);

        $service = $this->createUrlShortenerService(null, $validator);
        $service->shortenUrl('http://localhost');
    }

    public function testShortenUrlValidatesReachability(): void
    {
        $url = 'https://example.com';

        $validator = $this->createMock(ValidatorInterface::class);
        $validator->method('validate')->willReturn(new ConstraintViolationList());

        $response = $this->createMock(ResponseInterface::class);
        $response->method('getStatusCode')->willReturn(200);

        $httpClient = $this->createMock(HttpClientInterface::class);
        $httpClient->expects($this->once())
            ->method('request')
            ->with('HEAD', $url, $this->anything())
            ->willReturn($response);

        $entityManager = $this->createMock(EntityManagerInterface::class);

        $repository = $this->createMock(ShortUrlRepository::class);
        $repository->method('findByOriginalUrl')->willReturn(null);

        $service = $this->createUrlShortenerService($repository, $validator, $entityManager, $httpClient);
        $shortUrl = $service->shortenUrl($url);

        $this->assertInstanceOf(ShortUrl::class, $shortUrl);
    }

    public function testShortenUrlThrowsExceptionForUnreachableUrl(): void
    {
        $url = 'https://nonexistent.example.com';

        $validator = $this->createMock(ValidatorInterface::class);
        $validator->method('validate')->willReturn(new ConstraintViolationList());

        $response = $this->createMock(ResponseInterface::class);
        $response->method('getStatusCode')->willReturn(404);

        $httpClient = $this->createMock(HttpClientInterface::class);
        $httpClient->method('request')
            ->with('HEAD', $url, $this->anything())
            ->willReturn($response);

        $this->expectException(UnreachableUrlException::class);

        $service = $this->createUrlShortenerService(null, $validator, null, $httpClient);
        $service->shortenUrl($url);
    }

    public function testShortenUrlAccepts3xxRedirects(): void
    {
        $url = 'https://example.com/redirect';

        $validator = $this->createMock(ValidatorInterface::class);
        $validator->method('validate')->willReturn(new ConstraintViolationList());

        $response = $this->createMock(ResponseInterface::class);
        $response->method('getStatusCode')->willReturn(301);

        $httpClient = $this->createMock(HttpClientInterface::class);
        $httpClient->method('request')
            ->with('HEAD', $url, $this->anything())
            ->willReturn($response);

        $entityManager = $this->createMock(EntityManagerInterface::class);

        $repository = $this->createMock(ShortUrlRepository::class);
        $repository->method('findByOriginalUrl')->willReturn(null);

        $service = $this->createUrlShortenerService($repository, $validator, $entityManager, $httpClient);
        $shortUrl = $service->shortenUrl($url);

        $this->assertInstanceOf(ShortUrl::class, $shortUrl);
    }
}
