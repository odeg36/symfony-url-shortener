<?php

declare(strict_types=1);

namespace App\Exception;

use RuntimeException;

final class ShortUrlPersistenceException extends RuntimeException
{
    public function __construct()
    {
        parent::__construct(
            'Unable to save the shortened URL. Please try again later.'
        );
    }
}
