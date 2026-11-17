<?php
declare(strict_types=1);

require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/SupabaseAuthClient.php';

final class Auth
{
    private const SESSION_LIFETIME = 28800;

    public static function startSession(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
        ini_set('session.gc_maxlifetime', (string) self::SESSION_LIFETIME);
        session_set_cookie_params([
            'lifetime' => self::SESSION_LIFETIME,
            'path' => '/',
            'secure' => self::isHttps(),
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();

        if (isset($_SESSION['logged_in_at']) && time() - (int) $_SESSION['logged_in_at'] > self::SESSION_LIFETIME) {
            self::logout();
            session_start();
        }
    }

    public static function userId(): ?string
    {
        self::startSession();
        $id = $_SESSION['user_id'] ?? null;
        return is_string($id) ? $id : null;
    }

    public static function isLoggedIn(): bool
    {
        return self::userId() !== null;
    }

    public static function csrfToken(): string
    {
        self::startSession();
        if (!isset($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return (string) $_SESSION['csrf_token'];
    }

    public static function verifyCsrf(?string $token): bool
    {
        self::startSession();
        return is_string($token) &&
            isset($_SESSION['csrf_token']) &&
            hash_equals((string) $_SESSION['csrf_token'], $token);
    }

    public static function signIn(string $email, string $password): array
    {
        self::startSession();
        $user = (new SupabaseAuthClient())->signIn(trim($email), $password);

        session_regenerate_id(true);
        $_SESSION['user_id'] = (string) $user['id'];
        $_SESSION['user_email'] = (string) ($user['email'] ?? $email);
        $_SESSION['logged_in_at'] = time();
        unset($_SESSION['csrf_token']);

        try {
            $profile = self::profile();
        } catch (Throwable $error) {
            self::logout();
            throw $error;
        }

        if ($profile === null) {
            self::logout();
            throw new DomainException('Your account profile is missing. Contact the administrator.');
        }

        return $profile;
    }

    public static function profile(): ?array
    {
        $userId = self::userId();
        if ($userId === null) {
            return null;
        }

        $database = new Database();
        return $database->asAuthenticatedUser($userId, function (PDO $connection) use ($userId): ?array {
            $statement = $connection->prepare(
                'SELECT id, email, full_name, role, created_at FROM public.profiles WHERE id = :id'
            );
            $statement->execute(['id' => $userId]);
            $profile = $statement->fetch();
            return $profile === false ? null : $profile;
        });
    }

    public static function requirePage(): array
    {
        if (!self::isLoggedIn()) {
            $target = $_SERVER['REQUEST_URI'] ?? '/dashboard.php';
            $_SESSION['redirect_after_login'] = $target;
            header('Location: ' . self::appPath('index.php'));
            exit;
        }

        $profile = self::profile();
        if ($profile === null) {
            self::logout();
            header('Location: ' . self::appPath('index.php'));
            exit;
        }

        return $profile;
    }

    public static function requireAdminPage(): array
    {
        $profile = self::requirePage();
        if (($profile['role'] ?? '') !== 'admin') {
            http_response_code(403);
            exit('Administrator access required.');
        }
        return $profile;
    }

    public static function logout(): void
    {
        self::startSession();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires' => time() - 42000,
                'path' => $params['path'],
                'domain' => $params['domain'],
                'secure' => $params['secure'],
                'httponly' => $params['httponly'],
                'samesite' => 'Lax',
            ]);
        }
        session_destroy();
    }

    private static function isHttps(): bool
    {
        return isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== '' && $_SERVER['HTTPS'] !== 'off';
    }

    private static function appPath(string $file): string
    {
        $directory = str_replace('\\', '/', dirname((string) ($_SERVER['SCRIPT_NAME'] ?? '/')));
        return ($directory === '/' ? '' : rtrim($directory, '/')) . '/' . $file;
    }
}
