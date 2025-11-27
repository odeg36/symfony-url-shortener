<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ShortUrl;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ShortUrl>
 */
class ShortUrlRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ShortUrl::class);
    }

    public function findByShortCode(string $shortCode): ?ShortUrl
    {
        $result = $this->findOneBy(['shortCode' => $shortCode]);

        return $result instanceof ShortUrl ? $result : null;
    }

    public function findByOriginalUrl(string $originalUrl): ?ShortUrl
    {
        $result = $this->findOneBy(['originalUrl' => $originalUrl]);

        return $result instanceof ShortUrl ? $result : null;
    }

    public function incrementClicks(ShortUrl $shortUrl): void
    {
        $shortUrl->incrementClicks();
        $this->getEntityManager()->flush();
    }
}
