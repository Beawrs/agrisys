<?php
require_once __DIR__ . '/includes/bootstrap.php';
Auth::requireAdminPage();
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>User Accounts · AgriSys</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
  <link href="css/styles.css" rel="stylesheet">
</head>
<body>

<div class="app-shell">
  <aside class="sidebar" id="sidebar"></aside>
  <div class="sidebar-backdrop" id="sidebarBackdrop"></div>

  <div class="app-body">
    <header class="topbar" id="topbar"></header>

    <main class="page-content">
      <div class="page-head">
        <div>
          <h1>User Accounts <span class="badge-soft badge-grey ms-2" id="userCount">0 accounts</span></h1>
          <p>Manage who can sign in and what each account is allowed to do.</p>
        </div>
        <div class="spacer"></div>
        <button class="btn btn-light" id="refreshUsers"><i class="bi bi-arrow-clockwise me-1"></i>Refresh</button>
      </div>

      <div class="alert alert-info mb-4">
        <strong><i class="bi bi-info-circle me-1"></i>How accounts work.</strong>
        Create login accounts in <strong>Supabase → Authentication → Users → Add user</strong>.
        Every new account starts as <strong>Staff</strong> and gets a profile automatically.
        Use this page to promote a trusted user to <strong>Administrator</strong>.
        Staff can add and edit records; only Administrators can delete records and manage roles.
      </div>

      <div class="panel">
        <div class="panel-head">
          <div class="filter-bar w-100">
            <div class="search-box">
              <i class="bi bi-search"></i>
              <input type="search" class="form-control" id="userSearch" placeholder="Search by name or email…" autocomplete="off">
            </div>
            <div class="filter-field">
              <label for="roleFilter">Role</label>
              <select class="form-select" id="roleFilter">
                <option value="">All roles</option>
                <option value="admin">Administrator</option>
                <option value="staff">Staff</option>
              </select>
            </div>
          </div>
        </div>
        <div class="table-shell">
          <table class="table align-middle">
            <thead>
              <tr>
                <th>Account</th>
                <th>Current role</th>
                <th class="d-none d-md-table-cell">Created</th>
                <th class="text-right">Change role</th>
              </tr>
            </thead>
            <tbody id="userRows">
              <tr><td colspan="4"><div class="table-loading">Loading accounts…</div></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="js/config.js"></script>
<script src="js/ui.js"></script>
<script src="js/api.js"></script>
<script src="js/auth.js"></script>
<script src="js/pages/users.js"></script>
</body>
</html>
