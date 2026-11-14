/* Farmers module */
(function () {
  'use strict';

  async function boot() {
    const auth = await Auth.requireAuth();
    if (!auth) return;
    initLayout('farmers', auth.profile);

    try {
      const lookups = await API.loadLookups();

      await CrudPage({
        view: 'v_farmer',
        table: 'farmer',
        pk: 'farmer_id',
        singular: 'Farmer',
        searchPlaceholder: 'Search by name, address or contact number…',
        searchColumns: ['full_name', 'address', 'contact_no'],
        defaultSort: { column: 'full_name', ascending: true },
        emptyIcon: 'bi-people',
        emptyText: 'No farmers match your filters yet.',
        filters: [
          {
            id: 'sex',
            column: 'sex_id',
            label: 'Sex',
            options: function () { return API.options(lookups.sexes, 'sex_id', 'sex_description'); }
          }
        ],
        columns: [
          {
            key: 'full_name',
            label: 'Farmer',
            sortable: true,
            render: function (row) {
              return '<div class="cell-title">' + UI.esc(row.full_name) + '</div>' +
                '<div class="cell-sub">Farmer #' + UI.esc(row.farmer_id) + '</div>';
            }
          },
          { key: 'sex_description', label: 'Sex', sortable: true },
          { key: 'address', label: 'Address', sortable: true },
          { key: 'contact_no', label: 'Contact number' },
          {
            key: 'farm_count',
            label: 'Farms',
            sortable: true,
            render: function (row) {
              const n = Number(row.farm_count || 0);
              return '<span class="badge-soft badge-green">' + n + ' ' + (n === 1 ? 'farm' : 'farms') + '</span>';
            }
          },
          { key: 'created_at', label: 'Registered', sortable: true, format: 'date' }
        ],
        detailFields: [
          { label: 'Farmer ID', key: 'farmer_id' },
          { label: 'Full name', key: 'full_name' },
          { label: 'Sex', key: 'sex_description' },
          { label: 'Birth date', key: 'birth_date', format: 'date' },
          { label: 'Contact number', key: 'contact_no' },
          { label: 'Address', key: 'address' },
          {
            label: 'Registered farms',
            key: 'farm_count',
            render: function (row) {
              const n = Number(row.farm_count || 0);
              return UI.esc(n + ' ' + (n === 1 ? 'farm' : 'farms'));
            }
          },
          { label: 'Recorded on', key: 'created_at', format: 'datetime' },
          { label: 'Last updated', key: 'updated_at', format: 'datetime' }
        ],
        form: {
          fields: [
            { name: 'first_name', label: 'First name', type: 'text', required: true, maxlength: 60, placeholder: 'e.g. Juan' },
            { name: 'last_name', label: 'Last name', type: 'text', required: true, maxlength: 60, placeholder: 'e.g. Dela Cruz' },
            {
              name: 'sex_id',
              label: 'Sex',
              type: 'select',
              required: true,
              placeholder: 'Select sex',
              options: API.options(lookups.sexes, 'sex_id', 'sex_description')
            },
            { name: 'birth_date', label: 'Birth date', type: 'date', help: 'Optional. Cannot be a future date.' },
            {
              name: 'contact_no',
              label: 'Contact number',
              type: 'text',
              placeholder: '09XXXXXXXXX',
              pattern: '^[0-9+\\(\\)\\s\\-]{7,20}$',
              help: 'Optional. Digits, spaces and + ( ) - only.'
            },
            {
              name: 'address',
              label: 'Address',
              type: 'text',
              required: true,
              maxlength: 200,
              col: 12,
              placeholder: 'Barangay, City / Municipality'
            }
          ],
          validate: function (data) {
            if (data.birth_date && data.birth_date > UI.today()) {
              return 'Birth date cannot be in the future.';
            }
            if (data.contact_no && !/^[0-9+()\-\s]{7,20}$/.test(data.contact_no)) {
              return 'Contact number must contain 7–20 digits and may include + ( ) - and spaces.';
            }
            if (data.address && data.address.trim().length < 5) {
              return 'Please enter a more complete address.';
            }
            return null;
          }
        },
        label: function (row) { return row.full_name; }
      }).start(auth);
    } catch (error) {
      console.error(error);
      UI.fatal(API.friendlyError(error));
    }
  }

  boot();
})();
