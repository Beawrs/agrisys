/* Browser-side client for the authenticated PHP/PDO API. */
window.API = (function () {
  'use strict';

  let lookupCache = null;
  let csrfToken = window.APP_CSRF_TOKEN || '';
  const dataEndpoint = 'api/data.php';

  function setCsrfToken(token) {
    csrfToken = String(token || '');
    window.APP_CSRF_TOKEN = csrfToken;
  }

  async function request(url, options) {
    const response = await fetch(url, options || {});
    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      throw new Error('The server returned an invalid response.');
    }

    if (!response.ok) {
      const failure = new Error(payload.error || 'The request could not be completed.');
      failure.code = payload.code || '';
      failure.status = response.status;
      throw failure;
    }
    return payload;
  }

  function queryString(resource, settings) {
    const opts = settings || {};
    const params = new URLSearchParams();
    params.set('resource', resource);
    params.set('select', opts.select || '*');
    params.set('order', opts.order || '');
    params.set('ascending', opts.ascending === false ? 'false' : 'true');
    params.set('limit', String(opts.limit || 1000));
    params.set('offset', String(opts.offset || 0));
    params.set('filters', JSON.stringify(opts.filters || []));
    params.set('search', opts.search || '');
    params.set('searchColumns', JSON.stringify(opts.searchColumns || []));
    return params.toString();
  }

  async function query(resource, settings) {
    const payload = await request(dataEndpoint + '?' + queryString(resource, settings));
    return { data: payload.data || [], count: Number(payload.count || 0) };
  }

  async function fetchAll(resource, settings) {
    const opts = settings || {};
    const chunkSize = Math.min(Number(opts.limit) || 1000, 1000);
    const rows = [];
    let offset = Number(opts.offset) || 0;

    for (;;) {
      const result = await query(resource, Object.assign({}, opts, {
        limit: chunkSize,
        offset: offset
      }));
      rows.push.apply(rows, result.data);
      if (result.data.length < chunkSize || opts.limit) break;
      offset += chunkSize;
    }
    return rows;
  }

  async function mutate(operation, resource, data, id) {
    const payload = await request(dataEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        op: operation,
        resource: resource,
        data: data || {},
        id: id,
        csrfToken: csrfToken
      })
    });
    return payload.data || payload;
  }

  async function loadLookups(force) {
    if (lookupCache && !force) return lookupCache;

    const tables = {
      soils: ['soil_type', 'soil_id'],
      irrigations: ['irrigation_type', 'irrigation_id'],
      categories: ['crop_category', 'category_id'],
      seasons: ['growing_season', 'season_id'],
      statuses: ['planting_status', 'status_id'],
      grades: ['quality_grade', 'grade_id'],
      remarks: ['harvest_remark', 'remark_id']
    };

    const keys = Object.keys(tables);
    const results = await Promise.all(keys.map(function (key) {
      const spec = tables[key];
      return fetchAll(spec[0], { order: spec[1], ascending: true });
    }));

    lookupCache = {};
    results.forEach(function (rows, index) {
      lookupCache[keys[index]] = rows;
    });
    return lookupCache;
  }

  function options(rows, valueKey, labelKey) {
    return (rows || []).map(function (row) {
      return { value: row[valueKey], label: row[labelKey] };
    });
  }

  function ilikeTerm(term) {
    return String(term || '').replace(/[\\"]/g, '').replace(/[,()%_]/g, ' ').trim();
  }

  function friendlyError(error) {
    if (!error) return 'The operation could not be completed. Please try again.';
    const message = String(error.message || '');
    if (message.length > 200) return 'The operation could not be completed. Please check your entries and try again.';
    return message || 'The operation could not be completed. Please try again.';
  }

  return {
    setCsrfToken: setCsrfToken,
    query: query,
    fetchAll: fetchAll,
    loadLookups: loadLookups,
    options: options,
    ilikeTerm: ilikeTerm,
    friendlyError: friendlyError,
    count: async function (resource, filters) {
      const result = await query(resource, { limit: 1, filters: filters || [] });
      return result.count;
    },
    insert: function (resource, data) {
      return mutate('insert', resource, data);
    },
    update: function (resource, id, data) {
      return mutate('update', resource, data, id);
    },
    delete: function (resource, id) {
      return mutate('delete', resource, {}, id);
    },
    resetLookups: function () { lookupCache = null; }
  };
})();
