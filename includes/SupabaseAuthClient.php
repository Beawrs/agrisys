<?php
declare(strict_types=1);

require_once __DIR__ . '/Environment.php';

final class SupabaseAuthClient
{
    public function signIn(string $email, string $password): array
    {
        $url = rtrim(Environment::requireValue('SUPABASE_URL'), '/');
        $key = Environment::requireValue('SUPABASE_ANON_KEY');
        $response = $this->request(
            $url . '/auth/v1/token?grant_type=password',
            $key,
            ['email' => $email, 'password' => $password]
        );

        if (
            !isset($response['user']['id']) ||
            !filter_var($response['user']['id'], FILTER_VALIDATE_REGEXP, [
                'options' => ['regexp' => '/^[0-9a-f-]{36}$/i'],
            ])
        ) {
            throw new RuntimeException('The authentication service returned an invalid user.');
        }

        return $response['user'];
    }

    private function request(string $url, string $key, array $payload): array
    {
        if (!function_exists('curl_init')) {
            throw new RuntimeException('The PHP cURL extension is required for Supabase Auth.');
        }

        $handle = curl_init($url);
        curl_setopt_array($handle, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload, JSON_THROW_ON_ERROR),
            CURLOPT_HTTPHEADER => [
                'apikey: ' . $key,
                'Content-Type: application/json',
                'Accept: application/json',
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ]);

        $body = curl_exec($handle);
        $status = (int) curl_getinfo($handle, CURLINFO_HTTP_CODE);
        $error = curl_error($handle);
        curl_close($handle);

        if ($body === false) {
            throw new RuntimeException('Could not reach the Supabase authentication service: ' . $error);
        }

        $decoded = json_decode($body, true);
        if (!is_array($decoded)) {
            throw new RuntimeException('Supabase Auth returned an invalid response.');
        }

        if ($status < 200 || $status >= 300) {
            $message = (string) ($decoded['msg'] ?? $decoded['message'] ?? $decoded['error_description'] ?? '');
            if (stripos($message, 'invalid login credentials') !== false) {
                throw new DomainException('Incorrect email or password.');
            }
            if (stripos($message, 'email not confirmed') !== false) {
                throw new DomainException('This account has not been confirmed.');
            }
            throw new DomainException($message !== '' ? $message : 'Sign in failed. Please try again.');
        }

        return $decoded;
    }
}
