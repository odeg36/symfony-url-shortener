<?php

declare(strict_types=1);

namespace App\Exception;

final class ShortUrlNotFoundException extends \RuntimeException
{
    public function __construct(string $shortCode)
    {
        parent::__construct(
            sprintf(
                'The shortened URL "%s" was not found. Please check the code and try again.',
                $shortCode
            )
        );
    }
}
