<?php
declare(strict_types=1);

final class Environment
{
    private static bool $loaded = false;

    public static function load(): void
    {
        if (self::$loaded) {
            return;
        }

        self::$loaded = true;
        $file = dirname(__DIR__) . DIRECTORY_SEPARATOR . '.env';
        if (!is_readable($file)) {
            return;
        }

        foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) {
                continue;
            }

            [$name, $value] = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            if ($name === '' || getenv($name) !== false) {
                continue;
            }

            if (strlen($value) >= 2 && (
                ($value[0] === '"' && substr($value, -1) === '"') ||
                ($value[0] === "'" && substr($value, -1) === "'")
            )) {
                $value = substr($value, 1, -1);
            }

            putenv($name . '=' . $value);
            $_ENV[$name] = $value;
        }
    }

    public static function get(string $name, ?string $default = null): ?string
    {
        self::load();
        $value = getenv($name);
        return $value === false ? $default : $value;
    }

    public static function requireValue(string $name): string
    {
        $value = self::get($name);
        if ($value === null || trim($value) === '') {
            throw new RuntimeException('Missing required server configuration: ' . $name);
        }
        return trim($value);
    }
}
