# AgriSys — Agriculture Information System

**Cebu Technological University · AP3 Midterm Project**

A working web-based Agriculture Information System built on **Supabase PostgreSQL**. It manages
farmers, farms, crops, planting records and harvest records with role-based authentication, a live
dashboard, searchable/filterable data tables, reports, and full CRUD operations.

---

## Features

| Area | Implemented |
| --- | --- |
| Database | Normalized Supabase PostgreSQL schema (UNF → 3NF), PK/FK, UNIQUE, CHECK constraints, `created_at` / `updated_at` audit columns |
| Lookup tables | Sex, irrigation type, crop category, unit of measure, planting status, quality grade, harvest remark |
| Core modules (5 tables) | **FARMER**, **FARM**, **CROP**, **PLANTING**, **HARVEST** — one page per module with full CRUD, search, filter, sort and pagination |
| Related data | JOINed views (`v_farmer`, `v_farm`, `v_crop`, `v_planting`, `v_harvest`) |
| Dashboard | Five summary cards, plantings-by-status doughnut, six-month harvest value bar chart, recent plantings and harvests, total harvested quantity and estimated value |
| Authentication | Supabase Auth login, protected pages, Administrator and Staff roles, Row Level Security |
| Access control | Staff can create/update; only Administrators can delete and manage user roles |
| Validation | Required fields, numeric min/max, date logic, foreign-key existence, database constraints |
| Search / filter / sort | Server-side on every module, with pagination (10 rows/page) |
| Reports | Six reports with date-range and farm filters, print layout and CSV export |
| Feedback | Success toasts, inline form errors, friendly database error messages, delete confirmation dialogs |
| UI | Responsive Bootstrap 5 interface for desktop, tablet and mobile; print stylesheet |

---

## Tech stack

- **Database / Auth:** Supabase PostgreSQL + Supabase Auth + Row Level Security
- **Front end:** HTML5, CSS3, vanilla JavaScript (ES2017), Bootstrap 5.3, Bootstrap Icons, Chart.js 4
- **No build step** — open with any static web server or deploy to Netlify / GitHub Pages / Vercel

---

## Quick start

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run `supabase/schema.sql`, then `supabase/seed.sql`.
3. In **Authentication → Users**, add an account for yourself.
4. Promote it to Administrator (SQL Editor):
   ```sql
   update public.profiles set role = 'admin' where email = 'your-email@example.com';
   ```
5. Copy your **Project URL** and **anon public** key from **Project Settings → API** into
   `js/config.js`.
6. Serve the folder and open it in a browser:
   ```powershell
   python -m http.server 5500
   ```
   Then visit <http://localhost:5500>.

Detailed instructions, deployment notes and troubleshooting: **[docs/SETUP.md](docs/SETUP.md)**.

---

## Demo data

`supabase/seed.sql` loads:

- 10 farmers, 12 farms, 8 crops
- 18 planting records across planned / growing / harvested / failed statuses
- 18 harvest records (including multiple harvests for one planting)
- All seven lookup tables

The dashboard and reports populate immediately after seeding.

---

## Folder structure

```
.
├── index.html                  Login page
├── dashboard.html              Main page after sign-in
├── farmers.html                Farmer module
├── farms.html                  Farm module
├── crops.html                  Crop module
├── plantings.html              Planting records module
├── harvests.html               Harvest records module
├── reports.html                Reports
├── users.html                  Role management (Administrator only)
├── css/
│   └── styles.css              Shared design system and responsive/print styles
├── js/
│   ├── config.js               Supabase URL + anon key (edit this)
│   ├── db.js                   Supabase client bootstrap
│   ├── api.js                  Queries, lookups, friendly errors
│   ├── ui.js                   Formatting, toasts, modals, pagination
│   ├── auth.js                 Auth guard + sidebar/topbar layout
│   ├── crud.js                 Reusable CRUD engine for the five modules
│   └── pages/                  One script per page
├── supabase/
│   ├── schema.sql              Tables, constraints, triggers, RLS, views
│   └── seed.sql                Lookup values and demo records
└── docs/
    ├── SETUP.md                Database, account and deployment setup
    └── DOCUMENTATION.md        Full project documentation and normalization
```

---

## Roles

| Capability | Staff | Administrator |
| --- | :---: | :---: |
| View dashboard, modules and reports | ✅ | ✅ |
| Create and edit records | ✅ | ✅ |
| Delete records | — | ✅ |
| Change user roles / open User Accounts | — | ✅ |

New accounts always start as **Staff**. Row Level Security enforces deletion rights in the database
as well as in the interface.

---

## Security notes

- Only the **anon public** key belongs in `js/config.js`. Never put the `service_role` key in
  browser code.
- Row Level Security is enabled on every table; anonymous visitors have no access.
- Passwords are handled by Supabase Auth and are never stored in the application database.
- The app never prints raw connection strings or credentials to users.

---

## Documentation

- [Setup and deployment](docs/SETUP.md)
- [Project documentation, ERD, normalization, data dictionary, testing, user guide](docs/DOCUMENTATION.md)
