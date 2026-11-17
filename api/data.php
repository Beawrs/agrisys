<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/bootstrap.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function dataJson(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

$userId = Auth::userId();
if ($userId === null) {
    dataJson(['error' => 'Your session has expired. Please sign in again.'], 401);
}

try {
    $repository = new AgricultureRepository(new Database());
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $resource = (string) ($_GET['resource'] ?? '');
        $filters = json_decode((string) ($_GET['filters'] ?? '[]'), true);
        $searchColumns = json_decode((string) ($_GET['searchColumns'] ?? '[]'), true);
        if (!is_array($filters) || !is_array($searchColumns)) {
            dataJson(['error' => 'Invalid query parameters.'], 400);
        }

        $options = [
            'select' => (string) ($_GET['select'] ?? '*'),
            'filters' => $filters,
            'search' => (string) ($_GET['search'] ?? ''),
            'searchColumns' => $searchColumns,
            'order' => (string) ($_GET['order'] ?? ''),
            'ascending' => isset($_GET['ascending']) && $_GET['ascending'] === 'true',
            'limit' => (int) ($_GET['limit'] ?? 100),
            'offset' => (int) ($_GET['offset'] ?? 0),
        ];
        dataJson($repository->list($userId, $resource, $options));
    }

    if ($method !== 'POST') {
        dataJson(['error' => 'Method not allowed.'], 405);
    }

    $input = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($input)) {
        dataJson(['error' => 'Invalid request body.'], 400);
    }
    if (!Auth::verifyCsrf($input['csrfToken'] ?? null)) {
        dataJson(['error' => 'Invalid security token. Reload the page and try again.'], 403);
    }

    $operation = (string) ($input['op'] ?? '');
    $resource = (string) ($input['resource'] ?? '');
    $data = $input['data'] ?? [];
    if (!is_array($data)) {
        dataJson(['error' => 'Invalid record data.'], 400);
    }

    if ($operation === 'insert') {
        dataJson(['data' => $repository->insert($userId, $resource, $data)], 201);
    }
    if ($operation === 'update') {
        dataJson([
            'data' => $repository->update(
                $userId,
                $resource,
                (string) ($input['id'] ?? ''),
                $data
            ),
        ]);
    }
    if ($operation === 'delete') {
        $repository->delete($userId, $resource, (string) ($input['id'] ?? ''));
        dataJson(['ok' => true]);
    }

    dataJson(['error' => 'Unknown data operation.'], 400);
} catch (InvalidArgumentException $error) {
    dataJson(['error' => $error->getMessage()], 400);
} catch (DomainException $error) {
    dataJson(['error' => $error->getMessage()], 403);
} catch (PDOException $error) {
    $state = (string) $error->getCode();
    error_log('[AgriSys] database error ' . $state . ': ' . $error->getMessage());

    $message = 'The database operation could not be completed.';
    if ($state === '23503') {
        $message = 'This record is linked to other records. Remove or reassign them first.';
    } elseif ($state === '23505') {
        $message = 'A record with the same unique value already exists.';
    } elseif ($state === '23514' || $state === '23502') {
        $message = 'Some values are missing or outside the allowed range.';
    } elseif ($state === '42501') {
        $message = 'Your account is not allowed to perform this action.';
    }

    dataJson(['error' => $message, 'code' => $state], 400);
} catch (Throwable $error) {
    error_log('[AgriSys] data request error: ' . $error->getMessage());
    dataJson(['error' => 'The request could not be completed. Check the server configuration.'], 500);
}
