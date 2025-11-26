<?php

declare(strict_types=1);

// ensure test database exists and schema is up-to-date

require dirname(__DIR__).'/config/bootstrap.php';

$kernel = new App\Kernel('test', true);
$kernel->boot();

$container = $kernel->getContainer();
$doctrine = $container->get('doctrine');

$connection = $doctrine->getConnection();
$databaseName = $connection->getDatabase();

try {
    $connection->getSchemaManager()->listTableNames();
} catch (Exception $e) {
    // database doesn't exist: create it
    $application = new Symfony\Bundle\FrameworkBundle\Console\Application($kernel);
    $application->setAutoExit(false);
    $application->run(new Symfony\Component\Console\Input\ArrayInput([
        'command' => 'doctrine:database:create',
        '--env' => 'test',
        '--if-not-exists' => true,
    ]));
    $application->run(new Symfony\Component\Console\Input\ArrayInput([
        'command' => 'doctrine:migrations:migrate',
        '--no-interaction' => true,
        '--env' => 'test',
    ]));
}
