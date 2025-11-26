import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import type { ShortUrl, PaginatedResponse } from '../../types';

const API_BASE_URL = 'http://localhost:8080/api';

/**
 * Mock data for testing
 */
export const mockShortUrl: ShortUrl = {
  originalUrl: 'https://example.com/very-long-url',
  shortCode: 'abc123',
  shortUrl: 'http://localhost:8080/abc123',
  clicks: 0,
  createdAt: new Date().toISOString(),
};

export const mockPaginatedResponse: PaginatedResponse = {
  data: [
    mockShortUrl,
    {
      ...mockShortUrl,
      shortCode: 'xyz789',
      shortUrl: 'http://localhost:8080/xyz789',
      clicks: 5,
    },
  ],
  pagination: {
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1,
  },
};

/**
 * MSW request handlers
 */
export const handlers = [
  // Shorten URL
  http.post(`${API_BASE_URL}/urls/shorten`, async ({ request }) => {
    const body = await request.json() as { url: string };
    
    if (!body.url) {
      return HttpResponse.json(
        { message: 'URL is required' },
        { status: 400 }
      );
    }

    return HttpResponse.json(mockShortUrl);
  }),

  // Get all URLs
  http.get(`${API_BASE_URL}/urls`, ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';
    
    return HttpResponse.json({
      ...mockPaginatedResponse,
      pagination: {
        ...mockPaginatedResponse.pagination,
        page: parseInt(page, 10),
      },
    });
  }),

  // Get URL stats
  http.get(`${API_BASE_URL}/urls/:shortCode/stats`, ({ params }) => {
    const { shortCode } = params;
    
    if (shortCode === 'notfound') {
      return HttpResponse.json(
        { message: 'URL not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      ...mockShortUrl,
      shortCode: shortCode as string,
    });
  }),
];

/**
 * Setup MSW server for testing
 */
export const server = setupServer(...handlers);
