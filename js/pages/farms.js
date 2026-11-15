/* Farms module */
(function () {
  'use strict';

  let farmerRows = [];

  async function farmerOptions() {
    farmerRows = await API.fetchAll('v_farmer', { order: 'full_name', ascending: true });
    return farmerRows.map(function (row) {
      return {
        value: row.farmer_id,
        label: row.full_name + ' — ' + row.address
      };
    });
  }

  async function boot() {
    const auth = await Auth.requireAuth();
    if (!auth) return;
    initLayout('farms', auth.profile);

    try {
      const lookups = await API.loadLookups();

      await CrudPage({
        view: 'v_farm',
        table: 'farm',
        pk: 'farm_id',
        singular: 'Farm',
        searchPlaceholder: 'Search by farm name, farmer or location…',
        searchColumns: ['farm_name', 'farmer_name', 'location'],
        defaultSort: { column: 'farm_id', ascending: true },
        emptyIcon: 'bi-map',
        emptyText: 'No farms match your filters yet.',
        filters: [
          {
            id: 'soil',
            column: 'soil_id',
            label: 'Soil type',
            options: function () {
              return API.options(lookups.soils, 'soil_id', 'soil_description');
            }
          },
          {
            id: 'irrigation',
            column: 'irrigation_id',
            label: 'Irrigation type',
            options: function () {
              return API.options(lookups.irrigations, 'irrigation_id', 'irrigation_description');
            }
          }
        ],
        columns: [
          { key: 'farm_id', label: 'ID', sortable: true, tdClass: 'num fw-semibold' },
          {
            key: 'farm_name',
            label: 'Farm',
            sortable: true,
            render: function (row) {
              return '<div class="cell-title">' + UI.esc(row.farm_name) + '</div>';
            }
          },
          {
            key: 'farmer_name',
            label: 'Farmer',
            sortable: true
          },
          {
            key: 'location',
            label: 'Location',
            sortable: true
          },
          {
            key: 'area_hectares',
            label: 'Area',
            sortable: true,
            render: function (row) {
              return '<span class="num">' + UI.number(row.area_hectares, 2) + '</span> <span class="text-muted">ha</span>';
            }
          },
          { key: 'soil_description', label: 'Soil type', sortable: true },
          { key: 'irrigation_description', label: 'Irrigation', sortable: true },
          {
            key: 'planting_count',
            label: 'Planting records',
            sortable: true,
            render: function (row) {
              const n = Number(row.planting_count || 0);
              return '<span class="badge-soft badge-blue">' + n + ' ' + (n === 1 ? 'record' : 'records') + '</span>';
            }
          },
          { key: 'created_at', label: 'Added', sortable: true, format: 'date' }
        ],
        detailFields: [
          { label: 'Farm ID', key: 'farm_id' },
          { label: 'Farm name', key: 'farm_name' },
          { label: 'Farmer', key: 'farmer_name' },
          { label: 'Location', key: 'location' },
          { label: 'Area', key: 'area_hectares', render: function (row) { return UI.esc(UI.number(row.area_hectares, 2) + ' hectares'); } },
          { label: 'Soil type', key: 'soil_description' },
          { label: 'Irrigation type', key: 'irrigation_description' },
          { label: 'Planting records', key: 'planting_count' },
          { label: 'Recorded on', key: 'created_at', format: 'datetime' },
          { label: 'Last updated', key: 'updated_at', format: 'datetime' }
        ],
        form: {
          fields: [
            { name: 'farm_name', label: 'Farm name', type: 'text', required: true, maxlength: 100, col: 12, placeholder: 'e.g. Dela Cruz Rice Field' },
            {
              name: 'farmer_id',
              label: 'Farmer',
              type: 'select',
              required: true,
              cast: 'number',
              col: 12,
              placeholder: 'Select the farmer who owns this farm',
              options: farmerOptions
            },
            { name: 'location', label: 'Location', type: 'text', required: true, maxlength: 150, placeholder: 'Barangay, City / Municipality' },
            {
              name: 'soil_id',
              label: 'Soil type',
              type: 'select',
              required: true,
              cast: 'number',
              placeholder: 'Select soil type',
              options: API.options(lookups.soils, 'soil_id', 'soil_description')
            },
            {
              name: 'irrigation_id',
              label: 'Irrigation type',
              type: 'select',
              required: true,
              cast: 'number',
              placeholder: 'Select irrigation type',
              options: API.options(lookups.irrigations, 'irrigation_id', 'irrigation_description')
            },
            {
              name: 'area_hectares',
              label: 'Area (hectares)',
              type: 'number',
              required: true,
              min: 0.01,
              max: 10000,
              step: '0.01',
              placeholder: 'e.g. 1.50'
            }
          ],
          validate: function (data) {
            if (!data.farmer_id) return 'Please choose the farmer who owns this farm.';
            if (Number(data.area_hectares) <= 0) return 'Farm area must be greater than zero.';
            return null;
          }
        },
        label: function (row) { return row.farm_name; }
      }).start(auth);
    } catch (error) {
      console.error(error);
      UI.fatal(API.friendlyError(error));
    }
  }

  boot();
})();