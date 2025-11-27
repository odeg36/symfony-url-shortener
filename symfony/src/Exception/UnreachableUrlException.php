<?php

declare(strict_types=1);

namespace App\Exception;

use RuntimeException;

final class UnreachableUrlException extends RuntimeException
{
    public function __construct(string $url)
    {
        parent::__construct(
            sprintf(
                'The URL "%s" could not be reached. Please verify the URL is accessible and try again.',
                $url
            )
        );
    }
}
