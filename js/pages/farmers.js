/* Farmers module */
(function () {
  'use strict';

  async function boot() {
    const auth = await Auth.requireAuth();
    if (!auth) return;
    initLayout('farmers', auth.profile);

    try {
      // Address filter: one option per distinct address already in the database.
      const addressRows = await API.fetchAll('v_farmer', { select: 'address', order: 'address', ascending: true });
      const addresses = [];
      addressRows.forEach(function (row) {
        if (row.address && addresses.indexOf(row.address) === -1) addresses.push(row.address);
      });

      await CrudPage({
        view: 'v_farmer',
        table: 'farmer',
        pk: 'farmer_id',
        singular: 'Farmer',
        searchPlaceholder: 'Search by name, address or contact number…',
        searchColumns: ['full_name', 'address', 'contact_number'],
        defaultSort: { column: 'farmer_id', ascending: true },
        emptyIcon: 'bi-people',
        emptyText: 'No farmers match your filters yet.',
        filters: [
          {
            id: 'address',
            column: 'address',
            label: 'Address',
            options: function () {
              return addresses.map(function (a) { return { value: a, label: a }; });
            }
          }
        ],
        columns: [
          { key: 'farmer_id', label: 'ID', sortable: true, tdClass: 'num fw-semibold' },
          {
            key: 'full_name',
            label: 'Farmer',
            sortable: true,
            render: function (row) {
              return '<div class="cell-title">' + UI.esc(row.full_name) + '</div>';
            }
          },
          { key: 'address', label: 'Address', sortable: true },
          { key: 'contact_number', label: 'Contact number' },
          {
            key: 'farm_count',
            label: 'Farms',
            sortable: true,
            render: function (row) {
              const n = Number(row.farm_count || 0);
              return '<span class="badge-soft badge-green">' + n + ' ' + (n === 1 ? 'farm' : 'farms') + '</span>';
            }
          },
          { key: 'date_registered', label: 'Registered', sortable: true, format: 'date' }
        ],
        detailFields: [
          { label: 'Farmer ID', key: 'farmer_id' },
          { label: 'Full name', key: 'full_name' },
          { label: 'Contact number', key: 'contact_number' },
          { label: 'Address', key: 'address' },
          { label: 'Date registered', key: 'date_registered', format: 'date' },
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
            { name: 'first_name', label: 'First name', type: 'text', required: true, maxlength: 50, placeholder: 'e.g. Juan' },
            { name: 'last_name', label: 'Last name', type: 'text', required: true, maxlength: 50, placeholder: 'e.g. Dela Cruz' },
            {
              name: 'contact_number',
              label: 'Contact number',
              type: 'text',
              maxlength: 20,
              placeholder: '09XXXXXXXXX',
              pattern: '^[0-9+\\(\\)\\s\\-]{7,20}$',
              help: 'Optional. Digits, spaces and + ( ) - only.'
            },
            {
              name: 'date_registered',
              label: 'Date registered',
              type: 'date',
              required: true,
              default: function (today) { return today; },
              help: 'Cannot be a future date.'
            },
            {
              name: 'address',
              label: 'Address',
              type: 'text',
              required: true,
              maxlength: 150,
              col: 12,
              placeholder: 'Barangay, City / Municipality'
            }
          ],
          validate: function (data) {
            if (data.date_registered && data.date_registered > UI.today()) {
              return 'Date registered cannot be in the future.';
            }
            if (data.contact_number && !/^[0-9+()\-\s]{7,20}$/.test(data.contact_number)) {
              return 'Contact number must contain 7–20 digits and may include + ( ) - and spaces.';
            }
            if (data.address && data.address.trim().length < 3) {
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
