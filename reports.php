<?php
require_once __DIR__ . '/includes/bootstrap.php';
Auth::requirePage();
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Reports · AgriSys</title>
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
          <h1>Reports</h1>
          <p>Generate, print and export agricultural reports from live database queries.</p>
        </div>
      </div>

      <div class="panel mb-4 no-print">
        <div class="panel-head">
          <div class="report-tabs" id="reportTabs"></div>
        </div>
        <div class="panel-body">
          <div class="filter-bar">
            <div class="filter-field" id="reportFromField">
              <label for="reportFrom">From date</label>
              <input type="date" class="form-control" id="reportFrom">
            </div>
            <div class="filter-field" id="reportToField">
              <label for="reportTo">To date</label>
              <input type="date" class="form-control" id="reportTo">
            </div>
            <div class="filter-field" id="reportFarmField" style="min-width:240px">
              <label for="reportFarm">Farm</label>
              <select class="form-select" id="reportFarm"></select>
            </div>
            <button type="button" class="btn btn-primary" id="generateReport">
              <i class="bi bi-play-fill me-1"></i>Generate
            </button>
            <button type="button" class="btn btn-light" id="resetReport">
              <i class="bi bi-arrow-counterclockwise me-1"></i>Reset
            </button>
            <div style="flex:1"></div>
            <button type="button" class="btn btn-outline-primary" id="printReport">
              <i class="bi bi-printer me-1"></i>Print
            </button>
            <button type="button" class="btn btn-gold" id="exportReport">
              <i class="bi bi-download me-1"></i>Export CSV
            </button>
          </div>
        </div>
      </div>

      <div class="panel" id="reportPanel">
        <div class="panel-head">
          <div class="report-header">
            <h2 id="reportTitle">Report</h2>
            <p id="reportSubtitle">Choose a report above.</p>
          </div>
          <div class="spacer"></div>
          <span class="badge-soft badge-grey" id="reportMeta">All records</span>
        </div>
        <div class="panel-body">
          <div class="report-print-head">
            <h2 id="printTitle">Report</h2>
            <p>Cebu Technological University · Agriculture Information System</p>
            <p id="printMeta"></p>
          </div>

          <div class="stat-strip mb-4" id="reportSummary"></div>

          <div class="table-responsive">
            <table class="table align-middle">
              <thead id="reportHead"></thead>
              <tbody id="reportBody"></tbody>
              <tfoot id="reportFoot"></tfoot>
            </table>
          </div>
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
<script src="js/pages/reports.js"></script>
</body>
</html>
