/* Harvest records module */
(function () {
  'use strict';

  let plantingRows = [];

  async function plantingOptions() {
    plantingRows = await API.fetchAll('v_planting', { order: 'planting_id', ascending: false });
    return plantingRows.map(function (row) {
      return {
        value: row.planting_id,
        label: row.farm_name + ' — ' + row.crop_name + ' (planted ' + UI.date(row.planting_date) + ')'
      };
    });
  }

  function findPlanting(id) {
    return plantingRows.filter(function (row) {
      return String(row.planting_id) === String(id);
    })[0];
  }

  async function boot() {
    const auth = await Auth.requireAuth();
    if (!auth) return;
    initLayout('harvests', auth.profile);

    try {
      const lookups = await API.loadLookups();

      await CrudPage({
        view: 'v_harvest',
        table: 'harvest',
        pk: 'harvest_id',
        singular: 'Harvest record',
        searchPlaceholder: 'Search by farm, farmer, location or crop…',
        searchColumns: ['farm_name', 'crop_name', 'farmer_name', 'location'],
        defaultSort: { column: 'harvest_id', ascending: true },
        emptyIcon: 'bi-basket',
        emptyText: 'No harvest records match your filters yet.',
        filters: [
          {
            id: 'grade',
            column: 'grade_id',
            label: 'Quality grade',
            options: function () {
              return API.options(lookups.grades, 'grade_id', 'grade_description');
            }
          },
          {
            id: 'remark',
            column: 'remark_id',
            label: 'Remarks',
            options: function () {
              return API.options(lookups.remarks, 'remark_id', 'remark_description');
            }
          },
          { id: 'from', column: 'harvest_date', op: 'gte', label: 'Harvested from', type: 'date' },
          { id: 'to', column: 'harvest_date', op: 'lte', label: 'Harvested until', type: 'date' }
        ],
        columns: [
          { key: 'harvest_id', label: 'ID', sortable: true, tdClass: 'num fw-semibold' },
          {
            key: 'harvest_date',
            label: 'Harvest date',
            sortable: true,
            render: function (row) {
              return '<div class="cell-title">' + UI.esc(UI.date(row.harvest_date)) + '</div>';
            }
          },
          {
            key: 'farm_name',
            label: 'Farm / Crop',
            sortable: true,
            render: function (row) {
              return '<div class="cell-title">' + UI.esc(row.crop_name) + '</div>' +
                '<div class="cell-sub">' + UI.esc(row.farm_name) + '</div>';
            }
          },
          { key: 'location', label: 'Location', sortable: true },
          {
            key: 'quantity_kg',
            label: 'Quantity',
            sortable: true,
            render: function (row) {
              return '<span class="num">' + UI.number(row.quantity_kg, 2) + '</span> ' +
                '<span class="text-muted">kg</span>';
            }
          },
          { key: 'grade_description', label: 'Quality', sortable: true, format: 'badge', badgeKind: 'grade' },
          { key: 'remark_description', label: 'Remarks', format: 'badge', badgeKind: 'remark' },
          {
            key: 'estimated_value',
            label: 'Estimated value',
            sortable: true,
            render: function (row) {
              return '<span class="num cell-title">' + UI.peso(row.estimated_value) + '</span>' +
                '<div class="cell-sub">@ ' + UI.peso(row.selling_price_per_kg) + ' / kg</div>';
            }
          }
        ],
        detailFields: [
          { label: 'Harvest ID', key: 'harvest_id' },
          { label: 'Harvest date', key: 'harvest_date', format: 'date' },
          { label: 'Farm', key: 'farm_name' },
          { label: 'Location', key: 'location' },
          { label: 'Crop', key: 'crop_name' },
          { label: 'Planting date', key: 'planting_date', format: 'date' },
          { label: 'Quantity harvested', key: 'quantity_kg', render: function (row) { return UI.esc(UI.number(row.quantity_kg, 2) + ' kg'); } },
          { label: 'Quality grade', key: 'grade_description', format: 'badge', badgeKind: 'grade' },
          { label: 'Remarks', key: 'remark_description', format: 'badge', badgeKind: 'remark' },
          { label: 'Selling price', key: 'selling_price_per_kg', render: function (row) { return UI.esc(UI.peso(row.selling_price_per_kg) + ' per kg'); } },
          { label: 'Estimated value', key: 'estimated_value', render: function (row) { return UI.esc(UI.peso(row.estimated_value)); } },
          { label: 'Recorded on', key: 'created_at', format: 'datetime' },
          { label: 'Last updated', key: 'updated_at', format: 'datetime' }
        ],
        form: {
          fields: [
            {
              name: 'planting_id',
              label: 'Planting record',
              type: 'select',
              required: true,
              cast: 'number',
              col: 12,
              placeholder: 'Select the farm and crop that was harvested',
              options: plantingOptions
            },
            {
              name: 'harvest_date',
              label: 'Harvest date',
              type: 'date',
              required: true,
              default: function (today) { return today; }
            },
            {
              name: 'quantity_kg',
              label: 'Quantity harvested (kg)',
              type: 'number',
              required: true,
              min: 0.01,
              step: '0.01',
              placeholder: 'e.g. 1200.00'
            },
            {
              name: 'selling_price_per_kg',
              label: 'Selling price per kg (₱)',
              type: 'number',
              required: true,
              min: 0,
              step: '0.01',
              placeholder: 'e.g. 22.50',
              help: 'Estimated value = quantity × selling price per kg.'
            },
            {
              name: 'grade_id',
              label: 'Quality grade',
              type: 'select',
              required: true,
              cast: 'number',
              default: 1,
              placeholder: 'Select quality grade',
              options: API.options(lookups.grades, 'grade_id', 'grade_description')
            },
            {
              name: 'remark_id',
              label: 'Remarks',
              type: 'select',
              required: true,
              cast: 'number',
              default: 1,
              placeholder: 'Select harvest remark',
              options: API.options(lookups.remarks, 'remark_id', 'remark_description')
            }
          ],
          validate: function (data) {
            const planting = findPlanting(data.planting_id);
            if (!planting) return 'Please select a valid planting record.';

            if (data.harvest_date && data.harvest_date < String(planting.planting_date).slice(0, 10)) {
              return 'Harvest date cannot be earlier than the planting date (' + UI.date(planting.planting_date) + ').';
            }
            if (data.harvest_date && data.harvest_date > UI.today()) {
              return 'Harvest date cannot be in the future.';
            }
            if (Number(data.quantity_kg) <= 0) {
              return 'Quantity harvested must be greater than zero.';
            }
            if (Number(data.selling_price_per_kg) < 0) {
              return 'Selling price cannot be negative.';
            }
            return null;
          }
        },
        label: function (row) {
          return row.crop_name + ' harvest from ' + row.farm_name + ' (' + UI.date(row.harvest_date) + ')';
        }
      }).start(auth);
    } catch (error) {
      console.error(error);
      UI.fatal(API.friendlyError(error));
    }
  }

  boot();
})();
