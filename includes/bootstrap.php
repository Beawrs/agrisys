<?php
declare(strict_types=1);

require_once __DIR__ . '/Environment.php';
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/SupabaseAuthClient.php';
require_once __DIR__ . '/Auth.php';
require_once __DIR__ . '/AgricultureRepository.php';

Auth::startSession();
