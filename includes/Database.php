<?php
declare(strict_types=1);

require_once __DIR__ . '/Environment.php';

final class Database
{
    private ?PDO $connection = null;

    public function connection(): PDO
    {
        if ($this->connection instanceof PDO) {
            return $this->connection;
        }

        if (!extension_loaded('pdo_pgsql')) {
            throw new RuntimeException('The PHP pdo_pgsql extension is required.');
        }

        $host = Environment::requireValue('DB_HOST');
        $port = Environment::get('DB_PORT', '5432');
        $name = Environment::get('DB_NAME', 'postgres');
        $user = Environment::requireValue('DB_USER');
        $password = Environment::requireValue('DB_PASSWORD');
        $dsn = sprintf(
            'pgsql:host=%s;port=%s;dbname=%s;sslmode=require',
            $host,
            $port,
            $name
        );

        $this->connection = new PDO($dsn, $user, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);

        return $this->connection;
    }

    public function asAuthenticatedUser(string $userId, callable $callback)
    {
        $connection = $this->connection();
        $connection->beginTransaction();

        try {
            $connection->exec('SET LOCAL ROLE authenticated');
            $claims = json_encode([
                'aud' => 'authenticated',
                'role' => 'authenticated',
                'sub' => $userId,
            ], JSON_THROW_ON_ERROR);

            $statement = $connection->prepare(
                "SELECT set_config('request.jwt.claims', :claims, true), " .
                "set_config('request.jwt.claim.sub', :subject, true), " .
                "set_config('request.jwt.claim.role', 'authenticated', true)"
            );
            $statement->execute([
                'claims' => $claims,
                'subject' => $userId,
            ]);

            $result = $callback($connection);
            $connection->commit();
            return $result;
        } catch (Throwable $error) {
            if ($connection->inTransaction()) {
                $connection->rollBack();
            }
            throw $error;
        }
    }
}
