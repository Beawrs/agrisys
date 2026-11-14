/* Reports page */
(function () {
  'use strict';

  const state = {
    current: 'farmers-farms',
    from: '',
    to: '',
    farmId: '',
    result: null,
    farmRows: []
  };

  const REPORTS = [
    { id: 'farmers-farms', label: 'Farmers & Farms', icon: 'bi-people', usesDate: false, usesFarm: false,
      description: 'Every registered farmer together with the farm lots they own.' },
    { id: 'crops-per-farm', label: 'Crops per Farm', icon: 'bi-flower1', usesDate: true, usesFarm: true,
      description: 'Which crops were planted on each farm, how often and over how much area.' },
    { id: 'plantings-status', label: 'Plantings by Status', icon: 'bi-kanban', usesDate: true, usesFarm: true,
      description: 'Planting records grouped by their current status.' },
    { id: 'harvests', label: 'Harvest Records', icon: 'bi-basket', usesDate: true, usesFarm: true,
      description: 'Detailed harvest transactions with quality and estimated value.' },
    { id: 'harvest-total', label: 'Total Harvest', icon: 'bi-box-seam', usesDate: true, usesFarm: true,
      description: 'Total harvested quantity per crop and unit of measure.' },
    { id: 'harvest-value', label: 'Estimated Value', icon: 'bi-cash-coin', usesDate: true, usesFarm: true,
      description: 'Estimated harvest value per crop based on quantity and selling price.' }
  ];

  const el = function (id) { return document.getElementById(id); };

  function pad(n) { return String(n).padStart(2, '0'); }

  function isoDate(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function sum(rows, key) {
    return rows.reduce(function (total, row) { return total + Number(row[key] || 0); }, 0);
  }

  function metaText(report) {
    if (!report.usesDate) return 'All records';
    if (!state.from && !state.to) return 'All dates';
    if (state.from && state.to) return 'From ' + UI.date(state.from) + ' to ' + UI.date(state.to);
    if (state.from) return 'From ' + UI.date(state.from);
    return 'Up to ' + UI.date(state.to);
  }

  function statusOrder() {
    return ['Planned', 'Growing', 'Harvested', 'Failed', 'Abandoned'];
  }

  function quantityText(rows) {
    const groups = {};
    rows.forEach(function (row) {
      const unit = row.unit_symbol || 'unit';
      groups[unit] = (groups[unit] || 0) + Number(row.quantity_harvested || 0);
    });
    const parts = Object.keys(groups).map(function (unit) {
      return UI.number(groups[unit], 2) + ' ' + unit;
    });
    return parts.length ? parts.join(' · ') : '0';
  }

  /* --------------------------------------------------------------- data */
  function plantingQuery() {
    return function (query) {
      let q = query;
      if (state.farmId) q = q.eq('farm_id', state.farmId);
      if (state.from) q = q.gte('planting_date', state.from);
      if (state.to) q = q.lte('planting_date', state.to);
      return q;
    };
  }

  function harvestQuery() {
    return function (query) {
      let q = query;
      if (state.farmId) q = q.eq('farm_id', state.farmId);
      if (state.from) q = q.gte('harvest_date', state.from);
      if (state.to) q = q.lte('harvest_date', state.to);
      return q;
    };
  }

  async function loadFarmersAndFarms() {
    const rows = await API.fetchAll('v_farm', { order: 'farmer_name', ascending: true });
    rows.sort(function (a, b) {
      const byFarmer = String(a.farmer_name).localeCompare(String(b.farmer_name));
      return byFarmer !== 0 ? byFarmer : String(a.farm_name).localeCompare(String(b.farm_name));
    });

    const farmers = {};
    rows.forEach(function (row) { farmers[row.farmer_id] = true; });

    return {
      title: 'Farmers and their Farms',
      subtitle: 'Every registered farmer together with the farm lots they own.',
      columns: [
        { label: 'Farmer', csv: function (r) { return r.farmer_name; }, render: function (r) {
          return '<div class="cell-title">' + UI.esc(r.farmer_name) + '</div>' +
            '<div class="cell-sub">Farmer #' + UI.esc(r.farmer_id) + '</div>';
        } },
        { label: 'Farm', csv: function (r) { return r.farm_name; }, render: function (r) {
          return UI.esc(r.farm_name);
        } },
        { label: 'Location', csv: function (r) { return r.location; }, render: function (r) { return UI.esc(r.location); } },
        { label: 'Area (ha)', align: 'right', csv: function (r) { return r.area_hectares; }, render: function (r) {
          return '<span class="num">' + UI.number(r.area_hectares, 2) + '</span>';
        } },
        { label: 'Irrigation', csv: function (r) { return r.irrigation_description; }, render: function (r) {
          return UI.esc(r.irrigation_description);
        } },
        { label: 'Plantings', align: 'right', csv: function (r) { return r.planting_count; }, render: function (r) {
          return '<span class="num">' + UI.number(r.planting_count) + '</span>';
        } }
      ],
      rows: rows,
      summary: [
        { label: 'Farmers', value: UI.number(Object.keys(farmers).length) },
        { label: 'Farms', value: UI.number(rows.length) },
        { label: 'Total area', value: UI.number(sum(rows, 'area_hectares'), 2) + ' ha' },
        { label: 'Avg. farm size', value: rows.length ? UI.number(sum(rows, 'area_hectares') / rows.length, 2) + ' ha' : '—' }
      ]
    };
  }

  async function loadCropsPerFarm() {
    const rows = await API.fetchAll('v_planting', {
      apply: plantingQuery(),
      order: 'planting_date',
      ascending: false
    });

    const groups = {};
    rows.forEach(function (row) {
      const key = row.farm_id + '|' + row.crop_id;
      if (!groups[key]) {
        groups[key] = {
          farm_id: row.farm_id,
          farm_name: row.farm_name,
          farmer_name: row.farmer_name,
          crop_id: row.crop_id,
          crop_name: row.crop_name,
          plantings: 0,
          area: 0,
          lastPlanted: row.planting_date,
          harvested: 0,
          growing: 0
        };
      }
      const group = groups[key];
      group.plantings += 1;
      group.area += Number(row.area_planted || 0);
      if (row.planting_date > group.lastPlanted) group.lastPlanted = row.planting_date;
      if (row.status_description === 'Harvested') group.harvested += 1;
      if (row.status_description === 'Growing') group.growing += 1;
    });

    const list = Object.keys(groups).map(function (key) { return groups[key]; });
    list.sort(function (a, b) {
      const byFarm = String(a.farm_name).localeCompare(String(b.farm_name));
      return byFarm !== 0 ? byFarm : String(a.crop_name).localeCompare(String(b.crop_name));
    });

    const farms = {};
    const crops = {};
    list.forEach(function (row) { farms[row.farm_id] = true; crops[row.crop_id] = true; });

    return {
      title: 'Crops Planted per Farm',
      subtitle: 'Crop combinations planted on each farm within the selected period.',
      columns: [
        { label: 'Farm', csv: function (r) { return r.farm_name; }, render: function (r) {
          return '<div class="cell-title">' + UI.esc(r.farm_name) + '</div>' +
            '<div class="cell-sub">' + UI.esc(r.farmer_name) + '</div>';
        } },
        { label: 'Crop', csv: function (r) { return r.crop_name; }, render: function (r) { return UI.esc(r.crop_name); } },
        { label: 'Plantings', align: 'right', csv: function (r) { return r.plantings; }, render: function (r) { return UI.number(r.plantings); } },
        { label: 'Total area (ha)', align: 'right', csv: function (r) { return r.area.toFixed(2); }, render: function (r) { return UI.number(r.area, 2); } },
        { label: 'Harvested', align: 'right', csv: function (r) { return r.harvested; }, render: function (r) {
          return '<span class="badge-soft badge-green">' + r.harvested + '</span>';
        } },
        { label: 'Growing', align: 'right', csv: function (r) { return r.growing; }, render: function (r) {
          return '<span class="badge-soft badge-gold">' + r.growing + '</span>';
        } },
        { label: 'Last planted', csv: function (r) { return r.lastPlanted; }, render: function (r) { return UI.esc(UI.date(r.lastPlanted)); } }
      ],
      rows: list,
      summary: [
        { label: 'Farm–crop combinations', value: UI.number(list.length) },
        { label: 'Farms involved', value: UI.number(Object.keys(farms).length) },
        { label: 'Crops involved', value: UI.number(Object.keys(crops).length) },
        { label: 'Total area', value: UI.number(sum(list, 'area'), 2) + ' ha' }
      ]
    };
  }

  async function loadPlantingsByStatus() {
    const rows = await API.fetchAll('v_planting', {
      apply: plantingQuery(),
      order: 'planting_date',
      ascending: false
    });

    const counts = {};
    rows.forEach(function (row) {
      if (!counts[row.status_description]) {
        counts[row.status_description] = { status: row.status_description, records: 0, area: 0 };
      }
      counts[row.status_description].records += 1;
      counts[row.status_description].area += Number(row.area_planted || 0);
    });

    const order = statusOrder();
    const list = order.map(function (status) {
      return counts[status] || { status: status, records: 0, area: 0 };
    });
    const total = rows.length;

    list.forEach(function (row) {
      row.share = total ? (row.records / total) * 100 : 0;
    });

    const top = list.slice().sort(function (a, b) { return b.records - a.records; })[0];

    return {
      title: 'Planting Records by Status',
      subtitle: 'Distribution of planting transactions across status values.',
      columns: [
        { label: 'Status', csv: function (r) { return r.status; }, render: function (r) { return UI.badge(r.status, 'status'); } },
        { label: 'Records', align: 'right', csv: function (r) { return r.records; }, render: function (r) { return '<span class="num">' + UI.number(r.records) + '</span>'; } },
        { label: 'Area (ha)', align: 'right', csv: function (r) { return r.area.toFixed(2); }, render: function (r) { return '<span class="num">' + UI.number(r.area, 2) + '</span>'; } },
        { label: 'Share', align: 'right', csv: function (r) { return r.share.toFixed(1) + '%'; }, render: function (r) { return UI.number(r.share, 1) + '%'; } }
      ],
      rows: list,
      summary: [
        { label: 'Total plantings', value: UI.number(total) },
        { label: 'Total area', value: UI.number(sum(rows, 'area_planted'), 2) + ' ha' },
        { label: 'Most common', value: top && top.records ? top.status : '—' },
        { label: 'Statuses used', value: UI.number(list.filter(function (r) { return r.records > 0; }).length) }
      ]
    };
  }

  async function loadHarvestRecords() {
    const rows = await API.fetchAll('v_harvest', {
      apply: harvestQuery(),
      order: 'harvest_date',
      ascending: false
    });

    return {
      title: 'Harvest Records',
      subtitle: 'Detailed harvest transactions within the selected period.',
      columns: [
        { label: 'Date', csv: function (r) { return r.harvest_date; }, render: function (r) { return UI.esc(UI.date(r.harvest_date)); } },
        { label: 'Farm', csv: function (r) { return r.farm_name; }, render: function (r) {
          return '<div class="cell-title">' + UI.esc(r.farm_name) + '</div>' +
            '<div class="cell-sub">Harvest #' + UI.esc(r.harvest_id) + '</div>';
        } },
        { label: 'Crop', csv: function (r) { return r.crop_name; }, render: function (r) { return UI.esc(r.crop_name); } },
        { label: 'Quantity', align: 'right', csv: function (r) { return r.quantity_harvested; }, render: function (r) {
          return '<span class="num">' + UI.number(r.quantity_harvested, 2) + '</span> ' + UI.esc(r.unit_symbol);
        } },
        { label: 'Quality', csv: function (r) { return r.grade_description; }, render: function (r) { return UI.badge(r.grade_description, 'grade'); } },
        { label: 'Remarks', csv: function (r) { return r.remark_description; }, render: function (r) { return UI.badge(r.remark_description, 'remark'); } },
        { label: 'Estimated value', align: 'right', csv: function (r) { return r.estimated_value; }, render: function (r) {
          return '<span class="num cell-title">' + UI.peso(r.estimated_value) + '</span>';
        } }
      ],
      rows: rows,
      summary: [
        { label: 'Harvest records', value: UI.number(rows.length) },
        { label: 'Total quantity', value: quantityText(rows) },
        { label: 'Estimated value', value: UI.peso(sum(rows, 'estimated_value')) },
        { label: 'Farms covered', value: UI.number(new Set(rows.map(function (r) { return r.farm_id; })).size) }
      ],
      footerHtml: '<tr>' +
        '<td colspan="6" class="text-right fw-semibold">Grand total estimated value</td>' +
        '<td class="text-right fw-semibold num">' + UI.peso(sum(rows, 'estimated_value')) + '</td>' +
      '</tr>'
    };
  }

  async function loadHarvestTotal() {
    const rows = await API.fetchAll('v_harvest', {
      apply: harvestQuery(),
      order: 'harvest_date',
      ascending: false
    });

    const groups = {};
    rows.forEach(function (row) {
      const key = row.crop_id + '|' + row.unit_id;
      if (!groups[key]) {
        groups[key] = {
          crop_name: row.crop_name,
          unit_symbol: row.unit_symbol,
          records: 0,
          quantity: 0,
          value: 0
        };
      }
      groups[key].records += 1;
      groups[key].quantity += Number(row.quantity_harvested || 0);
      groups[key].value += Number(row.estimated_value || 0);
    });

    const list = Object.keys(groups).map(function (key) { return groups[key]; });
    list.sort(function (a, b) { return b.quantity - a.quantity; });

    return {
      title: 'Total Harvested Quantity',
      subtitle: 'Total quantity harvested per crop and unit of measure.',
      columns: [
        { label: 'Crop', csv: function (r) { return r.crop_name; }, render: function (r) { return '<span class="cell-title">' + UI.esc(r.crop_name) + '</span>'; } },
        { label: 'Unit', csv: function (r) { return r.unit_symbol; }, render: function (r) { return UI.esc(r.unit_symbol); } },
        { label: 'Harvest records', align: 'right', csv: function (r) { return r.records; }, render: function (r) { return UI.number(r.records); } },
        { label: 'Total quantity', align: 'right', csv: function (r) { return r.quantity.toFixed(2); }, render: function (r) {
          return '<span class="num cell-title">' + UI.number(r.quantity, 2) + '</span>';
        } },
        { label: 'Estimated value', align: 'right', csv: function (r) { return r.value.toFixed(2); }, render: function (r) {
          return '<span class="num">' + UI.peso(r.value) + '</span>';
        } }
      ],
      rows: list,
      summary: [
        { label: 'Crops harvested', value: UI.number(list.length) },
        { label: 'Harvest records', value: UI.number(rows.length) },
        { label: 'Unit groups', value: UI.number(new Set(rows.map(function (r) { return r.unit_symbol; })).size) },
        { label: 'Estimated value', value: UI.peso(sum(rows, 'estimated_value')) }
      ]
    };
  }

  async function loadHarvestValue() {
    const rows = await API.fetchAll('v_harvest', {
      apply: harvestQuery(),
      order: 'harvest_date',
      ascending: false
    });

    const groups = {};
    rows.forEach(function (row) {
      if (!groups[row.crop_id]) {
        groups[row.crop_id] = {
          crop_name: row.crop_name,
          unit_symbol: row.unit_symbol,
          quantity: 0,
          value: 0,
          price: row.selling_price
        };
      }
      groups[row.crop_id].quantity += Number(row.quantity_harvested || 0);
      groups[row.crop_id].value += Number(row.estimated_value || 0);
    });

    const list = Object.keys(groups).map(function (key) { return groups[key]; });
    const grandTotal = list.reduce(function (total, row) { return total + row.value; }, 0);
    list.forEach(function (row) { row.share = grandTotal ? (row.value / grandTotal) * 100 : 0; });
    list.sort(function (a, b) { return b.value - a.value; });

    return {
      title: 'Estimated Harvest Value',
      subtitle: 'Value per crop, computed from harvested quantity and the crop selling price.',
      columns: [
        { label: 'Crop', csv: function (r) { return r.crop_name; }, render: function (r) { return '<span class="cell-title">' + UI.esc(r.crop_name) + '</span>'; } },
        { label: 'Unit', csv: function (r) { return r.unit_symbol; }, render: function (r) { return UI.esc(r.unit_symbol); } },
        { label: 'Quantity', align: 'right', csv: function (r) { return r.quantity.toFixed(2); }, render: function (r) { return UI.number(r.quantity, 2); } },
        { label: 'Selling price', align: 'right', csv: function (r) { return r.price; }, render: function (r) { return UI.esc(UI.peso(r.price)); } },
        { label: 'Estimated value', align: 'right', csv: function (r) { return r.value.toFixed(2); }, render: function (r) {
          return '<span class="num cell-title">' + UI.peso(r.value) + '</span>';
        } },
        { label: 'Share', align: 'right', csv: function (r) { return r.share.toFixed(1) + '%'; }, render: function (r) { return UI.number(r.share, 1) + '%'; } }
      ],
      rows: list,
      summary: [
        { label: 'Crops', value: UI.number(list.length) },
        { label: 'Harvest records', value: UI.number(rows.length) },
        { label: 'Total quantity', value: quantityText(rows) },
        { label: 'Estimated value', value: UI.peso(grandTotal) }
      ],
      footerHtml: '<tr>' +
        '<td colspan="4" class="text-right fw-semibold">Grand total estimated value</td>' +
        '<td class="text-right fw-semibold num">' + UI.peso(grandTotal) + '</td>' +
        '<td class="text-right fw-semibold num">100%</td>' +
      '</tr>'
    };
  }

  /* ------------------------------------------------------------- render */
  function applyReportFields() {
    const report = REPORTS.filter(function (r) { return r.id === state.current; })[0] || REPORTS[0];
    el('reportFromField').style.display = report.usesDate ? '' : 'none';
    el('reportToField').style.display = report.usesDate ? '' : 'none';
    el('reportFarmField').style.display = report.usesFarm ? '' : 'none';
  }

  function renderTabs() {
    const host = el('reportTabs');
    host.innerHTML = REPORTS.map(function (report) {
      return '<button type="button" class="report-tab' + (report.id === state.current ? ' active' : '') + '" ' +
        'data-report="' + report.id + '"><i class="bi ' + report.icon + '"></i>' + UI.esc(report.label) + '</button>';
    }).join('');

    applyReportFields();

    host.querySelectorAll('[data-report]').forEach(function (button) {
      button.addEventListener('click', function () {
        state.current = button.dataset.report;
        renderTabs();
        load();
      });
    });
  }

  function renderSummary(summary) {
    el('reportSummary').innerHTML = (summary || []).map(function (item) {
      return '<div><div class="lbl">' + UI.esc(item.label) + '</div>' +
        '<div class="val">' + UI.esc(item.value) + '</div></div>';
    }).join('');
  }

  function renderResult(result) {
    el('reportTitle').textContent = result.title;
    el('reportSubtitle').textContent = result.subtitle;

    const report = REPORTS.filter(function (r) { return r.id === state.current; })[0];
    const meta = metaText(report);
    el('reportMeta').textContent = meta + ' · ' + (state.farmId ? el('reportFarm').selectedOptions[0].textContent : 'All farms');

    el('printTitle').textContent = result.title;
    el('printMeta').textContent = meta + ' · Generated ' + new Date().toLocaleString('en-PH');

    renderSummary(result.summary);

    el('reportHead').innerHTML = '<tr>' + result.columns.map(function (column) {
      return '<th class="' + (column.align === 'right' ? 'text-right' : '') + '">' + UI.esc(column.label) + '</th>';
    }).join('') + '</tr>';

    const body = el('reportBody');
    if (!result.rows.length) {
      body.innerHTML = '<tr><td colspan="' + result.columns.length + '">' +
        '<div class="empty-state"><i class="bi bi-file-earmark-x"></i>' +
        '<strong>No data for this selection</strong><div>Try widening the date range or choosing another farm.</div></div>' +
      '</td></tr>';
    } else {
      body.innerHTML = result.rows.map(function (row) {
        return '<tr>' + result.columns.map(function (column) {
          return '<td class="' + (column.align === 'right' ? 'text-right' : '') + '">' + column.render(row) + '</td>';
        }).join('') + '</tr>';
      }).join('');
    }

    el('reportFoot').innerHTML = result.footerHtml || '';
    state.result = result;
  }

  function setLoading(isLoading) {
    const body = el('reportBody');
    if (isLoading) {
      body.innerHTML = '<tr><td colspan="8"><div class="table-loading">' +
        '<span class="spinner-border spinner-border-sm me-2"></span>Building report…</div></td></tr>';
      el('reportHead').innerHTML = '';
      el('reportFoot').innerHTML = '';
      el('reportSummary').innerHTML = '';
    }
  }

  /* --------------------------------------------------------------- load */
  async function load() {
    const report = REPORTS.filter(function (r) { return r.id === state.current; })[0];
    // Read the controls directly so Generate always uses exactly what is on screen.
    state.from = el('reportFrom').value;
    state.to = el('reportTo').value;
    state.farmId = el('reportFarm').value;
    const button = el('generateReport');
    UI.setBusy(button, true);
    setLoading(true);

    try {
      let result;
      switch (state.current) {
        case 'farmers-farms': result = await loadFarmersAndFarms(); break;
        case 'crops-per-farm': result = await loadCropsPerFarm(); break;
        case 'plantings-status': result = await loadPlantingsByStatus(); break;
        case 'harvests': result = await loadHarvestRecords(); break;
        case 'harvest-total': result = await loadHarvestTotal(); break;
        case 'harvest-value': result = await loadHarvestValue(); break;
        default: result = await loadFarmersAndFarms();
      }
      renderResult(result);
    } catch (error) {
      console.error('[AgriSys] report failed', error);
      el('reportBody').innerHTML =
        '<tr><td colspan="8"><div class="empty-state"><i class="bi bi-exclamation-triangle"></i>' +
        '<strong>Unable to build this report</strong><div>' + UI.esc(API.friendlyError(error)) + '</div></div></td></tr>';
      UI.toast(API.friendlyError(error), 'danger');
    } finally {
      UI.setBusy(button, false);
    }
  }

  /* ---------------------------------------------------------------- CSV */
  function csvCell(value) {
    const text = value === null || value === undefined ? '' : String(value);
    if (/[",\n\r]/.test(text)) return '"' + text.replace(/"/g, '""') + '"';
    return text;
  }

  function exportCsv() {
    if (!state.result) {
      UI.toast('Generate a report before exporting.', 'warning');
      return;
    }
    const result = state.result;
    const header = result.columns.map(function (column) { return csvCell(column.label); }).join(',');
    const lines = result.rows.map(function (row) {
      return result.columns.map(function (column) {
        return csvCell(column.csv ? column.csv(row) : row[column.key]);
      }).join(',');
    });

    const csv = '\uFEFF' + [header].concat(lines).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'agrisys-' + state.current + '-' + UI.today() + '.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    UI.toast('Report exported as CSV.');
  }

  /* --------------------------------------------------------------- boot */
  async function boot() {
    const auth = await Auth.requireAuth();
    if (!auth) return;
    initLayout('reports', auth.profile);

    try {
      const now = new Date();
      state.from = isoDate(new Date(now.getFullYear(), 0, 1));
      state.to = UI.today();

      el('reportFrom').value = state.from;
      el('reportTo').value = state.to;

      state.farmRows = await API.fetchAll('v_farm', { order: 'farm_name', ascending: true });
      el('reportFarm').innerHTML = '<option value="">All farms</option>' + state.farmRows.map(function (farm) {
        return '<option value="' + UI.esc(farm.farm_id) + '">' +
          UI.esc(farm.farm_name + ' — ' + farm.farmer_name) + '</option>';
      }).join('');

      renderTabs();

      el('reportFrom').addEventListener('change', function () { state.from = el('reportFrom').value; });
      el('reportTo').addEventListener('change', function () { state.to = el('reportTo').value; });
      el('reportFarm').addEventListener('change', function () { state.farmId = el('reportFarm').value; });
      el('generateReport').addEventListener('click', load);
      el('printReport').addEventListener('click', function () { window.print(); });
      el('exportReport').addEventListener('click', exportCsv);
      el('resetReport').addEventListener('click', function () {
        const today = new Date();
        state.from = isoDate(new Date(today.getFullYear(), 0, 1));
        state.to = UI.today();
        state.farmId = '';
        el('reportFrom').value = state.from;
        el('reportTo').value = state.to;
        el('reportFarm').value = '';
        load();
      });

      await load();
    } catch (error) {
      console.error(error);
      UI.fatal(API.friendlyError(error));
    }
  }

  boot();
})();
