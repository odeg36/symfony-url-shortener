FROM php:8.4-fpm

RUN apt-get update && apt-get install -y \
    git zip unzip libpq-dev libonig-dev libxml2-dev curl libicu-dev \
    && docker-php-ext-configure intl \
    && docker-php-ext-install pdo pdo_pgsql intl

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# provide a small wait-for script (optional)
COPY .docker/php/wait-for-db.sh /usr/local/bin/wait-for-db
RUN chmod +x /usr/local/bin/wait-for-db

# Install Symfony CLI
RUN curl -1sLf 'https://dl.cloudsmith.io/public/symfony/stable/setup.deb.sh' | bash && \
    apt-get install -y symfony-cli

RUN curl -sS https://get.symfony.com/cli/installer | bash \
&& mv /root/.symfony*/bin/symfony /usr/local/bin/symfony