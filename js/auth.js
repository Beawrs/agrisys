/* ==========================================================================
   Authentication guard and layout shell
   ========================================================================== */

window.Auth = (function () {
  'use strict';

  async function requireAuth(settings) {
    const opts = settings || {};
    const redirect = opts.redirect || 'index.php';
    let response;
    try {
      response = await fetch('api/auth.php?op=session', { cache: 'no-store' });
    } catch (error) {
      console.error('[AgriSys] session lookup failed', error);
      UI.fatal('Cannot reach the PHP application server. Start the app with PHP and try again.');
      return null;
    }

    if (response.status === 401) {
      window.location.replace(redirect);
      return null;
    }

    if (!response.ok) {
      UI.fatal('Your session could not be checked. Please reload or sign in again.');
      return null;
    }

    const payload = await response.json();
    const profile = payload.user;
    if (!profile || !profile.id) {
      UI.fatal('The server returned an invalid user profile.');
      return null;
    }
    API.setCsrfToken(payload.csrfToken);

    if (opts.adminOnly && profile.role !== 'admin') {
      UI.accessDenied();
      return null;
    }

    return {
      user: { id: profile.id, email: profile.email },
      profile: profile,
      csrfToken: payload.csrfToken
    };
  }

  async function signOut() {
    try {
      const response = await fetch('api/auth.php?op=logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csrfToken: window.APP_CSRF_TOKEN || '' })
      });
      if (!response.ok) throw new Error('Sign out could not be completed.');
    } finally {
      window.location.replace('index.php');
    }
  }

  return { requireAuth: requireAuth, signOut: signOut };
})();

/* ==========================================================================
   Shared application shell: sidebar + top bar
   ========================================================================== */

window.Layout = (function () {
  'use strict';

  const NAV = [
    { key: 'dashboard', label: 'Dashboard', href: 'dashboard.php', icon: 'bi-speedometer2', subtitle: 'Overview of your farm operations' },
    { section: 'Core Modules' },
    { key: 'farmers', label: 'Farmers', href: 'farmers.php', icon: 'bi-people', subtitle: 'People registered in the system' },
    { key: 'farms', label: 'Farms', href: 'farms.php', icon: 'bi-map', subtitle: 'Farm lots, soil and irrigation details' },
    { key: 'crops', label: 'Crops', href: 'crops.php', icon: 'bi-flower1', subtitle: 'Crop master data and growing seasons' },
    { key: 'plantings', label: 'Planting Records', href: 'plantings.php', icon: 'bi-calendar-check', subtitle: 'Crop planting transactions' },
    { key: 'harvests', label: 'Harvest Records', href: 'harvests.php', icon: 'bi-basket', subtitle: 'Harvested quantity and quality' },
    { section: 'Insights' },
    { key: 'reports', label: 'Reports', href: 'reports.php', icon: 'bi-file-earmark-bar-graph', subtitle: 'Printable and exportable summaries' },
    { key: 'users', label: 'User Accounts', href: 'users.php', icon: 'bi-shield-lock', subtitle: 'Roles and access control', adminOnly: true }
  ];

  function render(activeKey, profile) {
    const info = window.APP_INFO || {};
    const sidebar = document.getElementById('sidebar');
    const topbar = document.getElementById('topbar');
    if (!sidebar || !topbar) return;

    const fullName = profile.full_name || profile.email || 'User';
    const role = profile.role === 'admin' ? 'Administrator' : 'Staff';
    const current = NAV.filter(function (item) { return item.key === activeKey; })[0] || NAV[0];

    const links = NAV.map(function (item) {
      if (item.section) {
        return '<div class="sidebar-label">' + UI.esc(item.section) + '</div>';
      }
      if (item.adminOnly && profile.role !== 'admin') return '';
      const active = item.key === activeKey ? ' active' : '';
      return '<a class="sidebar-link' + active + '" href="' + item.href + '">' +
        '<i class="bi ' + item.icon + '"></i><span>' + UI.esc(item.label) + '</span></a>';
    }).join('');

    sidebar.innerHTML =
      '<div class="sidebar-brand">' +
        '<div class="brand-mark"><i class="bi bi-tree-fill"></i></div>' +
        '<div class="brand-text"><strong>' + UI.esc(info.shortName || 'AgriSys') + '</strong>' +
          '<span>Agriculture IS</span></div>' +
      '</div>' +
      '<nav class="sidebar-nav">' + links + '</nav>' +
      '<div class="sidebar-foot">' +
        '<div class="role-chip"><i class="bi bi-shield-check"></i>' + role + '</div><br>' +
        UI.esc(info.university || 'Cebu Technological University') + '<br>' +
        UI.esc(info.course || 'AP3 Midterm Project') +
      '</div>';

    topbar.innerHTML =
      '<button class="icon-btn d-lg-none" id="sidebarToggle" aria-label="Open menu">' +
        '<i class="bi bi-list"></i></button>' +
      '<div class="topbar-title">' +
        '<h1>' + UI.esc(current.label) + '</h1>' +
        '<p>' + UI.esc(current.subtitle) + '</p>' +
      '</div>' +
      '<div class="topbar-spacer"></div>' +
      '<div class="user-chip">' +
        '<div class="avatar">' + UI.esc(UI.initials(fullName)) + '</div>' +
        '<div class="d-none d-md-block">' +
          '<div class="u-name">' + UI.esc(fullName) + '</div>' +
          '<div class="u-role">' + role + '</div>' +
        '</div>' +
      '</div>' +
      '<button class="icon-btn" id="logoutBtn" title="Sign out" aria-label="Sign out">' +
        '<i class="bi bi-box-arrow-right"></i></button>';

    const toggle = document.getElementById('sidebarToggle');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (toggle && backdrop) {
      toggle.addEventListener('click', function () {
        sidebar.classList.toggle('show');
        backdrop.classList.toggle('show');
      });
      backdrop.addEventListener('click', function () {
        sidebar.classList.remove('show');
        backdrop.classList.remove('show');
      });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', function () { Auth.signOut(); });
  }

  return { render: render };
})();

window.initLayout = function (activeKey, profile) {
  window.Layout.render(activeKey, profile);
};
