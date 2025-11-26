<?php

declare(strict_types=1);

namespace App\Controller;

use App\Service\UrlShortenerService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\Routing\Annotation\Route;

final class HomeController extends AbstractController
{
    public function __construct(
        private readonly UrlShortenerService $service,
    ) {
    }

    #[Route('/', name: 'home', methods: ['GET'])]
    public function index(): RedirectResponse
    {
        return $this->redirect('/api/docs/stoplight');
    }

    #[Route('/{shortCode}', name: 'redirect_short', methods: ['GET'], priority: -1)]
    public function redirectToOriginal(string $shortCode): RedirectResponse
    {
        $shortUrl = $this->service->resolveShortCode($shortCode);
        $this->service->incrementClicks($shortUrl);

        return $this->redirect($shortUrl->getOriginalUrl());
    }
}
