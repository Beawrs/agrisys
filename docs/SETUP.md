# AgriSys setup and deployment

## 1. Prepare Supabase

1. Create a Supabase project.
2. In **SQL Editor**, run `supabase/schema.sql`, then `supabase/seed.sql`.
3. In **Authentication → Users**, add the staff and administrator accounts. The database trigger creates each account’s `public.profiles` row with the Staff role.
4. Promote your administrator in SQL Editor:

   ```sql
   update public.profiles
   set role = 'admin', full_name = 'System Administrator'
   where email = 'admin@example.com';
   ```

## 2. Configure PHP

1. Copy `.env.example` to `.env` in the project root.
2. In Supabase, open **Project Settings → API** and copy the Project URL and anon public key into `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
3. In Supabase, open **Project Settings → Database** and copy the PostgreSQL host, port, database name, user, and database password into `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`.
   - Use a direct connection when available. If your network cannot reach it, use the Supabase session/transaction pooler values.
   - Keep `.env` server-side and out of version control. The database password is not the anon key.
4. Ensure PHP 8.1+ has the `pdo_pgsql` and `curl` extensions enabled.

The PDO connection requires SSL and uses the database account only on the PHP server. Every application query runs in a transaction with the PostgreSQL `authenticated` role and the signed-in Supabase user’s ID, preserving the existing row-level security policies.

## 3. Run locally

In PowerShell, from the project folder:

```powershell
php -v
php -m
php -S localhost:8000
```

Confirm `pdo_pgsql` and `curl` appear in the module list, then open <http://localhost:8000>. XAMPP can also serve the project from its `htdocs` directory, provided those PHP extensions are enabled.

## 4. Verify

1. Sign in with an account created in Supabase Auth.
2. Check the dashboard counts and charts.
3. Use each module to search, filter, sort, add, edit, and view records.
4. Confirm a Staff user cannot delete records or access User Accounts.
5. Confirm an Administrator can delete records and change other users’ roles.
6. Generate and export each report.

## Troubleshooting

| Symptom | Check |
|---|---|
| PHP says `pdo_pgsql` is required | Enable/install the PHP PostgreSQL PDO extension, then restart PHP/Apache. |
| PHP says cURL is required | Enable/install the PHP cURL extension, then restart PHP/Apache. |
| `Missing required server configuration` | Confirm `.env` exists in the project root and contains the named setting. |
| Database connection fails | Verify the Supabase DB host, username, password, port, SSL/network access, and that `DB_USER` can assume the `authenticated` role. |
| Login is rejected | Check the Supabase URL/key, account password, and whether the user is confirmed in Supabase Auth. |
| Login succeeds but profile is missing | Confirm `supabase/schema.sql` ran and that `public.profiles` has a row for the Supabase Auth user. |
| Database reports permission/RLS errors | Confirm the schema grants and policies are present and that the connection user can `SET ROLE authenticated`. |
