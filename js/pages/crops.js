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
        defaultSort: { column: 'crop_id', ascending: true },
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
          },
          {
            id: 'season',
            column: 'season_id',
            label: 'Season',
            options: function () {
              return API.options(lookups.seasons, 'season_id', 'season_description');
            }
          }
        ],
        columns: [
          { key: 'crop_id', label: 'ID', sortable: true, tdClass: 'num fw-semibold' },
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
            key: 'growing_period_days',
            label: 'Growing period',
            sortable: true,
            render: function (row) {
              return '<span class="num">' + UI.number(row.growing_period_days) + '</span> <span class="text-muted">days</span>';
            }
          },
          { key: 'season_description', label: 'Recommended season', sortable: true },
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
          { label: 'Growing period', key: 'growing_period_days', render: function (row) { return UI.esc(UI.number(row.growing_period_days) + ' days'); } },
          { label: 'Recommended season', key: 'season_description' },
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
              name: 'season_id',
              label: 'Recommended season',
              type: 'select',
              required: true,
              cast: 'number',
              placeholder: 'Select season',
              options: API.options(lookups.seasons, 'season_id', 'season_description')
            },
            {
              name: 'growing_period_days',
              label: 'Growing period (days)',
              type: 'number',
              required: true,
              min: 1,
              max: 1500,
              step: '1',
              col: 12,
              placeholder: 'e.g. 115',
              help: 'Number of days from planting to harvest.'
            }
          ],
          validate: function (data) {
            if (!Number.isInteger(Number(data.growing_period_days))) {
              return 'Growing period must be a whole number of days.';
            }
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
