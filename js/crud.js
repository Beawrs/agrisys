/* ==========================================================================
   Generic CRUD page engine
   --------------------------------------------------------------------------
   One engine powers Farmers, Farms, Crops, Plantings and Harvests:
   server-side search/filter/sort/pagination, modal forms with validation,
   view details, success/error feedback and role-aware delete.
   ========================================================================== */

window.CrudPage = function (config) {
  'use strict';

  const state = {
    auth: null,
    canDelete: false,
    page: 1,
    pageSize: config.pageSize || 10,
    search: '',
    filters: {},
    sort: config.defaultSort ? config.defaultSort.column : config.pk,
    ascending: config.defaultSort ? config.defaultSort.ascending !== false : false,
    total: 0,
    rows: [],
    editing: null,
    loaded: false,
    modal: null,
    viewModal: null
  };

  const refs = {};

  /* ------------------------------------------------------------------ setup */
  function cacheRefs() {
    refs.head = document.getElementById('tableHead');
    refs.body = document.getElementById('tableBody');
    refs.filterBar = document.getElementById('filterBar');
    refs.pagination = document.getElementById('pagination');
    refs.count = document.getElementById('recordCount');
    refs.addBtn = document.getElementById('addRecordBtn');
    refs.modalEl = document.getElementById('recordModal');
    refs.form = document.getElementById('recordForm');
    refs.formBody = document.getElementById('recordFormBody');
    refs.formError = document.getElementById('formError');
    refs.modalTitle = document.getElementById('recordModalTitle');
    refs.saveBtn = document.getElementById('saveRecordBtn');
    refs.viewEl = document.getElementById('viewModal');
    refs.viewBody = document.getElementById('viewModalBody');
    refs.viewTitle = document.getElementById('viewModalTitle');
  }

  async function start(auth) {
    state.auth = auth;
    state.canDelete = auth.profile.role === 'admin';
    cacheRefs();

    if (!refs.body || !refs.modalEl || !refs.form) {
      throw new Error('The page markup is incomplete. Missing table or modal elements.');
    }

    state.modal = new bootstrap.Modal(refs.modalEl);
    state.viewModal = new bootstrap.Modal(refs.viewEl);

    await API.loadLookups();
    buildFilters();
    buildHead();
    buildForm();
    wireEvents();
    await load();
  }

  /* ---------------------------------------------------------------- filters */
  function optionMarkup(options, selected, placeholder) {
    let html = '<option value="">' + UI.esc(placeholder || 'All') + '</option>';
    (options || []).forEach(function (opt) {
      const value = String(opt.value);
      html += '<option value="' + UI.esc(value) + '"' +
        (String(selected || '') === value ? ' selected' : '') + '>' +
        UI.esc(opt.label) + '</option>';
    });
    return html;
  }

  function resolveOptions(field) {
    if (typeof field.options === 'function') return field.options(state);
    return field.options || [];
  }

  function buildFilters() {
    if (!refs.filterBar) return;
    const parts = [];

    parts.push(
      '<div class="search-box">' +
        '<i class="bi bi-search"></i>' +
        '<input type="search" class="form-control" id="searchInput" autocomplete="off" ' +
          'placeholder="' + UI.esc(config.searchPlaceholder || 'Search records…') + '" ' +
          'value="' + UI.esc(state.search) + '">' +
      '</div>'
    );

    (config.filters || []).forEach(function (filter) {
      const id = 'filter_' + filter.id;
      const value = state.filters[filter.id] || '';
      if (filter.type === 'date') {
        parts.push(
          '<div class="filter-field">' +
            '<label for="' + id + '">' + UI.esc(filter.label) + '</label>' +
            '<input type="date" class="form-control" id="' + id + '" value="' + UI.esc(value) + '">' +
          '</div>'
        );
      } else {
        const options = resolveOptions(filter);
        parts.push(
          '<div class="filter-field">' +
            '<label for="' + id + '">' + UI.esc(filter.label) + '</label>' +
            '<select class="form-select" id="' + id + '">' +
              optionMarkup(options, value, filter.placeholder || 'All') +
            '</select>' +
          '</div>'
        );
      }
    });

    parts.push('<button type="button" class="btn btn-light" id="clearFilters">' +
      '<i class="bi bi-arrow-counterclockwise me-1"></i>Reset</button>');

    refs.filterBar.innerHTML = parts.join('');
  }

  /* ------------------------------------------------------------------ table */
  function buildHead() {
    if (!refs.head) return;
    const cells = config.columns.map(function (column) {
      if (!column.sortable) {
        return '<th class="' + (column.thClass || '') + '">' + UI.esc(column.label) + '</th>';
      }
      const key = column.sortKey || column.key;
      const sorted = state.sort === key;
      const icon = sorted
        ? (state.ascending ? 'bi-sort-up' : 'bi-sort-down')
        : 'bi-arrow-down-up';
      return '<th class="sortable ' + (sorted ? 'sorted' : '') + '" data-sort="' + UI.esc(key) + '">' +
        UI.esc(column.label) + ' <i class="bi ' + icon + ' sort-icon"></i></th>';
    });
    cells.push('<th class="text-right">Actions</th>');
    refs.head.innerHTML = '<tr>' + cells.join('') + '</tr>';
  }

  function displayValue(field, row) {
    const raw = row[field.key];

    if (field.render) return field.render(row);

    if (raw === null || raw === undefined || raw === '') {
      return '<span class="text-muted">—</span>';
    }

    switch (field.format) {
      case 'date': return UI.esc(UI.date(raw));
      case 'datetime': return UI.esc(UI.dateTime(raw));
      case 'number': return UI.esc(UI.number(raw, field.digits === undefined ? 0 : field.digits));
      case 'peso': return UI.esc(UI.peso(raw));
      case 'badge': return UI.badge(raw, field.badgeKind);
      default: return UI.esc(raw);
    }
  }

  function renderRows() {
    if (!refs.body) return;
    const colspan = config.columns.length + 1;

    if (!state.rows.length) {
      refs.body.innerHTML =
        '<tr><td colspan="' + colspan + '">' +
          '<div class="empty-state">' +
            '<i class="bi ' + (config.emptyIcon || 'bi-inbox') + '"></i>' +
            '<strong>No records found</strong>' +
            '<div>' + UI.esc(config.emptyText || 'Try adjusting your search or filters.') + '</div>' +
          '</div>' +
        '</td></tr>';
      return;
    }

    refs.body.innerHTML = state.rows.map(function (row) {
      const id = UI.esc(row[config.pk]);
      const cells = config.columns.map(function (column) {
        return '<td class="' + (column.tdClass || '') + '">' + displayValue(column, row) + '</td>';
      });

      cells.push(
        '<td class="text-right" style="white-space:nowrap">' +
          '<button class="btn btn-light btn-icon" data-action="view" data-id="' + id + '" title="View">' +
            '<i class="bi bi-eye"></i></button>' +
          '<button class="btn btn-light btn-icon" data-action="edit" data-id="' + id + '" title="Edit">' +
            '<i class="bi bi-pencil"></i></button>' +
          (state.canDelete
            ? '<button class="btn btn-light btn-icon text-danger" data-action="delete" data-id="' + id + '" title="Delete">' +
                '<i class="bi bi-trash"></i></button>'
            : '') +
        '</td>'
      );

      return '<tr>' + cells.join('') + '</tr>';
    }).join('');
  }

  function setLoading() {
    if (!refs.body) return;
    refs.body.innerHTML =
      '<tr><td colspan="' + (config.columns.length + 1) + '">' +
        '<div class="table-loading"><span class="spinner-border spinner-border-sm me-2"></span>Loading records…</div>' +
      '</td></tr>';
  }

  /* ------------------------------------------------------------------- data */
  async function load() {
    setLoading();
    try {
      let query = db.from(config.view).select('*', { count: 'exact' });

      if (state.search) {
        query = query.or(API.ilikeOr(config.searchColumns, state.search));
      }

      (config.filters || []).forEach(function (filter) {
        const value = state.filters[filter.id];
        if (!value) return;
        if (filter.type === 'date') {
          query = query[filter.op || 'gte'](filter.column, value);
        } else {
          query = query.eq(filter.column, value);
        }
      });

      query = query.order(state.sort, { ascending: state.ascending, nullsFirst: false });
      const from = (state.page - 1) * state.pageSize;
      query = query.range(from, from + state.pageSize - 1);

      const res = await query;
      if (res.error) throw res.error;

      state.rows = res.data || [];
      state.total = res.count || 0;
      state.loaded = true;

      const pages = Math.max(1, Math.ceil(state.total / state.pageSize));
      if (state.page > pages) {
        state.page = pages;
        return load();
      }

      renderRows();
      buildHead();
      UI.renderPagination(refs.pagination, {
        page: state.page,
        pageSize: state.pageSize,
        total: state.total,
        onChange: function (nextPage) {
          state.page = nextPage;
          load();
        }
      });

      if (refs.count) {
        refs.count.textContent = state.total + (state.total === 1 ? ' record' : ' records');
      }
    } catch (error) {
      console.error('[AgriSys] load failed', error);
      if (refs.body) {
        refs.body.innerHTML =
          '<tr><td colspan="' + (config.columns.length + 1) + '">' +
            '<div class="empty-state">' +
              '<i class="bi bi-exclamation-triangle"></i>' +
              '<strong>Unable to load records</strong>' +
              '<div>' + UI.esc(API.friendlyError(error)) + '</div>' +
            '</div>' +
          '</td></tr>';
      }
      UI.toast(API.friendlyError(error), 'danger');
    }
  }

  /* ------------------------------------------------------------------- form */
  function inputMarkup(field) {
    const name = UI.esc(field.name);
    const required = field.required ? ' required' : '';
    const common = 'name="' + name + '" id="field_' + name + '"' + required;

    if (field.type === 'select') {
      const options = typeof field.options === 'function' ? [] : (field.options || []);
      return '<select class="form-select"' + common + '>' +
        optionMarkup(options, field.default || '', field.placeholder || 'Select…') +
        '</select>';
    }

    if (field.type === 'textarea') {
      return '<textarea class="form-control" rows="' + (field.rows || 3) + '"' + common +
        (field.maxlength ? ' maxlength="' + field.maxlength + '"' : '') +
        ' placeholder="' + UI.esc(field.placeholder || '') + '"></textarea>';
    }

    let extra = '';
    if (field.type === 'number') {
      extra += ' step="' + (field.step === undefined ? 'any' : field.step) + '"';
      if (field.min !== undefined) extra += ' min="' + field.min + '"';
      if (field.max !== undefined) extra += ' max="' + field.max + '"';
    }
    if (field.maxlength) extra += ' maxlength="' + field.maxlength + '"';
    if (field.pattern) extra += ' pattern="' + UI.esc(field.pattern) + '"';
    if (field.autocomplete) extra += ' autocomplete="' + UI.esc(field.autocomplete) + '"';

    return '<input type="' + (field.type || 'text') + '" class="form-control"' + common + extra +
      ' placeholder="' + UI.esc(field.placeholder || '') + '">';
  }

  function buildForm() {
    const fields = config.form.fields.map(function (field) {
      const width = field.col || 6;
      return '<div class="col-12 col-md-' + width + '">' +
        '<label class="form-label" for="field_' + UI.esc(field.name) + '">' +
          UI.esc(field.label) + (field.required ? ' <span class="req">*</span>' : '') +
        '</label>' +
        inputMarkup(field) +
        (field.help ? '<div class="form-text">' + UI.esc(field.help) + '</div>' : '') +
      '</div>';
    });
    refs.formBody.innerHTML = '<div class="row g-3">' + fields.join('') + '</div>';

    // Show/hide password-style toggles are not used here, but keep selects honest.
    refs.form.addEventListener('submit', onSubmit);
  }

  async function populateDynamicOptions() {
    for (const field of config.form.fields) {
      if (field.type !== 'select' || typeof field.options !== 'function') continue;
      const select = refs.form.querySelector('[name="' + field.name + '"]');
      if (!select) continue;
      select.disabled = true;
      try {
        const options = await resolveOptions(field);
        const current = select.value;
        select.innerHTML = optionMarkup(options, current, field.placeholder || 'Select…');
        select.disabled = false;
      } catch (error) {
        select.disabled = false;
        console.error('[AgriSys] option load failed for ' + field.name, error);
        UI.toast('Could not load the options for ' + field.label + '. ' + API.friendlyError(error), 'danger');
      }
    }
  }

  async function openForm(row) {
    state.editing = row || null;
    refs.form.reset();
    refs.formError.classList.add('d-none');
    refs.formError.textContent = '';
    refs.modalTitle.textContent = (row ? 'Edit ' : 'New ') + config.singular;

    await populateDynamicOptions();

    const today = UI.today();
    config.form.fields.forEach(function (field) {
      const input = refs.form.querySelector('[name="' + field.name + '"]');
      if (!input) return;

      let value;
      if (row) {
        value = row[field.name];
        if (field.type === 'date' && value) value = String(value).slice(0, 10);
        if (field.type === 'select' && value !== null && value !== undefined) value = String(value);
      } else if (field.default !== undefined) {
        value = typeof field.default === 'function' ? field.default(today) : field.default;
      }

      input.value = value === null || value === undefined ? '' : value;
    });

    // Let the page tweak values (for example, pre-select a parent record).
    if (typeof config.form.onOpen === 'function') {
      config.form.onOpen(refs.form, row, state);
    }

    state.modal.show();
  }

  function collect() {
    const data = {};
    config.form.fields.forEach(function (field) {
      const input = refs.form.querySelector('[name="' + field.name + '"]');
      if (!input) return;
      let value = input.value;

      if (typeof value === 'string') value = value.trim();
      if (value === '') value = null;

      if (value !== null && (field.type === 'number' || field.cast === 'number')) {
        value = Number(value);
      }

      data[field.name] = value;
    });
    return data;
  }

  function validate(data) {
    for (const field of config.form.fields) {
      const value = data[field.name];

      if (field.required && (value === null || value === '')) {
        return field.label + ' is required.';
      }

      if (field.type === 'number' && value !== null) {
        if (!isFinite(Number(value))) return field.label + ' must be a valid number.';
        if (field.min !== undefined && Number(value) < field.min) {
          return field.label + ' must be at least ' + field.min + '.';
        }
        if (field.max !== undefined && Number(value) > field.max) {
          return field.label + ' must not be more than ' + field.max + '.';
        }
      }

      if (field.type === 'date' && value !== null && !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
        return field.label + ' must be a valid date.';
      }
    }

    if (typeof config.form.validate === 'function') {
      return config.form.validate(data, state);
    }
    return null;
  }

  function formError(message) {
    refs.formError.textContent = message;
    refs.formError.classList.remove('d-none');
    refs.formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function onSubmit(event) {
    event.preventDefault();
    refs.formError.classList.add('d-none');

    const data = collect();
    const problem = validate(data);
    if (problem) {
      formError(problem);
      return;
    }

    UI.setBusy(refs.saveBtn, true);
    try {
      if (state.editing) {
        const res = await db.from(config.table).update(data).eq(config.pk, state.editing[config.pk]);
        if (res.error) throw res.error;
        UI.toast(config.singular + ' updated successfully.');
      } else {
        const res = await db.from(config.table).insert(data);
        if (res.error) throw res.error;
        UI.toast(config.singular + ' added successfully.');
        state.page = 1;
      }
      state.modal.hide();
      await load();
    } catch (error) {
      console.error('[AgriSys] save failed', error);
      formError(API.friendlyError(error));
    } finally {
      UI.setBusy(refs.saveBtn, false);
    }
  }

  /* ------------------------------------------------------------------- view */
  function openView(row) {
    const fields = config.detailFields || config.columns.map(function (column) {
      return { label: column.label, key: column.key, format: column.format, digits: column.digits, badgeKind: column.badgeKind };
    });

    refs.viewTitle.textContent = config.singular + ' details';
    refs.viewBody.innerHTML = '<dl class="detail-list">' + fields.map(function (field) {
      const content = displayValue(field, row);
      return '<dt>' + UI.esc(field.label) + '</dt><dd>' + content + '</dd>';
    }).join('') + '</dl>';

    state.viewModal.show();
  }

  /* ----------------------------------------------------------------- delete */
  async function destroy(row) {
    const label = typeof config.label === 'function'
      ? config.label(row)
      : config.singular + ' #' + row[config.pk];

    const accepted = await UI.confirm({
      title: 'Delete ' + config.singular.toLowerCase() + '?',
      message:
        '<p class="mb-2">You are about to permanently delete <strong>' + UI.esc(label) + '</strong>.</p>' +
        '<p class="mb-0 text-muted" style="font-size:12.5px">This action cannot be undone. ' +
        'Related records may prevent deletion to protect data integrity.</p>',
      confirmText: 'Delete',
      variant: 'danger'
    });

    if (!accepted) return;

    try {
      const res = await db.from(config.table).delete().eq(config.pk, row[config.pk]);
      if (res.error) throw res.error;
      UI.toast(config.singular + ' deleted successfully.');
      if (state.rows.length === 1 && state.page > 1) state.page -= 1;
      await load();
    } catch (error) {
      console.error('[AgriSys] delete failed', error);
      UI.toast(API.friendlyError(error), 'danger');
    }
  }

  /* ------------------------------------------------------------------ wiring */
  function wireFilters() {
    if (!refs.filterBar) return;

    const search = document.getElementById('searchInput');
    const clear = document.getElementById('clearFilters');
    const debounced = UI.debounce(function (value) {
      state.search = value;
      state.page = 1;
      load();
    }, 300);

    if (search) {
      search.addEventListener('input', function () { debounced(search.value.trim()); });
    }

    (config.filters || []).forEach(function (filter) {
      const control = document.getElementById('filter_' + filter.id);
      if (!control) return;
      control.addEventListener('change', function () {
        state.filters[filter.id] = control.value;
        state.page = 1;
        load();
      });
    });

    if (clear) {
      clear.addEventListener('click', function () {
        state.search = '';
        state.filters = {};
        state.page = 1;
        buildFilters();
        wireFilters();          // listeners live on the freshly built controls
        load();
      });
    }
  }

  function wireEvents() {
    if (refs.addBtn) {
      refs.addBtn.addEventListener('click', function () { openForm(null); });
    }

    wireFilters();

    refs.head.addEventListener('click', function (event) {
      const th = event.target.closest('th.sortable');
      if (!th) return;
      const key = th.dataset.sort;
      if (state.sort === key) {
        state.ascending = !state.ascending;
      } else {
        state.sort = key;
        state.ascending = true;
      }
      state.page = 1;
      load();
    });

    refs.body.addEventListener('click', function (event) {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      const row = state.rows.filter(function (item) {
        return String(item[config.pk]) === button.dataset.id;
      })[0];
      if (!row) return;

      const action = button.dataset.action;
      if (action === 'view') openView(row);
      if (action === 'edit') openForm(row);
      if (action === 'delete') destroy(row);
    });

    // Delegated modal buttons (view modal is rebuilt each time).
    refs.viewEl.addEventListener('click', function (event) {
      if (event.target.closest('[data-action="edit-from-view"]')) {
        const id = event.target.closest('[data-action="edit-from-view"]').dataset.id;
        const row = state.rows.filter(function (item) {
          return String(item[config.pk]) === id;
        })[0];
        state.viewModal.hide();
        if (row) openForm(row);
      }
    });
  }

  return { start: start, refresh: load, state: state };
};
