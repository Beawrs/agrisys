# Setup and Deployment Guide

This guide takes you from an empty Supabase project to a running Agriculture Information System.

---

## 1. Create the Supabase project

1. Sign in at <https://supabase.com> and click **New project**.
2. Choose an organization, project name (e.g. `agrisys`), a strong database password, and the
   region closest to you (Singapore is a good choice for the Philippines).
3. Wait until the project finishes provisioning.

---

## 2. Create the database objects

1. In the Supabase dashboard, open **SQL Editor → New query**.
2. Paste the entire contents of `supabase/schema.sql` and click **Run**.
   - This creates the lookup tables, the five core tables, constraints, indexes, `updated_at`
     triggers, the profiles table, Row Level Security policies and the reporting views.
3. Create a second query, paste `supabase/seed.sql`, and click **Run**.
   - This loads the lookup values and the demo farmers/farms/crops/plantings/harvests.

> Both scripts are written for a fresh project. Running them again is safe for lookups and seed
> rows, but avoid re-running `schema.sql` after you have started editing table structures.

Verify in **Table Editor** that `farmer`, `farm`, `crop`, `planting` and `harvest` contain rows.

---

## 3. Create login accounts

The application does not allow public sign-up, which is intentional. Accounts are created by the
administrator:

1. Open **Authentication → Users**.
2. Click **Add user → Create new user**.
3. Enter an email and password. Leave **Auto Confirm User** enabled (or confirm the email).
4. Repeat for each staff member.

A database trigger automatically creates a row in `public.profiles` for every new auth user with the
role **staff**.

### Promote the administrator

Open **SQL Editor** and run (replace the email):

```sql
update public.profiles
set role = 'admin',
    full_name = 'System Administrator'
where email = 'admin@ctu.edu.ph';
```

Staff accounts need no action — they remain `staff`.

> You can also change roles later from **User Accounts** inside the application (Administrator only).
> An administrator cannot change their own role from that page, which prevents accidental lockout.

### If a profile is missing

If users were created before `schema.sql` was run, backfill their profiles:

```sql
insert into public.profiles (id, email, full_name)
select id,
       coalesce(email, ''),
       coalesce(nullif(raw_user_meta_data ->> 'full_name', ''), email, 'User')
from auth.users
on conflict (id) do nothing;
```

or simply delete and recreate the user in Authentication.

---

## 4. Configure the application

1. In Supabase, open **Project Settings → API**.
2. Copy:
   - **Project URL** (looks like `https://abcdefghijkl.supabase.co`)
   - **anon public** API key
3. Open `js/config.js` and replace the placeholders:

```js
window.APP_CONFIG = {
  SUPABASE_URL: 'https://abcdefghijkl.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

4. Save the file.

The anon key is designed for browser use. It does **not** bypass Row Level Security, so it is safe to
deploy. Never use the `service_role` key in this file.

---

## 5. Run the application

Opening `index.html` directly with `file://` mostly works, but browsers treat local files differently
for authentication persistence. Use a local server:

**Python (already installed on most systems):**

```powershell
cd "C:\Users\Luis\Documents\Default Project"
python -m http.server 5500
```

Then open <http://localhost:5500>.

**VS Code:** install the *Live Server* extension, right-click `index.html`, choose
**Open with Live Server**.

**XAMPP:** copy the project into `htdocs` and open `http://localhost/ap3-project/`.

---

## 6. Verify the installation

1. Open the login page and sign in with the administrator account.
2. The dashboard should show the seeded counts (15 farmers, 15 farms, 10 crops, 28 plantings,
   20 harvests) and two populated charts.
3. Open **Farmers** and try search, the Address filter, sorting, add, edit and delete.
4. Open **User Accounts** and confirm your role is Administrator.
5. Open **Reports**, choose *Estimated Value*, and click **Generate**, **Print** and **Export CSV**.

If the dashboard shows zeros, `seed.sql` was not run or Row Level Security is blocking your session
(check that you are signed in).

---

## 7. Deploy

The application is a static site, so any static host works.

### Netlify (fastest)

1. Go to <https://app.netlify.com/drop>.
2. Drag the project folder onto the page.
3. Open the generated URL and test the login.

### GitHub Pages

1. Create a repository and push the folder (excluding nothing; `config.js` is safe).
2. In **Settings → Pages**, deploy from the `main` branch root.
3. Open `https://<username>.github.io/<repo>/`.

### Vercel

1. Import the repository as a static project.
2. Framework preset: **Other**. Build command: none. Output directory: `.` (root).

After deploying, add the deployed URL to Supabase **Authentication → URL Configuration → Site URL**
and **Redirect URLs** (e.g. `https://your-site.netlify.app/**`). This keeps password-reset and
session redirects on the correct domain.

---

## 8. Operating notes

- **Delete restrictions.** Farmers with farms, farms with plantings, crops used in plantings and
  plantings with harvests cannot be deleted. The interface explains this and the database enforces it
  with `ON DELETE RESTRICT`.
- **Roles.** Staff cannot delete records or open User Accounts. RLS enforces this even if someone
  calls the API directly.
- **Audit columns.** `created_at` and `updated_at` are filled automatically. `updated_at` is
  refreshed by a trigger on every edit.
- **Harvest date rule.** The database rejects a harvest date earlier than its planting date, and the
  application checks it before saving.
- **Units.** Each crop has a unit of measure. Harvest quantity uses the crop’s unit, and estimated
  value = quantity × crop selling price.

---

## 9. Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| “Connect Supabase to continue” notice | `js/config.js` still has placeholders or the URL is not in the `https://xxxx.supabase.co` form. |
| “Incorrect email or password” | User does not exist or password is wrong. Reset it in Authentication → Users. |
| Login works but every table is empty | `seed.sql` was not run, or RLS blocks the user. Confirm the user is authenticated and has a profile row. |
| `relation "public.farmer" does not exist` | `schema.sql` was not run, or the PostgREST cache is stale. Re-run `notify pgrst, 'reload schema';`. |
| “new row violates row-level security policy” | The session expired or the account has no profile. Sign out and back in; check `profiles`. |
| Delete button missing | The signed-in account is Staff. Only Administrators can delete. |
| Charts do not render | Chart.js CDN blocked by the network. Check the browser console. |
| Reports empty | The default date range is 1 January of the current year to today. Widen the dates or reset. |
| `Could not find the table 'public.profiles'` | Run `schema.sql` completely, including the profiles section. |

Press <kbd>F12</kbd> → **Console** for detailed technical errors. The interface deliberately shows
only friendly messages.

---

## 10. Resetting the demo data

To reload the sample records, delete the transaction rows first, then re-run `seed.sql`:

```sql
truncate table public.harvest, public.planting, public.farm, public.farmer, public.crop restart identity cascade;
```

Then run `supabase/seed.sql` again. Lookup tables can be truncated separately if needed.

To remove all sample data but keep the structure:

```sql
truncate table public.harvest, public.planting, public.farm, public.farmer, public.crop restart identity cascade;
```
