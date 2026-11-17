/* User accounts / access control (Administrator only) */
(function () {
  'use strict';

  let profiles = [];
  let currentUserId = null;

  const el = function (id) { return document.getElementById(id); };

  function renderRows() {
    const term = (el('userSearch').value || '').trim().toLowerCase();
    const roleFilter = el('roleFilter').value;
    const body = el('userRows');

    const rows = profiles.filter(function (profile) {
      const haystack = (profile.full_name + ' ' + profile.email).toLowerCase();
      return (!term || haystack.indexOf(term) !== -1) &&
        (!roleFilter || profile.role === roleFilter);
    });

    el('userCount').textContent = rows.length + (rows.length === 1 ? ' account' : ' accounts');

    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="4"><div class="empty-state">' +
        '<i class="bi bi-person-x"></i><strong>No accounts found</strong>' +
        '<div>Try a different search term or role filter.</div></div></td></tr>';
      return;
    }

    body.innerHTML = rows.map(function (profile) {
      const isSelf = profile.id === currentUserId;
      return '<tr>' +
        '<td><div class="d-flex align-items-center gap-2">' +
          '<div class="avatar">' + UI.esc(UI.initials(profile.full_name || profile.email)) + '</div>' +
          '<div><div class="cell-title">' + UI.esc(profile.full_name || 'Unnamed user') +
            (isSelf ? ' <span class="badge-soft badge-blue ms-1">You</span>' : '') + '</div>' +
            '<div class="cell-sub">' + UI.esc(profile.email || '—') + '</div></div>' +
        '</div></td>' +
        '<td>' + UI.badge(profile.role, 'role') + '</td>' +
        '<td class="d-none d-md-table-cell">' + UI.esc(UI.dateTime(profile.created_at)) + '</td>' +
        '<td class="text-right">' +
          '<div class="d-inline-flex align-items-center gap-2">' +
            '<select class="form-select form-select-sm" data-role-for="' + UI.esc(profile.id) + '"' +
              (isSelf ? ' disabled title="You cannot change your own role"' : '') + '>' +
              '<option value="staff"' + (profile.role === 'staff' ? ' selected' : '') + '>Staff</option>' +
              '<option value="admin"' + (profile.role === 'admin' ? ' selected' : '') + '>Administrator</option>' +
            '</select>' +
            '<button class="btn btn-primary btn-sm" data-save="' + UI.esc(profile.id) + '"' +
              (isSelf ? ' disabled' : '') + '>Save</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');
  }

  async function reload() {
    profiles = await API.fetchAll('profiles', { order: 'full_name', ascending: true });
    renderRows();
  }

  async function saveRole(id) {
    const select = document.querySelector('[data-role-for="' + id + '"]');
    const button = document.querySelector('[data-save="' + id + '"]');
    if (!select || !button) return;

    const role = select.value;
    UI.setBusy(button, true);
    try {
      await API.update('profiles', id, { role: role });
      UI.toast('Role updated to ' + (role === 'admin' ? 'Administrator' : 'Staff') + '.');
      await reload();
    } catch (error) {
      console.error(error);
      UI.toast(API.friendlyError(error), 'danger');
    } finally {
      UI.setBusy(button, false);
    }
  }

  async function boot() {
    const auth = await Auth.requireAuth({ adminOnly: true });
    if (!auth) return;
    initLayout('users', auth.profile);
    currentUserId = auth.user.id;

    try {
      await reload();
    } catch (error) {
      console.error(error);
      UI.fatal(API.friendlyError(error));
      return;
    }

    el('userSearch').addEventListener('input', UI.debounce(renderRows, 200));
    el('roleFilter').addEventListener('change', renderRows);
    el('refreshUsers').addEventListener('click', async function () {
      try {
        await reload();
        UI.toast('Account list refreshed.');
      } catch (error) {
        UI.toast(API.friendlyError(error), 'danger');
      }
    });

    el('userRows').addEventListener('click', function (event) {
      const button = event.target.closest('[data-save]');
      if (button) saveRole(button.dataset.save);
    });
  }

  boot();
})();
