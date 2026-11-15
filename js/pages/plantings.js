/* Planting records module */
(function () {
  'use strict';

  async function farmOptions() {
    const rows = await API.fetchAll('v_farm', { order: 'farm_name', ascending: true });
    return rows.map(function (row) {
      return {
        value: row.farm_id,
        label: row.farm_name + ' — ' + row.farmer_name
      };
    });
  }

  async function cropOptions() {
    const rows = await API.fetchAll('v_crop', { order: 'crop_name', ascending: true });
    return rows.map(function (row) {
      return {
        value: row.crop_id,
        label: row.crop_name + (row.variety ? ' (' + row.variety + ')' : '')
      };
    });
  }

  async function boot() {
    const auth = await Auth.requireAuth();
    if (!auth) return;
    initLayout('plantings', auth.profile);

    try {
      const lookups = await API.loadLookups();

      await CrudPage({
        view: 'v_planting',
        table: 'planting',
        pk: 'planting_id',
        singular: 'Planting record',
        searchPlaceholder: 'Search by farm, farmer, location or crop…',
        searchColumns: ['farm_name', 'farmer_name', 'location', 'crop_name'],
        defaultSort: { column: 'planting_id', ascending: true },
        emptyIcon: 'bi-calendar-check',
        emptyText: 'No planting records match your filters yet.',
        filters: [
          {
            id: 'status',
            column: 'status_id',
            label: 'Status',
            options: function () {
              return API.options(lookups.statuses, 'status_id', 'status_description');
            }
          },
          { id: 'from', column: 'planting_date', op: 'gte', label: 'Planted from', type: 'date' },
          { id: 'to', column: 'planting_date', op: 'lte', label: 'Planted until', type: 'date' }
        ],
        columns: [
          { key: 'planting_id', label: 'ID', sortable: true, tdClass: 'num fw-semibold' },
          {
            key: 'planting_date',
            label: 'Planted',
            sortable: true,
            render: function (row) {
              return '<div class="cell-title">' + UI.esc(UI.date(row.planting_date)) + '</div>';
            }
          },
          {
            key: 'farm_name',
            label: 'Farm',
            sortable: true,
            render: function (row) {
              return '<div class="cell-title">' + UI.esc(row.farm_name) + '</div>' +
                '<div class="cell-sub">' + UI.esc(row.farmer_name) + '</div>';
            }
          },
          { key: 'location', label: 'Location', sortable: true },
          {
            key: 'crop_name',
            label: 'Crop',
            sortable: true,
            render: function (row) {
              return '<div class="cell-title">' + UI.esc(row.crop_name) + '</div>' +
                '<div class="cell-sub">' + UI.esc(row.variety || 'No variety') + '</div>';
            }
          },
          {
            key: 'seed_quantity',
            label: 'Seed Qty',
            sortable: true,
            render: function (row) {
              return '<span class="num">' + UI.number(row.seed_quantity, 2) + '</span>';
            }
          },
          {
            key: 'area_planted',
            label: 'Area',
            sortable: true,
            render: function (row) {
              return '<span class="num">' + UI.number(row.area_planted, 2) + '</span> <span class="text-muted">ha</span>';
            }
          },
          { key: 'expected_harvest_date', label: 'Expected harvest', sortable: true, format: 'date' },
          { key: 'status_description', label: 'Status', sortable: true, format: 'badge', badgeKind: 'status' },
          {
            key: 'harvest_count',
            label: 'Harvests',
            sortable: true,
            render: function (row) {
              const n = Number(row.harvest_count || 0);
              return '<span class="badge-soft ' + (n ? 'badge-green' : 'badge-grey') + '">' + n + '</span>';
            }
          }
        ],
        detailFields: [
          { label: 'Planting ID', key: 'planting_id' },
          { label: 'Farm', key: 'farm_name' },
          { label: 'Location', key: 'location' },
          { label: 'Farmer', key: 'farmer_name' },
          { label: 'Crop', key: 'crop_name' },
          { label: 'Variety', key: 'variety' },
          { label: 'Planting date', key: 'planting_date', format: 'date' },
          { label: 'Expected harvest', key: 'expected_harvest_date', format: 'date' },
          { label: 'Area planted', key: 'area_planted', render: function (row) { return UI.esc(UI.number(row.area_planted, 2) + ' hectares'); } },
          { label: 'Seed quantity', key: 'seed_quantity', render: function (row) { return UI.esc(UI.number(row.seed_quantity, 2)); } },
          { label: 'Status', key: 'status_description', format: 'badge', badgeKind: 'status' },
          { label: 'Harvest records', key: 'harvest_count' },
          { label: 'Recorded on', key: 'created_at', format: 'datetime' },
          { label: 'Last updated', key: 'updated_at', format: 'datetime' }
        ],
        form: {
          fields: [
            {
              name: 'farm_id',
              label: 'Farm',
              type: 'select',
              required: true,
              cast: 'number',
              col: 12,
              placeholder: 'Select the farm to be planted',
              options: farmOptions
            },
            {
              name: 'crop_id',
              label: 'Crop',
              type: 'select',
              required: true,
              cast: 'number',
              col: 12,
              placeholder: 'Select the crop',
              options: cropOptions
            },
            { name: 'planting_date', label: 'Planting date', type: 'date', required: true, default: function (today) { return today; } },
            { name: 'expected_harvest_date', label: 'Expected harvest date', type: 'date', help: 'Optional, but must not be earlier than the planting date.' },
            {
              name: 'area_planted',
              label: 'Area planted (hectares)',
              type: 'number',
              required: true,
              min: 0.01,
              step: '0.01',
              placeholder: 'e.g. 1.50'
            },
            {
              name: 'seed_quantity',
              label: 'Seed quantity',
              type: 'number',
              required: true,
              min: 0,
              step: '0.01',
              placeholder: 'e.g. 25.00'
            },
            {
              name: 'status_id',
              label: 'Status',
              type: 'select',
              required: true,
              cast: 'number',
              default: 1,
              placeholder: 'Select status',
              options: API.options(lookups.statuses, 'status_id', 'status_description')
            }
          ],
          validate: function (data) {
            if (!data.farm_id) return 'Please select a farm.';
            if (!data.crop_id) return 'Please select a crop.';
            if (data.planting_date && data.planting_date > UI.today() && Number(data.status_id) === 3) {
              return 'A planting dated in the future cannot already be marked as Harvested.';
            }
            if (data.expected_harvest_date && data.planting_date &&
                data.expected_harvest_date < data.planting_date) {
              return 'Expected harvest date cannot be earlier than the planting date.';
            }
            if (Number(data.area_planted) <= 0) return 'Area planted must be greater than zero.';
            if (Number(data.seed_quantity) < 0) return 'Seed quantity cannot be negative.';
            return null;
          }
        },
        label: function (row) {
          return row.crop_name + ' on ' + row.farm_name + ' (' + UI.date(row.planting_date) + ')';
        }
      }).start(auth);
    } catch (error) {
      console.error(error);
      UI.fatal(API.friendlyError(error));
    }
  }

  boot();
})();