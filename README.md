# AgriSys — Agriculture Information System

An agriculture records system for Cebu Technological University’s AP3 project. It manages farmers, farms, crops, plantings, harvests, reports, and staff/admin access.

## Technology

- **PHP 8.1+** server pages, session authentication, and JSON endpoints
- **Object-oriented PHP** service classes: `Database`, `Auth`, `SupabaseAuthClient`, and `AgricultureRepository`
- **PDO_PGSQL** for parameterized PostgreSQL queries
- **Supabase Auth + PostgreSQL RLS** for login and database authorization
- HTML, CSS, Bootstrap, and JavaScript for the interactive UI

The browser no longer connects directly to Supabase. It sends requests to PHP; PHP uses PDO for database work and applies the signed-in user’s Supabase RLS context per transaction.

## Setup

1. In Supabase SQL Editor, run `supabase/schema.sql`, then `supabase/seed.sql`.
2. Create user accounts in Supabase **Authentication → Users**. The schema trigger creates each account’s `profiles` row as Staff.
3. Promote an administrator in SQL Editor:

   ```sql
   update public.profiles set role = 'admin' where email = 'admin@example.com';
   ```

4. Copy `.env.example` to `.env`. Fill in the Supabase Project URL, anon key, and PostgreSQL connection values. Use the database password from the Supabase project; never put it in JavaScript or commit `.env`.
5. Enable PHP’s `pdo_pgsql` and `curl` extensions.
6. From the project folder run:

   ```powershell
   php -S localhost:8000
   ```

7. Open <http://localhost:8000>.

See [docs/SETUP.md](docs/SETUP.md) for database connection and troubleshooting details.

## Project layout

```text
.
├── index.php                 Login page
├── dashboard.php             Protected dashboard
├── farmers.php, farms.php,
│   crops.php, plantings.php,
│   harvests.php               Protected CRUD modules
├── reports.php, users.php    Reports and admin role management
├── api/                      PHP JSON endpoints
├── includes/                 OOP PHP classes and bootstrap
├── js/                       Browser interactions and rendering
├── css/                      Shared styles
└── supabase/                 PostgreSQL schema and demo seed data
```

## Security

- PostgreSQL credentials are loaded by PHP from `.env` and are never sent to the browser.
- PHP authenticates users through Supabase Auth and uses server sessions with CSRF tokens.
- PDO values use prepared statements; SQL identifiers are restricted to allowlisted tables and columns.
- Each database transaction assumes PostgreSQL’s `authenticated` role and sets the signed-in user claims so the existing RLS policies are enforced.
- Only the `anon` key is used by the PHP authentication client. Do not configure a `service_role` key.
