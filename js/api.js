/* ==========================================================================
   Data access helpers (Supabase queries + friendly errors)
   ========================================================================== */

window.API = (function () {
  'use strict';

  let lookupCache = null;

  function requireDb() {
    if (!window.db) throw new Error('Supabase is not configured.');
    return window.db;
  }

  async function loadLookups(force) {
    if (lookupCache && !force) return lookupCache;
    const client = requireDb();

    const tables = {
      sexes: ['sex', 'sex_id'],
      irrigations: ['irrigation_type', 'irrigation_id'],
      categories: ['crop_category', 'category_id'],
      units: ['crop_unit', 'unit_id'],
      statuses: ['planting_status', 'status_id'],
      grades: ['quality_grade', 'grade_id'],
      remarks: ['harvest_remark', 'remark_id']
    };

    const keys = Object.keys(tables);
    const results = await Promise.all(keys.map(function (key) {
      const spec = tables[key];
      return client.from(spec[0]).select('*').order(spec[1], { ascending: true });
    }));

    const out = {};
    results.forEach(function (res, index) {
      if (res.error) throw res.error;
      out[keys[index]] = res.data || [];
    });

    lookupCache = out;
    return out;
  }

  function options(rows, valueKey, labelKey) {
    return (rows || []).map(function (row) {
      return { value: row[valueKey], label: row[labelKey] };
    });
  }

  /** Escapes a search term for use inside PostgREST `.or()` / `.ilike()`. */
  function ilikeTerm(term) {
    return String(term || '')
      .replace(/[\\"]/g, '')
      .replace(/[,()%_]/g, ' ')
      .trim();
  }

  function ilikeOr(columns, term) {
    const clean = ilikeTerm(term);
    return columns.map(function (column) {
      return column + '.ilike.%' + clean + '%';
    }).join(',');
  }

  /** Fetches every row of a table/view in 1000-row chunks. */
  async function fetchAll(table, settings) {
    const opts = settings || {};
    const client = requireDb();
    const chunk = 1000;
    const rows = [];
    let from = 0;

    for (;;) {
      let query = client.from(table).select(opts.select || '*').range(from, from + chunk - 1);
      if (opts.apply) query = opts.apply(query);
      if (opts.order) {
        query = query.order(opts.order, { ascending: opts.ascending !== false, nullsFirst: false });
      }
      const res = await query;
      if (res.error) throw res.error;
      const batch = res.data || [];
      rows.push.apply(rows, batch);
      if (batch.length < chunk) break;
      from += chunk;
    }
    return rows;
  }

  /** Turns a Postgres/PostgREST error into a message safe to show to users. */
  function friendlyError(error) {
    if (!error) return 'The operation could not be completed. Please try again.';
    const code = String(error.code || '');
    const message = String(error.message || error.details || '');

    if (code === '23503' || /violates foreign key/i.test(message)) {
      return 'This record is still linked to other records. Remove or reassign the related records first, then try again.';
    }
    if (code === '23505' || /duplicate key/i.test(message)) {
      return 'A record with the same unique value already exists. Please use a different name or code.';
    }
    if (code === '23514' || /violates check constraint/i.test(message)) {
      return 'One of the values is outside the allowed range. Please review the highlighted fields.';
    }
    if (code === '23502' || /null value in column/i.test(message)) {
      return 'A required value is missing. Please complete all required fields.';
    }
    if (code === 'PGRST301' || /jwt|token|session/i.test(message)) {
      return 'Your session has expired. Please sign in again.';
    }
    if (/harvest date/i.test(message)) {
      return message;
    }
    if (/row-level security|permission denied/i.test(message)) {
      return 'Your account is not allowed to perform this action.';
    }
    if (/failed to fetch|networkerror|load failed/i.test(message)) {
      return 'Cannot reach the database. Check your internet connection and try again.';
    }
    if (message.length > 200) {
      return 'The operation could not be completed. Please check your entries and try again.';
    }
    return message || 'The operation could not be completed. Please try again.';
  }

  /** Counts rows in a table/view with optional filters. */
  async function count(table, apply) {
    const client = requireDb();
    let query = client.from(table).select('*', { count: 'exact', head: true });
    if (apply) query = apply(query);
    const res = await query;
    if (res.error) throw res.error;
    return res.count || 0;
  }

  return {
    requireDb: requireDb,
    loadLookups: loadLookups,
    options: options,
    ilikeTerm: ilikeTerm,
    ilikeOr: ilikeOr,
    fetchAll: fetchAll,
    friendlyError: friendlyError,
    count: count,
    resetLookups: function () { lookupCache = null; }
  };
})();
