/* ==========================================================================
   UI helpers shared by every page
   ========================================================================== */

window.UI = (function () {
  'use strict';

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function esc(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function number(value, digits) {
    const n = Number(value);
    if (!isFinite(n)) return '0';
    const d = digits === undefined ? 0 : digits;
    return n.toLocaleString('en-PH', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  function peso(value) {
    return '\u20B1' + number(value, 2);
  }

  function dateOnly(value) {
    if (!value) return '—';
    const raw = String(value).slice(0, 10);
    const parts = raw.split('-');
    if (parts.length !== 3) return raw;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (isNaN(d.getTime())) return raw;
    return MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  function dateTime(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return dateOnly(d.toISOString().slice(0, 10)) + ', ' +
      d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
  }

  function today() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function initials(name) {
    const parts = String(name || '?').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  }

  function badge(value, kind) {
    const map = {
      status: {
        'Planned': 'badge-blue',
        'Growing': 'badge-gold',
        'Harvested': 'badge-green',
        'Failed': 'badge-red',
        'Abandoned': 'badge-grey'
      },
      grade: {
        'Grade A': 'badge-green',
        'Grade B': 'badge-blue',
        'Grade C': 'badge-gold',
        'Reject': 'badge-red'
      },
      remark: {
        'High Quality Harvest': 'badge-violet',
        'Good Harvest': 'badge-green',
        'Acceptable Quality': 'badge-blue',
        'Low Yield': 'badge-gold',
        'Poor Quality': 'badge-red',
        'Damaged Harvest': 'badge-red'
      },
      role: { admin: 'badge-violet', staff: 'badge-green' }
    };
    const cls = (map[kind] && map[kind][value]) || 'badge-grey';
    return '<span class="badge-soft ' + cls + '">' + esc(value || '—') + '</span>';
  }

  function debounce(fn, wait) {
    let timer = null;
    return function () {
      const args = arguments;
      const ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  function toast(message, variant) {
    const type = variant || 'success';
    let host = document.getElementById('toastHost');
    if (!host) {
      host = document.createElement('div');
      host.id = 'toastHost';
      host.className = 'toast-container position-fixed top-0 end-0 p-3';
      document.body.appendChild(host);
    }
    const node = document.createElement('div');
    node.className = 'toast align-items-center text-bg-' + type + ' border-0';
    node.setAttribute('role', 'alert');
    node.innerHTML =
      '<div class="d-flex">' +
        '<div class="toast-body">' + esc(message) + '</div>' +
        '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>' +
      '</div>';
    host.appendChild(node);
    const instance = new bootstrap.Toast(node, { delay: 4000 });
    instance.show();
    node.addEventListener('hidden.bs.toast', function () { node.remove(); });
  }

  function confirmDialog(options) {
    const opts = options || {};
    return new Promise(function (resolve) {
      const id = 'uiConfirmModal';
      const existing = document.getElementById(id);
      if (existing) existing.remove();

      const wrapper = document.createElement('div');
      wrapper.innerHTML =
        '<div class="modal fade" id="' + id + '" tabindex="-1" aria-hidden="true">' +
          '<div class="modal-dialog modal-dialog-centered">' +
            '<div class="modal-content">' +
              '<div class="modal-header">' +
                '<h5 class="modal-title">' + esc(opts.title || 'Please confirm') + '</h5>' +
                '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
              '</div>' +
              '<div class="modal-body">' + (opts.message || '') + '</div>' +
              '<div class="modal-footer">' +
                '<button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>' +
                '<button type="button" class="btn btn-' + (opts.variant || 'danger') + '" id="uiConfirmYes">' +
                  esc(opts.confirmText || 'Confirm') +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';

      const modalEl = wrapper.firstElementChild;
      document.body.appendChild(modalEl);
      const modal = new bootstrap.Modal(modalEl);
      let accepted = false;

      modalEl.querySelector('#uiConfirmYes').addEventListener('click', function () {
        accepted = true;
        modal.hide();
      });

      modalEl.addEventListener('hidden.bs.modal', function () {
        modal.dispose();
        modalEl.remove();
        resolve(accepted);
      });

      modal.show();
    });
  }

  function setBusy(button, busy) {
    if (!button) return;
    if (busy) {
      button.dataset.originalHtml = button.innerHTML;
      button.disabled = true;
      button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Please wait…';
    } else {
      button.disabled = false;
      if (button.dataset.originalHtml) {
        button.innerHTML = button.dataset.originalHtml;
        delete button.dataset.originalHtml;
      }
    }
  }

  function pageNumbers(current, total) {
    const out = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) out.push(i);
      return out;
    }
    out.push(1);
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    if (start > 2) out.push('…');
    for (let i = start; i <= end; i++) out.push(i);
    if (end < total - 1) out.push('…');
    out.push(total);
    return out;
  }

  function renderPagination(container, options) {
    if (!container) return;
    const page = options.page;
    const pageSize = options.pageSize;
    const total = options.total;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(total, page * pageSize);

    let items = '';
    items += '<li class="page-item ' + (page <= 1 ? 'disabled' : '') + '">' +
      '<button class="page-link" data-page="' + (page - 1) + '" aria-label="Previous">&laquo;</button></li>';

    pageNumbers(page, pages).forEach(function (p) {
      if (p === '…') {
        items += '<li class="page-item disabled"><span class="page-link">…</span></li>';
      } else {
        items += '<li class="page-item ' + (p === page ? 'active' : '') + '">' +
          '<button class="page-link" data-page="' + p + '">' + p + '</button></li>';
      }
    });

    items += '<li class="page-item ' + (page >= pages ? 'disabled' : '') + '">' +
      '<button class="page-link" data-page="' + (page + 1) + '" aria-label="Next">&raquo;</button></li>';

    container.innerHTML =
      '<div>Showing <strong>' + start + '–' + end + '</strong> of <strong>' + total + '</strong></div>' +
      '<div class="spacer"></div>' +
      '<nav aria-label="Pagination"><ul class="pagination">' + items + '</ul></nav>';

    container.querySelectorAll('button[data-page]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const target = Number(btn.dataset.page);
        if (target >= 1 && target <= pages && target !== page) options.onChange(target);
      });
    });
  }

  function setupNotice() {
    const info = window.APP_INFO || {};
    document.body.innerHTML =
      '<div class="notice-wrap">' +
        '<div class="notice-card">' +
          '<div class="notice-icon tint-gold"><i class="bi bi-plug"></i></div>' +
          '<h1>Connect Supabase to continue</h1>' +
          '<p>The application is installed but the database connection is not configured yet. ' +
          'This only takes a minute:</p>' +
          '<ol>' +
            '<li>Create a free project at <strong>supabase.com</strong>.</li>' +
            '<li>Open <strong>SQL Editor</strong> and run <code>supabase/schema.sql</code>, then <code>supabase/seed.sql</code>.</li>' +
            '<li>Open <strong>Project Settings → API</strong> and copy the <em>Project URL</em> and <em>anon public</em> key.</li>' +
            '<li>Paste both values into <code>js/config.js</code> and save the file.</li>' +
            '<li>Reload this page and sign in.</li>' +
          '</ol>' +
          '<p class="mb-0 text-muted" style="font-size:12px">Full instructions are in <code>docs/SETUP.md</code>.</p>' +
        '</div>' +
      '</div>';
  }

  function accessDenied() {
    const info = window.APP_INFO || {};
    document.body.innerHTML =
      '<div class="notice-wrap">' +
        '<div class="notice-card">' +
          '<div class="notice-icon tint-red"><i class="bi bi-shield-lock"></i></div>' +
          '<h1>Administrator access required</h1>' +
          '<p>Your account does not have permission to open this page. ' +
          'Ask an administrator to change your role, or return to the dashboard.</p>' +
          '<a class="btn btn-primary" href="dashboard.html"><i class="bi bi-arrow-left me-1"></i>Back to Dashboard</a>' +
        '</div>' +
      '</div>';
  }

  function fatal(message) {
    document.body.innerHTML =
      '<div class="notice-wrap">' +
        '<div class="notice-card">' +
          '<div class="notice-icon tint-red"><i class="bi bi-exclamation-triangle"></i></div>' +
          '<h1>Something went wrong</h1>' +
          '<p>' + esc(message) + '</p>' +
          '<a class="btn btn-primary" href="dashboard.html">Return to Dashboard</a>' +
        '</div>' +
      '</div>';
  }

  return {
    esc: esc,
    number: number,
    peso: peso,
    date: dateOnly,
    dateTime: dateTime,
    today: today,
    initials: initials,
    badge: badge,
    debounce: debounce,
    toast: toast,
    confirm: confirmDialog,
    setBusy: setBusy,
    renderPagination: renderPagination,
    setupNotice: setupNotice,
    accessDenied: accessDenied,
    fatal: fatal
  };
})();
