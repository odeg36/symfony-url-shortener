<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Exception\InvalidUrlException;
use App\Exception\ShortUrlNotFoundException;
use App\Exception\ShortUrlPersistenceException;
use App\Exception\UnreachableUrlException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;

final class ApiExceptionListener
{
    public function onKernelException(ExceptionEvent $event): void
    {
        $exception = $event->getThrowable();

        $status = match (true) {
            $exception instanceof InvalidUrlException => 400,
            $exception instanceof UnreachableUrlException => 400,
            $exception instanceof ShortUrlNotFoundException => 404,
            $exception instanceof ShortUrlPersistenceException => 500,
            default => 500,
        };

        $response = new JsonResponse([
            'error' => $exception->getMessage(),
            'message' => $exception->getMessage(),
        ], $status);

        $event->setResponse($response);
    }
}
