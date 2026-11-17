<?php
require_once __DIR__ . '/includes/bootstrap.php';
Auth::requirePage();
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Dashboard · AgriSys</title>
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
      <section class="welcome mb-4">
        <div class="d-flex flex-wrap justify-content-between align-items-start gap-3">
          <div>
            <span class="welcome-badge"><i class="bi bi-calendar3"></i> <span id="todayLabel">Today</span></span>
            <h2 id="welcomeName">Welcome!</h2>
            <p>Here is what is happening across your farms today. All figures are pulled live from the Supabase database.</p>
          </div>
          <div class="welcome-actions">
            <a class="btn btn-gold" href="plantings.php"><i class="bi bi-calendar-plus me-1"></i>Record Planting</a>
            <a class="btn btn-light" href="harvests.php"><i class="bi bi-basket me-1"></i>Record Harvest</a>
          </div>
        </div>
      </section>

      <section class="kpi-grid mb-4">
        <div class="kpi">
          <div class="kpi-icon tint-green"><i class="bi bi-people"></i></div>
          <div class="kpi-label">Farmers</div>
          <div class="kpi-value" id="statFarmers">—</div>
          <div class="kpi-note">Registered in the system</div>
        </div>
        <div class="kpi">
          <div class="kpi-icon tint-blue"><i class="bi bi-map"></i></div>
          <div class="kpi-label">Farms</div>
          <div class="kpi-value" id="statFarms">—</div>
          <div class="kpi-note" id="statFarmNote">Registered farms</div>
        </div>
        <div class="kpi">
          <div class="kpi-icon tint-gold"><i class="bi bi-flower1"></i></div>
          <div class="kpi-label">Crops</div>
          <div class="kpi-value" id="statCrops">—</div>
          <div class="kpi-note">Crop master records</div>
        </div>
        <div class="kpi">
          <div class="kpi-icon tint-violet"><i class="bi bi-calendar-check"></i></div>
          <div class="kpi-label">Planting records</div>
          <div class="kpi-value" id="statPlantings">—</div>
          <div class="kpi-note">All planting transactions</div>
        </div>
        <div class="kpi">
          <div class="kpi-icon tint-teal"><i class="bi bi-basket"></i></div>
          <div class="kpi-label">Harvest records</div>
          <div class="kpi-value" id="statHarvests">—</div>
          <div class="kpi-note" id="statHarvestNote">Harvest transactions</div>
        </div>
      </section>

      <section class="row g-4 mb-4">
        <div class="col-lg-5">
          <div class="panel h-100">
            <div class="panel-head">
              <div>
                <h2>Plantings by status</h2>
                <p>Current state of all planting records</p>
              </div>
            </div>
            <div class="panel-body">
              <div class="chart-wrap"><canvas id="statusChart"></canvas></div>
            </div>
          </div>
        </div>
        <div class="col-lg-7">
          <div class="panel h-100">
            <div class="panel-head">
              <div>
                <h2>Estimated harvest value</h2>
                <p>Last six months, computed from quantity × selling price</p>
              </div>
              <div class="spacer"></div>
              <a class="btn btn-sm btn-outline-primary" href="reports.php">View reports <i class="bi bi-arrow-right ms-1"></i></a>
            </div>
            <div class="panel-body">
              <div class="chart-wrap"><canvas id="monthlyChart"></canvas></div>
            </div>
          </div>
        </div>
      </section>

      <section class="row g-4">
        <div class="col-xl-7">
          <div class="panel h-100">
            <div class="panel-head">
              <div>
                <h2>Recent planting records</h2>
                <p>Latest crop plantings encoded in the system</p>
              </div>
              <div class="spacer"></div>
              <a class="btn btn-sm btn-light" href="plantings.php">View all</a>
            </div>
            <div class="table-responsive">
              <table class="table mini-table align-middle">
                <thead>
                  <tr>
                    <th>Crop / Farm</th>
                    <th class="d-none d-md-table-cell">Farmer</th>
                    <th>Planted</th>
                    <th class="text-right">Status</th>
                  </tr>
                </thead>
                <tbody id="recentPlantings">
                  <tr><td colspan="4" class="text-center text-muted py-4">Loading…</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="col-xl-5">
          <div class="panel mb-4">
            <div class="panel-head">
              <div>
                <h2>Harvest at a glance</h2>
                <p>All-time harvest totals</p>
              </div>
            </div>
            <div class="panel-body">
              <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                <span class="text-muted">Total harvested quantity</span>
                <strong id="statQuantity" class="text-end ms-3">—</strong>
              </div>
              <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                <span class="text-muted">Estimated harvest value</span>
                <strong id="statValue" class="text-end ms-3">—</strong>
              </div>
              <div class="d-flex justify-content-between align-items-center py-2">
                <span class="text-muted">Plantings currently growing</span>
                <strong id="statGrowing" class="text-end ms-3">—</strong>
              </div>
              <div class="form-text mt-2">All quantities are in kilograms (kg).</div>
            </div>
          </div>

          <div class="panel">
            <div class="panel-head">
              <div>
                <h2>Recent harvests</h2>
                <p>Latest harvest transactions</p>
              </div>
              <div class="spacer"></div>
              <a class="btn btn-sm btn-light" href="harvests.php">View all</a>
            </div>
            <div class="table-responsive">
              <table class="table mini-table align-middle">
                <thead>
                  <tr>
                    <th>Crop / Farm</th>
                    <th>Quantity</th>
                    <th class="d-none d-md-table-cell">Value</th>
                    <th class="text-right">Date</th>
                  </tr>
                </thead>
                <tbody id="recentHarvests">
                  <tr><td colspan="4" class="text-center text-muted py-4">Loading…</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
<script src="js/config.js"></script>
<script src="js/ui.js"></script>
<script src="js/api.js"></script>
<script src="js/auth.js"></script>
<script src="js/pages/dashboard.js"></script>
</body>
</html>
