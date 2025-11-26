<?php

declare(strict_types=1);

namespace App\Controller;

use App\Service\UrlShortenerService;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api')]
final class UrlShortenerController extends AbstractController
{
    public function __construct(
        private readonly UrlShortenerService $service,
    ) {
    }

    #[Route('/urls/shorten', name: 'shorten_url', methods: ['POST'])]
    #[OA\Post(
        path: '/api/urls/shorten',
        summary: 'Shorten a URL',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'url', type: 'string', example: 'https://www.example.com'),
                ],
                type: 'object'
            )
        ),
        tags: ['URL Shortener'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'URL shortened successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'originalUrl', type: 'string'),
                        new OA\Property(property: 'shortCode', type: 'string'),
                        new OA\Property(property: 'clicks', type: 'integer'),
                    ]
                )
            ),
        ]
    )]
    public function shorten(Request $request): JsonResponse
    {
        $content = $request->getContent();
        $decoded = json_decode($content, true);
        /** @var array<string, mixed> $data */
        $data = is_array($decoded) ? $decoded : [];
        $originalUrl = isset($data['url']) && is_string($data['url']) ? $data['url'] : null;

        $shortUrl = $this->service->shortenUrl($originalUrl);

        return $this->json($this->service->formatShortUrl($shortUrl));
    }

    #[Route('/urls', name: 'all_urls', methods: ['GET'])]
    #[OA\Get(
        path: '/api/urls',
        summary: 'Get all shortened URLs',
        tags: ['URL Shortener'],
        parameters: [
            new OA\Parameter(
                name: 'page',
                in: 'query',
                required: false,
                schema: new OA\Schema(type: 'integer', default: 1),
                description: 'Page number'
            ),
            new OA\Parameter(
                name: 'limit',
                in: 'query',
                required: false,
                schema: new OA\Schema(type: 'integer', default: 10),
                description: 'Items per page'
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated list of shortened URLs',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'data',
                            type: 'array',
                            items: new OA\Items(
                                properties: [
                                    new OA\Property(property: 'originalUrl', type: 'string'),
                                    new OA\Property(property: 'shortCode', type: 'string'),
                                    new OA\Property(property: 'shortUrl', type: 'string'),
                                    new OA\Property(property: 'clicks', type: 'integer'),
                                    new OA\Property(property: 'createdAt', type: 'string'),
                                ]
                            )
                        ),
                        new OA\Property(
                            property: 'pagination',
                            properties: [
                                new OA\Property(property: 'total', type: 'integer'),
                                new OA\Property(property: 'page', type: 'integer'),
                                new OA\Property(property: 'limit', type: 'integer'),
                                new OA\Property(property: 'totalPages', type: 'integer'),
                            ],
                            type: 'object'
                        ),
                    ]
                )
            ),
        ]
    )]
    public function all(Request $request): JsonResponse
    {
        $page = (int) $request->query->get('page', 1);
        $limit = (int) $request->query->get('limit', 10);

        $result = $this->service->getAllUrlsPaginated($page, $limit);

        return $this->json($result);
    }

    #[Route('/urls/{shortCode}/stats', name: 'short_url_stats', methods: ['GET'])]
    #[OA\Get(
        path: '/api/urls/{shortCode}/stats',
        summary: 'Get statistics for a shortened URL',
        tags: ['URL Shortener'],
        parameters: [
            new OA\Parameter(
                name: 'shortCode',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'string'),
                example: 'abc123'
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'URL statistics',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'originalUrl', type: 'string'),
                        new OA\Property(property: 'shortCode', type: 'string'),
                        new OA\Property(property: 'clicks', type: 'integer'),
                    ]
                )
            ),
        ]
    )]
    public function stats(string $shortCode): JsonResponse
    {
        $shortUrl = $this->service->resolveShortCode($shortCode);

        return $this->json($this->service->formatShortUrl($shortUrl));
    }

    #[Route('/urls/{shortCode}', name: 'resolve_url', methods: ['GET'])]
    #[OA\Get(
        path: '/api/urls/{shortCode}',
        summary: 'Resolve and redirect to the original URL (tracks clicks)',
        tags: ['URL Shortener'],
        parameters: [
            new OA\Parameter(
                name: 'shortCode',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'string'),
                example: 'abc123'
            ),
        ],
        responses: [
            new OA\Response(
                response: 302,
                description: 'Redirects to the original URL'
            ),
            new OA\Response(
                response: 404,
                description: 'Short URL not found'
            ),
        ]
    )]
    public function redirectShort(string $shortCode): RedirectResponse
    {
        $shortUrl = $this->service->resolveShortCode($shortCode);
        $this->service->incrementClicks($shortUrl);

        return $this->redirect($shortUrl->getOriginalUrl());
    }
}
