<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/bootstrap.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function authJson(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

$operation = (string) ($_GET['op'] ?? '');

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && $operation === 'session') {
        $profile = Auth::profile();
        if ($profile === null) {
            authJson(['error' => 'Sign in required.'], 401);
        }
        authJson(['user' => $profile, 'csrfToken' => Auth::csrfToken()]);
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        authJson(['error' => 'Method not allowed.'], 405);
    }

    $input = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($input) || !Auth::verifyCsrf($input['csrfToken'] ?? null)) {
        authJson(['error' => 'Invalid security token. Reload the page and try again.'], 403);
    }

    if ($operation === 'login') {
        $email = trim((string) ($input['email'] ?? ''));
        $password = (string) ($input['password'] ?? '');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
            authJson(['error' => 'Enter a valid email address and password.'], 422);
        }

        $profile = Auth::signIn($email, $password);
        $redirect = (string) ($_SESSION['redirect_after_login'] ?? 'dashboard.php');
        unset($_SESSION['redirect_after_login']);
        if ($redirect === '' || preg_match('/^(?:[a-z][a-z0-9+.-]*:)?\/\//i', $redirect)) {
            $redirect = 'dashboard.php';
        }
        authJson(['user' => $profile, 'redirect' => $redirect, 'csrfToken' => Auth::csrfToken()]);
    }

    if ($operation === 'logout') {
        Auth::logout();
        authJson(['ok' => true]);
    }

    authJson(['error' => 'Unknown authentication operation.'], 400);
} catch (DomainException $error) {
    authJson(['error' => $error->getMessage()], 401);
} catch (Throwable $error) {
    error_log('[AgriSys] authentication error: ' . $error->getMessage());
    authJson(['error' => 'Authentication service is unavailable. Check the server configuration.'], 500);
}
