<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

final class UrlShortenerControllerTest extends WebTestCase
{
    public function testShortenUrlSuccess(): void
    {
        $client = static::createClient();

        $client->request(
            'POST',
            '/api/urls/shorten',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['url' => 'https://www.example.com'])
        );

        $this->assertResponseIsSuccessful();
        $this->assertResponseHeaderSame('content-type', 'application/json');

        $data = json_decode($client->getResponse()->getContent(), true);

        $this->assertArrayHasKey('originalUrl', $data);
        $this->assertArrayHasKey('shortCode', $data);
        $this->assertArrayHasKey('shortUrl', $data);
        $this->assertArrayHasKey('clicks', $data);
        $this->assertArrayHasKey('createdAt', $data);
        $this->assertSame('https://www.example.com', $data['originalUrl']);
        $this->assertSame(0, $data['clicks']);
    }

    public function testShortenUrlReturnsSameCodeForSameUrl(): void
    {
        $client = static::createClient();
        $url = 'https://www.unique-test-url.com';

        // First request
        $client->request(
            'POST',
            '/api/urls/shorten',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['url' => $url])
        );

        $firstResponse = json_decode($client->getResponse()->getContent(), true);
        $firstShortCode = $firstResponse['shortCode'];

        // Second request with same URL
        $client->request(
            'POST',
            '/api/urls/shorten',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['url' => $url])
        );

        $secondResponse = json_decode($client->getResponse()->getContent(), true);
        $secondShortCode = $secondResponse['shortCode'];

        $this->assertSame($firstShortCode, $secondShortCode);
    }

    public function testShortenUrlWithInvalidUrl(): void
    {
        $client = static::createClient();

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
            'http://??/',
            'http://#',
            'http://##',
            'http://##/',
            'http:// shouldfail.com',
            'http://foo.bar?q=Spaces should be encoded',
            '//',
            '//a',
            '///a',
            '////',
            'http:///a',
            'rdar://1234',
            'h://test',
            ':// should fail',
            'http://foo.bar/foo(bar)baz quux',
            'http://-error-.invalid/',
            'http://a.b-.co',
            'http://0.0.0.0',
            'http://10.1.1.0',
            'http://10.1.1.255',
            'http://224.1.1.1',
            'http://1.1.1.1.1',
            'http://123.123.123',
            'http://.www.foo.bar/',
            'http://www.foo.bar./',
            'http://.www.foo.bar./',
            'javascript:alert(1)',
            'file:///etc/passwd',
            'data:text/html,<script>alert(1)</script>',
            'http://localhost',
            'http://127.0.0.1',
            'http://[::1]',
        ];

        foreach ($invalidUrls as $invalidUrl) {
            $client->request(
                'POST',
                '/api/urls/shorten',
                [],
                [],
                ['CONTENT_TYPE' => 'application/json'],
                json_encode(['url' => $invalidUrl])
            );

            $this->assertResponseStatusCodeSame(
                Response::HTTP_BAD_REQUEST,
                "URL '{$invalidUrl}' should be rejected but wasn't"
            );
        }
    }

    public function testShortenUrlWithEmptyUrl(): void
    {
        $client = static::createClient();

        $client->request(
            'POST',
            '/api/urls/shorten',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['url' => ''])
        );

        $this->assertResponseStatusCodeSame(Response::HTTP_BAD_REQUEST);
    }

    public function testResolveShortCode(): void
    {
        $client = static::createClient();
        $client->followRedirects(false);

        // First, create a short URL
        $client->request(
            'POST',
            '/api/urls/shorten',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['url' => 'https://www.resolve-test.com'])
        );

        $shortenResponse = json_decode($client->getResponse()->getContent(), true);
        $shortCode = $shortenResponse['shortCode'];

        // Now resolve it via API endpoint
        $client->request('GET', "/api/urls/{$shortCode}");

        $this->assertResponseRedirects('https://www.resolve-test.com');
        $this->assertResponseStatusCodeSame(Response::HTTP_FOUND);

        // Verify clicks were incremented by checking stats
        $client->request('GET', "/api/urls/{$shortCode}/stats");
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame(1, $data['clicks']);
    }

    public function testResolveNonExistentShortCode(): void
    {
        $client = static::createClient();
        $client->followRedirects(false);

        $client->request('GET', '/api/urls/nonexistent');

        $this->assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    public function testPublicShortUrlRedirect(): void
    {
        $client = static::createClient();
        $client->followRedirects(false);

        // Create a short URL
        $client->request(
            'POST',
            '/api/urls/shorten',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['url' => 'https://www.public-redirect-test.com'])
        );

        $shortenResponse = json_decode($client->getResponse()->getContent(), true);
        $shortCode = $shortenResponse['shortCode'];

        // Access the short URL via public route
        $client->request('GET', "/{$shortCode}");

        $this->assertResponseRedirects('https://www.public-redirect-test.com');
        $this->assertResponseStatusCodeSame(Response::HTTP_FOUND);

        // Verify clicks were tracked
        $client->request('GET', "/api/urls/{$shortCode}/stats");
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame(1, $data['clicks']);
    }

    public function testGetStatsForShortCode(): void
    {
        $client = static::createClient();

        // Create a short URL
        $client->request(
            'POST',
            '/api/urls/shorten',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['url' => 'https://www.stats-test.com'])
        );

        $shortenResponse = json_decode($client->getResponse()->getContent(), true);
        $shortCode = $shortenResponse['shortCode'];

        // Get stats
        $client->request('GET', "/api/urls/{$shortCode}/stats");

        $this->assertResponseIsSuccessful();

        $data = json_decode($client->getResponse()->getContent(), true);

        $this->assertArrayHasKey('clicks', $data);
        $this->assertSame(0, $data['clicks']); // Stats doesn't increment
    }

    public function testGetAllUrls(): void
    {
        $client = static::createClient();

        // Create a few URLs
        $urls = ['https://test1.com', 'https://test2.com', 'https://test3.com'];
        foreach ($urls as $url) {
            $client->request(
                'POST',
                '/api/urls/shorten',
                [],
                [],
                ['CONTENT_TYPE' => 'application/json'],
                json_encode(['url' => $url])
            );
        }

        // Get all URLs
        $client->request('GET', '/api/urls');

        $this->assertResponseIsSuccessful();

        $data = json_decode($client->getResponse()->getContent(), true);

        $this->assertArrayHasKey('data', $data);
        $this->assertArrayHasKey('pagination', $data);
        $this->assertIsArray($data['data']);
        $this->assertGreaterThanOrEqual(3, $data['pagination']['total']);
    }

    public function testGetAllUrlsWithPagination(): void
    {
        $client = static::createClient();

        // Get URLs with pagination
        $client->request('GET', '/api/urls?page=1&limit=5');

        $this->assertResponseIsSuccessful();

        $data = json_decode($client->getResponse()->getContent(), true);

        $this->assertArrayHasKey('pagination', $data);
        $this->assertSame(1, $data['pagination']['page']);
        $this->assertSame(5, $data['pagination']['limit']);
        $this->assertLessThanOrEqual(5, count($data['data']));
    }

    public function testClicksAreIncremented(): void
    {
        $client = static::createClient();
        $client->followRedirects(false);

        // Create a short URL
        $client->request(
            'POST',
            '/api/urls/shorten',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['url' => 'https://www.clicks-test.com'])
        );

        $shortenResponse = json_decode($client->getResponse()->getContent(), true);
        $shortCode = $shortenResponse['shortCode'];

        // Access the URL multiple times
        for ($i = 0; $i < 3; ++$i) {
            $client->request('GET', "/api/urls/{$shortCode}");
            $this->assertResponseStatusCodeSame(Response::HTTP_FOUND);
        }

        // Check stats
        $client->request('GET', "/api/urls/{$shortCode}/stats");
        $data = json_decode($client->getResponse()->getContent(), true);

        $this->assertSame(3, $data['clicks']);
    }

    public function testShortenUrlAcceptsNewTlds(): void
    {
        $client = static::createClient();

        // Test various modern TLDs including
        $urls = [
            'https://example.io',
            'https://myapp.dev',
            'https://site.app',
            'https://ai.company',
        ];

        foreach ($urls as $url) {
            $client->request(
                'POST',
                '/api/urls/shorten',
                [],
                [],
                ['CONTENT_TYPE' => 'application/json'],
                json_encode(['url' => $url])
            );

            $this->assertResponseIsSuccessful(
                "Failed to shorten URL: {$url}. Response: ".$client->getResponse()->getContent()
            );

            $data = json_decode($client->getResponse()->getContent(), true);
            $this->assertSame($url, $data['originalUrl']);
        }
    }
}
