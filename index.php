<?php
require_once __DIR__ . '/includes/bootstrap.php';
if (Auth::isLoggedIn()) {
  header('Location: dashboard.php');
  exit;
}
$csrfToken = Auth::csrfToken();
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sign in · AgriSys</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
  <link href="css/styles.css" rel="stylesheet">
</head>
<body class="auth-body">

  <div class="auth-shell">
    <section class="auth-hero">
      <div class="hero-brand">
        <div class="brand-mark"><i class="bi bi-tree-fill"></i></div>
        <div class="brand-text">
          <strong>AgriSys</strong>
          <span>Agriculture Information System</span>
        </div>
      </div>

      <div>
        <span class="welcome-badge"><i class="bi bi-award"></i> AP3 Midterm Project</span>
        <h1>Smart records for a stronger harvest.</h1>
        <p class="hero-copy">
          Manage farmers, farms, crops, planting and harvest records in one secure dashboard.
          Built on a normalized Supabase PostgreSQL database.
        </p>
      </div>

      <div class="hero-points">
        <div class="hero-point">
          <i class="bi bi-database-check"></i>
          <div><strong>Normalized database</strong>Five related modules, lookup tables and referential integrity.</div>
        </div>
        <div class="hero-point">
          <i class="bi bi-bar-chart-line"></i>
          <div><strong>Live dashboard &amp; reports</strong>Every figure is retrieved from the database.</div>
        </div>
        <div class="hero-point">
          <i class="bi bi-shield-lock"></i>
          <div><strong>Secure access</strong>Role-based sign-in for Administrators and Staff.</div>
        </div>
      </div>
    </section>

    <section class="auth-panel">
      <div class="auth-mobile-brand">
        <div class="brand-mark"><i class="bi bi-tree-fill"></i></div>
        <div class="brand-text">
          <strong>AgriSys</strong>
          <span>Agriculture Information System</span>
        </div>
      </div>

      <div class="auth-card">
        <h2>Welcome back</h2>
        <p class="auth-sub">Sign in to manage your agricultural records.</p>

        <div id="loginAlert" class="alert alert-danger d-none" role="alert"></div>

        <form id="loginForm" autocomplete="on">
          <div class="mb-3">
            <label class="form-label" for="email">Email address</label>
            <input type="email" class="form-control" id="email" name="email"
                   placeholder="you@example.com" autocomplete="username" required>
          </div>
          <div class="mb-4">
            <label class="form-label" for="password">Password</label>
            <div class="position-relative">
              <input type="password" class="form-control pe-5" id="password" name="password"
                     placeholder="Enter your password" autocomplete="current-password" required>
              <button type="button" class="password-toggle" id="togglePassword" aria-label="Show password">
                <i class="bi bi-eye"></i>
              </button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary w-100" id="loginBtn">
            <i class="bi bi-box-arrow-in-right me-2"></i>Sign in
          </button>
        </form>

        <div class="auth-foot">
          User accounts are created by the system administrator.<br>
          © 2026 Cebu Technological University · AP3 Midterm Project
        </div>
      </div>
    </section>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script>window.APP_CSRF_TOKEN = <?= json_encode($csrfToken, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?>;</script>
  <script src="js/config.js"></script>
  <script src="js/ui.js"></script>
  <script src="js/pages/login.js"></script>
</body>
</html>
