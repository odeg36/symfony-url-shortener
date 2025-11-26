<?php

declare(strict_types=1);

namespace App\Entity;

use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: 'App\Repository\ShortUrlRepository')]
#[ORM\Table(name: 'short_urls')]
class ShortUrl
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    // @SuppressWarnings(PHPMD.ShortVariable)
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 2048, unique: true)]
    private string $originalUrl;

    #[ORM\Column(type: 'string', length: 20, unique: true)]
    private readonly string $shortCode;

    #[ORM\Column(type: 'integer')]
    private int $clicks = 0;

    #[ORM\Column(type: 'datetime_immutable')]
    private readonly DateTimeImmutable $createdAt;

    public function __construct(string $originalUrl, string $shortCode)
    {
        $this->originalUrl = $originalUrl;
        $this->shortCode = $shortCode;
        $this->createdAt = new DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getOriginalUrl(): string
    {
        return $this->originalUrl;
    }

    public function getShortCode(): string
    {
        return $this->shortCode;
    }

    public function getClicks(): int
    {
        return $this->clicks;
    }

    public function incrementClicks(): void
    {
        ++$this->clicks;
    }

    public function getCreatedAt(): DateTimeImmutable
    {
        return $this->createdAt;
    }
}
