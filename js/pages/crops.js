/* Crops module */
(function () {
  'use strict';

  async function boot() {
    const auth = await Auth.requireAuth();
    if (!auth) return;
    initLayout('crops', auth.profile);

    try {
      const lookups = await API.loadLookups();

      await CrudPage({
        view: 'v_crop',
        table: 'crop',
        pk: 'crop_id',
        singular: 'Crop',
        searchPlaceholder: 'Search by crop name or variety…',
        searchColumns: ['crop_name', 'variety'],
        defaultSort: { column: 'crop_name', ascending: true },
        emptyIcon: 'bi-flower1',
        emptyText: 'No crops match your filters yet.',
        filters: [
          {
            id: 'category',
            column: 'category_id',
            label: 'Category',
            options: function () {
              return API.options(lookups.categories, 'category_id', 'category_description');
            }
          }
        ],
        columns: [
          {
            key: 'crop_name',
            label: 'Crop',
            sortable: true,
            render: function (row) {
              return '<div class="cell-title">' + UI.esc(row.crop_name) + '</div>' +
                '<div class="cell-sub">' + UI.esc(row.variety || 'No variety specified') + '</div>';
            }
          },
          { key: 'category_description', label: 'Category', sortable: true },
          {
            key: 'unit_description',
            label: 'Unit',
            render: function (row) {
              return UI.esc(row.unit_description) + ' <span class="text-muted">(' + UI.esc(row.unit_symbol) + ')</span>';
            }
          },
          {
            key: 'selling_price',
            label: 'Selling price',
            sortable: true,
            render: function (row) {
              return '<span class="num">' + UI.peso(row.selling_price) + '</span> <span class="text-muted">/ ' + UI.esc(row.unit_symbol) + '</span>';
            }
          },
          {
            key: 'planting_count',
            label: 'Plantings',
            sortable: true,
            render: function (row) {
              const n = Number(row.planting_count || 0);
              return '<span class="badge-soft badge-gold">' + n + ' ' + (n === 1 ? 'planting' : 'plantings') + '</span>';
            }
          }
        ],
        detailFields: [
          { label: 'Crop ID', key: 'crop_id' },
          { label: 'Crop name', key: 'crop_name' },
          { label: 'Variety', key: 'variety' },
          { label: 'Category', key: 'category_description' },
          { label: 'Unit of measure', key: 'unit_description' },
          { label: 'Selling price', key: 'selling_price', render: function (row) { return UI.esc(UI.peso(row.selling_price) + ' per ' + row.unit_symbol); } },
          { label: 'Planting records', key: 'planting_count' },
          { label: 'Recorded on', key: 'created_at', format: 'datetime' },
          { label: 'Last updated', key: 'updated_at', format: 'datetime' }
        ],
        form: {
          fields: [
            { name: 'crop_name', label: 'Crop name', type: 'text', required: true, maxlength: 80, col: 8, placeholder: 'e.g. Rice' },
            { name: 'variety', label: 'Variety', type: 'text', maxlength: 80, col: 4, placeholder: 'e.g. NSIC Rc 222' },
            {
              name: 'category_id',
              label: 'Category',
              type: 'select',
              required: true,
              cast: 'number',
              placeholder: 'Select category',
              options: API.options(lookups.categories, 'category_id', 'category_description')
            },
            {
              name: 'unit_id',
              label: 'Unit of measure',
              type: 'select',
              required: true,
              cast: 'number',
              placeholder: 'Select unit',
              options: API.options(lookups.units, 'unit_id', 'unit_description')
            },
            {
              name: 'selling_price',
              label: 'Selling price per unit (₱)',
              type: 'number',
              required: true,
              min: 0,
              step: '0.01',
              col: 12,
              placeholder: 'e.g. 22.50',
              help: 'Used by the dashboard and reports to estimate harvest value.'
            }
          ],
          validate: function (data) {
            if (Number(data.selling_price) < 0) return 'Selling price cannot be negative.';
            return null;
          }
        },
        label: function (row) { return row.crop_name; }
      }).start(auth);
    } catch (error) {
      console.error(error);
      UI.fatal(API.friendlyError(error));
    }
  }

  boot();
})();
