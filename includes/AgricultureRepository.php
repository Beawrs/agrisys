<?php
declare(strict_types=1);

require_once __DIR__ . '/Database.php';

final class AgricultureRepository
{
    private const RESOURCES = [
        'farmer' => [
            'table' => 'farmer',
            'pk' => 'farmer_id',
            'columns' => ['farmer_id', 'first_name', 'last_name', 'contact_number', 'address', 'date_registered', 'created_at', 'updated_at'],
            'write' => ['first_name', 'last_name', 'contact_number', 'address', 'date_registered'],
        ],
        'farm' => [
            'table' => 'farm',
            'pk' => 'farm_id',
            'columns' => ['farm_id', 'farmer_id', 'farm_name', 'location', 'area_hectares', 'soil_id', 'irrigation_id', 'created_at', 'updated_at'],
            'write' => ['farmer_id', 'farm_name', 'location', 'area_hectares', 'soil_id', 'irrigation_id'],
        ],
        'crop' => [
            'table' => 'crop',
            'pk' => 'crop_id',
            'columns' => ['crop_id', 'crop_name', 'variety', 'category_id', 'growing_period_days', 'season_id', 'created_at', 'updated_at'],
            'write' => ['crop_name', 'variety', 'category_id', 'growing_period_days', 'season_id'],
        ],
        'planting' => [
            'table' => 'planting',
            'pk' => 'planting_id',
            'columns' => ['planting_id', 'farm_id', 'crop_id', 'planting_date', 'area_planted', 'seed_quantity', 'expected_harvest_date', 'status_id', 'created_at', 'updated_at'],
            'write' => ['farm_id', 'crop_id', 'planting_date', 'area_planted', 'seed_quantity', 'expected_harvest_date', 'status_id'],
        ],
        'harvest' => [
            'table' => 'harvest',
            'pk' => 'harvest_id',
            'columns' => ['harvest_id', 'planting_id', 'harvest_date', 'quantity_kg', 'selling_price_per_kg', 'grade_id', 'remark_id', 'created_at', 'updated_at'],
            'write' => ['planting_id', 'harvest_date', 'quantity_kg', 'selling_price_per_kg', 'grade_id', 'remark_id'],
        ],
        'profiles' => [
            'table' => 'profiles',
            'pk' => 'id',
            'columns' => ['id', 'email', 'full_name', 'role', 'created_at', 'updated_at'],
            'write' => ['role'],
        ],
        'v_farmer' => [
            'table' => 'v_farmer',
            'pk' => 'farmer_id',
            'columns' => ['farmer_id', 'first_name', 'last_name', 'full_name', 'contact_number', 'address', 'date_registered', 'created_at', 'updated_at', 'farm_count'],
            'write' => [],
        ],
        'v_farm' => [
            'table' => 'v_farm',
            'pk' => 'farm_id',
            'columns' => ['farm_id', 'farm_name', 'farmer_id', 'farmer_name', 'location', 'area_hectares', 'soil_id', 'soil_description', 'irrigation_id', 'irrigation_description', 'created_at', 'updated_at', 'planting_count'],
            'write' => [],
        ],
        'v_crop' => [
            'table' => 'v_crop',
            'pk' => 'crop_id',
            'columns' => ['crop_id', 'crop_name', 'variety', 'category_id', 'category_description', 'growing_period_days', 'season_id', 'season_description', 'created_at', 'updated_at', 'planting_count', 'planted_locations'],
            'write' => [],
        ],
        'v_planting' => [
            'table' => 'v_planting',
            'pk' => 'planting_id',
            'columns' => ['planting_id', 'farm_id', 'farm_name', 'location', 'farmer_id', 'farmer_name', 'crop_id', 'crop_name', 'variety', 'planting_date', 'area_planted', 'seed_quantity', 'expected_harvest_date', 'status_id', 'status_description', 'created_at', 'updated_at', 'harvest_count'],
            'write' => [],
        ],
        'v_harvest' => [
            'table' => 'v_harvest',
            'pk' => 'harvest_id',
            'columns' => ['harvest_id', 'planting_id', 'planting_date', 'farm_id', 'farm_name', 'location', 'farmer_id', 'farmer_name', 'crop_id', 'crop_name', 'harvest_date', 'quantity_kg', 'selling_price_per_kg', 'estimated_value', 'grade_id', 'grade_description', 'remark_id', 'remark_description', 'created_at', 'updated_at'],
            'write' => [],
        ],
        'v_planting_status_summary' => [
            'table' => 'v_planting_status_summary',
            'pk' => 'status_id',
            'columns' => ['status_id', 'status_description', 'planting_count'],
            'write' => [],
        ],
        'v_harvest_monthly' => [
            'table' => 'v_harvest_monthly',
            'pk' => 'month',
            'columns' => ['month', 'harvest_count', 'total_quantity_kg', 'total_value'],
            'write' => [],
        ],
        'soil_type' => [
            'table' => 'soil_type',
            'pk' => 'soil_id',
            'columns' => ['soil_id', 'soil_description'],
            'write' => [],
        ],
        'irrigation_type' => [
            'table' => 'irrigation_type',
            'pk' => 'irrigation_id',
            'columns' => ['irrigation_id', 'irrigation_description'],
            'write' => [],
        ],
        'crop_category' => [
            'table' => 'crop_category',
            'pk' => 'category_id',
            'columns' => ['category_id', 'category_description'],
            'write' => [],
        ],
        'growing_season' => [
            'table' => 'growing_season',
            'pk' => 'season_id',
            'columns' => ['season_id', 'season_description'],
            'write' => [],
        ],
        'planting_status' => [
            'table' => 'planting_status',
            'pk' => 'status_id',
            'columns' => ['status_id', 'status_description'],
            'write' => [],
        ],
        'quality_grade' => [
            'table' => 'quality_grade',
            'pk' => 'grade_id',
            'columns' => ['grade_id', 'grade_description'],
            'write' => [],
        ],
        'harvest_remark' => [
            'table' => 'harvest_remark',
            'pk' => 'remark_id',
            'columns' => ['remark_id', 'remark_description'],
            'write' => [],
        ],
    ];

    public function __construct(private Database $database)
    {
    }

    public function list(
        string $userId,
        string $resource,
        array $options = []
    ): array {
        $definition = $this->definition($resource);
        $columns = $this->selectedColumns($definition, $options['select'] ?? '*');
        $where = $this->buildWhere(
            $definition,
            $options['filters'] ?? [],
            (string) ($options['search'] ?? ''),
            $options['searchColumns'] ?? []
        );

        $order = trim((string) ($options['order'] ?? ''));
        if ($order === '') {
            $order = $definition['pk'];
        }
        if (!in_array($order, $definition['columns'], true)) {
            throw new InvalidArgumentException('Unsupported sort column.');
        }

        $limit = max(1, min((int) ($options['limit'] ?? 100), 1000));
        $offset = max(0, min((int) ($options['offset'] ?? 0), 1000000));
        $direction = !empty($options['ascending']) ? 'ASC' : 'DESC';
        $table = 'public."' . $definition['table'] . '"';
        $select = implode(', ', array_map([$this, 'identifier'], $columns));
        $queryParams = $where['params'];
        $countParams = $where['params'];

        return $this->database->asAuthenticatedUser(
            $userId,
            function (PDO $connection) use (
                $table,
                $select,
                $where,
                $order,
                $direction,
                $limit,
                $offset,
                $queryParams,
                $countParams
            ): array {
                $countStatement = $connection->prepare(
                    'SELECT COUNT(*) FROM ' . $table . $where['sql']
                );
                $countStatement->execute($countParams);
                $total = (int) $countStatement->fetchColumn();

                $statement = $connection->prepare(
                    'SELECT ' . $select . ' FROM ' . $table . $where['sql'] .
                    ' ORDER BY ' . $this->identifier($order) . ' ' . $direction .
                    ' LIMIT :row_limit OFFSET :row_offset'
                );
                foreach ($queryParams as $key => $value) {
                    $statement->bindValue(':' . $key, $value);
                }
                $statement->bindValue(':row_limit', $limit, PDO::PARAM_INT);
                $statement->bindValue(':row_offset', $offset, PDO::PARAM_INT);
                $statement->execute();

                return ['data' => $statement->fetchAll(), 'count' => $total];
            }
        );
    }

    public function insert(string $userId, string $resource, array $data): array
    {
        $definition = $this->definition($resource);
        $values = $this->writableValues($definition, $data);
        $columns = array_keys($values);
        $quoted = implode(', ', array_map([$this, 'identifier'], $columns));
        $placeholders = implode(', ', array_map(
            static function (string $column): string {
                return ':' . $column;
            },
            $columns
        ));
        $table = 'public."' . $definition['table'] . '"';

        return $this->database->asAuthenticatedUser(
            $userId,
            function (PDO $connection) use ($table, $quoted, $placeholders, $values): array {
                $statement = $connection->prepare(
                    'INSERT INTO ' . $table . ' (' . $quoted . ') VALUES (' . $placeholders . ') RETURNING *'
                );
                $statement->execute($values);
                return $statement->fetch();
            }
        );
    }

    public function update(string $userId, string $resource, string $id, array $data): array
    {
        $definition = $this->definition($resource);
        $values = $this->writableValues($definition, $data);
        $sets = [];
        foreach (array_keys($values) as $column) {
            $sets[] = $this->identifier($column) . ' = :v_' . $column;
        }
        $params = [];
        foreach ($values as $column => $value) {
            $params['v_' . $column] = $value;
        }
        $params['row_id'] = $id;
        $table = 'public."' . $definition['table'] . '"';
        $primaryKey = $this->identifier($definition['pk']);

        return $this->database->asAuthenticatedUser(
            $userId,
            function (PDO $connection) use ($table, $sets, $params, $primaryKey): array {
                $statement = $connection->prepare(
                    'UPDATE ' . $table . ' SET ' . implode(', ', $sets) .
                    ' WHERE ' . $primaryKey . ' = :row_id RETURNING *'
                );
                $statement->execute($params);
                $row = $statement->fetch();
                if ($row === false) {
                    throw new DomainException('Record not found or you are not allowed to update it.');
                }
                return $row;
            }
        );
    }

    public function delete(string $userId, string $resource, string $id): void
    {
        $definition = $this->definition($resource);
        if ($definition['write'] === [] || $resource === 'profiles') {
            throw new InvalidArgumentException('This record cannot be deleted.');
        }

        $table = 'public."' . $definition['table'] . '"';
        $primaryKey = $this->identifier($definition['pk']);
        $this->database->asAuthenticatedUser(
            $userId,
            function (PDO $connection) use ($table, $primaryKey, $id): void {
                $statement = $connection->prepare(
                    'DELETE FROM ' . $table . ' WHERE ' . $primaryKey . ' = :row_id'
                );
                $statement->execute(['row_id' => $id]);
                if ($statement->rowCount() === 0) {
                    throw new DomainException('Record not found or you are not allowed to delete it.');
                }
            }
        );
    }

    private function definition(string $resource): array
    {
        if (!isset(self::RESOURCES[$resource])) {
            throw new InvalidArgumentException('Unsupported data resource.');
        }
        return self::RESOURCES[$resource];
    }

    private function selectedColumns(array $definition, $requested): array
    {
        if ($requested === '*' || $requested === '' || $requested === null) {
            return $definition['columns'];
        }

        $columns = is_array($requested) ? $requested : explode(',', (string) $requested);
        $columns = array_values(array_filter(array_map('trim', $columns), static function ($column): bool {
            return $column !== '';
        }));

        if ($columns === []) {
            throw new InvalidArgumentException('Select at least one valid column.');
        }
        foreach ($columns as $column) {
            if (!in_array($column, $definition['columns'], true)) {
                throw new InvalidArgumentException('Unsupported select column.');
            }
        }
        return $columns;
    }

    private function writableValues(array $definition, array $data): array
    {
        $values = [];
        foreach ($data as $column => $value) {
            if (!is_string($column) || !in_array($column, $definition['write'], true)) {
                throw new InvalidArgumentException('Unsupported field.');
            }
            $values[$column] = $value;
        }

        if ($values === []) {
            throw new InvalidArgumentException('No editable fields were provided.');
        }
        return $values;
    }

    private function buildWhere(array $definition, array $filters, string $search, array $searchColumns): array
    {
        $clauses = [];
        $params = [];
        $filterIndex = 0;

        foreach ($filters as $filter) {
            if (!is_array($filter)) {
                throw new InvalidArgumentException('Invalid filter.');
            }
            $column = (string) ($filter['column'] ?? '');
            $operator = (string) ($filter['op'] ?? 'eq');
            $value = $filter['value'] ?? null;
            if ($value === null || $value === '') {
                continue;
            }
            if (!in_array($column, $definition['columns'], true)) {
                throw new InvalidArgumentException('Unsupported filter column.');
            }
            $sqlOperator = ['eq' => '=', 'gte' => '>=', 'lte' => '<='][$operator] ?? null;
            if ($sqlOperator === null) {
                throw new InvalidArgumentException('Unsupported filter operator.');
            }

            $placeholder = 'filter_' . $filterIndex++;
            $clauses[] = $this->identifier($column) . ' ' . $sqlOperator . ' :' . $placeholder;
            $params[$placeholder] = $value;
        }

        $term = trim(str_replace(['\\', '%', '_'], '', $search));
        if ($term !== '') {
            $validColumns = [];
            foreach ($searchColumns as $column) {
                if (!is_string($column) || !in_array($column, $definition['columns'], true)) {
                    throw new InvalidArgumentException('Unsupported search column.');
                }
                $validColumns[] = $column;
            }
            if ($validColumns === []) {
                throw new InvalidArgumentException('No searchable columns were provided.');
            }

            $matches = [];
            foreach ($validColumns as $index => $column) {
                $placeholder = 'search_' . $index;
                $matches[] = $this->identifier($column) . ' ILIKE :' . $placeholder;
                $params[$placeholder] = '%' . $term . '%';
            }
            $clauses[] = '(' . implode(' OR ', $matches) . ')';
        }

        return [
            'sql' => $clauses === [] ? '' : ' WHERE ' . implode(' AND ', $clauses),
            'params' => $params,
        ];
    }

    private function identifier(string $value): string
    {
        return '"' . str_replace('"', '""', $value) . '"';
    }
}
