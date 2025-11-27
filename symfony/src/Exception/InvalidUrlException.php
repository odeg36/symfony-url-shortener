<?php

declare(strict_types=1);

namespace App\Exception;

use RuntimeException;

final class InvalidUrlException extends RuntimeException
{
    public function __construct(string $url)
    {
        parent::__construct(
            sprintf(
                'The URL "%s" is not valid. Please provide a valid HTTP or HTTPS URL.',
                $url
            )
        );
    }
}
