/* Dashboard page */
(function () {
  'use strict';

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  function monthKey(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
  }

  function monthLabel(key) {
    const parts = key.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    return d.toLocaleDateString('en-PH', { month: 'short', year: 'numeric' });
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function quantityByUnit(rows) {
    const groups = {};
    rows.forEach(function (row) {
      const unit = row.unit_symbol || 'unit';
      groups[unit] = (groups[unit] || 0) + Number(row.quantity_harvested || 0);
    });
    const parts = Object.keys(groups).map(function (unit) {
      return UI.number(groups[unit], 2).replace(/\.00$/, '') + ' ' + unit;
    });
    return parts.length ? parts.join(' · ') : '0';
  }

  function statusBadge(status) {
    return UI.badge(status, 'status');
  }

  function renderRecentPlantings(rows) {
    const body = document.getElementById('recentPlantings');
    if (!body) return;
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No planting records yet.</td></tr>';
      return;
    }
    body.innerHTML = rows.map(function (row) {
      return '<tr>' +
        '<td><div class="cell-title">' + UI.esc(row.crop_name) + '</div>' +
          '<div class="cell-sub">' + UI.esc(row.farm_name) + '</div></td>' +
        '<td class="d-none d-md-table-cell">' + UI.esc(row.farmer_name) + '</td>' +
        '<td class="num">' + UI.esc(UI.date(row.planting_date)) + '</td>' +
        '<td class="text-right">' + statusBadge(row.status_description) + '</td>' +
      '</tr>';
    }).join('');
  }

  function renderRecentHarvests(rows) {
    const body = document.getElementById('recentHarvests');
    if (!body) return;
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No harvest records yet.</td></tr>';
      return;
    }
    body.innerHTML = rows.map(function (row) {
      return '<tr>' +
        '<td><div class="cell-title">' + UI.esc(row.crop_name) + '</div>' +
          '<div class="cell-sub">' + UI.esc(row.farm_name) + '</div></td>' +
        '<td class="num">' + UI.esc(UI.number(row.quantity_harvested, 2)) + ' ' +
          UI.esc(row.unit_symbol) + '</td>' +
        '<td class="num d-none d-md-table-cell">' + UI.esc(UI.peso(row.estimated_value)) + '</td>' +
        '<td class="text-right">' + UI.esc(UI.date(row.harvest_date)) + '</td>' +
      '</tr>';
    }).join('');
  }

  function renderStatusChart(rows) {
    const canvas = document.getElementById('statusChart');
    if (!canvas || typeof Chart === 'undefined') return;
    const labels = rows.map(function (row) { return row.status_description; });
    const values = rows.map(function (row) { return Number(row.planting_count || 0); });
    const colors = {
      'Planned': '#2a6f97',
      'Growing': '#e8a33d',
      'Harvested': '#2f9757',
      'Failed': '#c2403a',
      'Abandoned': '#98a89d'
    };

    new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: labels.map(function (label) { return colors[label] || '#b9c9be'; }),
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 8,
              padding: 14,
              font: { size: 11, family: 'Inter' }
            }
          },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                const total = ctx.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                const pct = total ? Math.round((ctx.parsed / total) * 100) : 0;
                return ' ' + ctx.label + ': ' + ctx.parsed + ' (' + pct + '%)';
              }
            }
          }
        }
      }
    });
  }

  function renderMonthlyChart(rows) {
    const canvas = document.getElementById('monthlyChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const values = {};
    rows.forEach(function (row) { values[row.month] = row; });

    const now = new Date();
    const keys = [];
    for (let i = 5; i >= 0; i -= 1) {
      keys.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
    }

    const labels = keys.map(monthLabel);
    const totals = keys.map(function (key) {
      return values[key] ? Number(values[key].total_value || 0) : 0;
    });
    const counts = keys.map(function (key) {
      return values[key] ? Number(values[key].harvest_count || 0) : 0;
    });

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Estimated harvest value',
          data: totals,
          backgroundColor: 'rgba(47, 151, 87, .82)',
          hoverBackgroundColor: '#1c6238',
          borderRadius: 8,
          maxBarThickness: 46
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return ' Value: ' + UI.peso(ctx.parsed.y) + '  ·  ' + counts[ctx.dataIndex] + ' harvest record(s)';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 10.5, family: 'Inter' }, color: '#66786c' }
          },
          y: {
            beginAtZero: true,
            grid: { color: '#eef3ee' },
            border: { display: false },
            ticks: {
              font: { size: 10.5, family: 'Inter' },
              color: '#66786c',
              callback: function (value) { return '\u20B1' + UI.number(value); }
            }
          }
        }
      }
    });
  }

  async function boot() {
    const auth = await Auth.requireAuth();
    if (!auth) return;
    initLayout('dashboard', auth.profile);

    const firstName = String(auth.profile.full_name || '').trim().split(/\s+/)[0] || 'there';
    setText('welcomeName', greeting() + ', ' + firstName + '!');
    setText('todayLabel', new Date().toLocaleDateString('en-PH', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    }));

    try {
      const [farmerCount, farmCount, cropCount, plantingCount, harvestCount] = await Promise.all([
        API.count('farmer'),
        API.count('farm'),
        API.count('crop'),
        API.count('planting'),
        API.count('harvest')
      ]);

      setText('statFarmers', UI.number(farmerCount));
      setText('statFarms', UI.number(farmCount));
      setText('statCrops', UI.number(cropCount));
      setText('statPlantings', UI.number(plantingCount));
      setText('statHarvests', UI.number(harvestCount));

      const [recentPlantings, recentHarvests, statusRows, monthlyRows, harvestRows] = await Promise.all([
        db.from('v_planting').select('*').order('planting_date', { ascending: false }).limit(6),
        db.from('v_harvest').select('*').order('harvest_date', { ascending: false }).limit(6),
        db.from('v_planting_status_summary').select('*').order('status_id'),
        db.from('v_harvest_monthly').select('*').order('month', { ascending: true }),
        API.fetchAll('v_harvest', {
          select: 'quantity_harvested, unit_symbol, estimated_value'
        })
      ]);

      [recentPlantings, recentHarvests, statusRows, monthlyRows].forEach(function (res) {
        if (res.error) throw res.error;
      });

      renderRecentPlantings(recentPlantings.data || []);
      renderRecentHarvests(recentHarvests.data || []);
      renderStatusChart(statusRows.data || []);
      renderMonthlyChart(monthlyRows.data || []);

      const totalValue = harvestRows.reduce(function (sum, row) {
        return sum + Number(row.estimated_value || 0);
      }, 0);

      setText('statQuantity', quantityByUnit(harvestRows));
      setText('statValue', UI.peso(totalValue));
      setText('statHarvestNote', UI.number(harvestCount) + ' harvest records · all time');
      setText('statFarmNote', UI.number(farmCount) + ' registered farms');

      const growing = (statusRows.data || []).filter(function (row) {
        return row.status_description === 'Growing';
      })[0];
      setText('statGrowing', growing ? UI.number(growing.planting_count) : '0');
    } catch (error) {
      console.error('[AgriSys] dashboard failed', error);
      UI.toast('Some dashboard information could not be loaded. ' + API.friendlyError(error), 'danger');
    }
  }

  boot();
})();
