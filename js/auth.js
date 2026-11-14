/* ==========================================================================
   Authentication guard and layout shell
   ========================================================================== */

window.Auth = (function () {
  'use strict';

  let wired = false;

  async function requireAuth(settings) {
    const opts = settings || {};
    const redirect = opts.redirect || 'index.html';

    if (!window.APP_READY) {
      UI.setupNotice();
      return null;
    }

    let session = null;
    try {
      const res = await db.auth.getSession();
      session = res.data ? res.data.session : null;
    } catch (error) {
      console.error('[AgriSys] session lookup failed', error);
    }

    if (!session) {
      window.location.replace(redirect);
      return null;
    }

    let profile = null;
    const res = await db
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', session.user.id)
      .maybeSingle();

    if (!res.error && res.data) {
      profile = res.data;
    } else {
      if (res.error) console.warn('[AgriSys] profile lookup failed', res.error);
      profile = {
        id: session.user.id,
        email: session.user.email || '',
        full_name: session.user.email || 'User',
        role: 'staff'
      };
    }

    if (opts.adminOnly && profile.role !== 'admin') {
      UI.accessDenied();
      return null;
    }

    if (!wired) {
      wired = true;
      db.auth.onAuthStateChange(function (event) {
        if (event === 'SIGNED_OUT') window.location.replace(redirect);
      });
    }

    return { session: session, user: session.user, profile: profile };
  }

  async function signOut() {
    try {
      if (window.db) await db.auth.signOut();
    } finally {
      window.location.replace('index.html');
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
    { key: 'dashboard', label: 'Dashboard', href: 'dashboard.html', icon: 'bi-speedometer2', subtitle: 'Overview of your farm operations' },
    { section: 'Core Modules' },
    { key: 'farmers', label: 'Farmers', href: 'farmers.html', icon: 'bi-people', subtitle: 'People registered in the system' },
    { key: 'farms', label: 'Farms', href: 'farms.html', icon: 'bi-map', subtitle: 'Farm lots and irrigation details' },
    { key: 'crops', label: 'Crops', href: 'crops.html', icon: 'bi-flower1', subtitle: 'Crop master data and prices' },
    { key: 'plantings', label: 'Planting Records', href: 'plantings.html', icon: 'bi-calendar-check', subtitle: 'Crop planting transactions' },
    { key: 'harvests', label: 'Harvest Records', href: 'harvests.html', icon: 'bi-basket', subtitle: 'Harvested quantity and quality' },
    { section: 'Insights' },
    { key: 'reports', label: 'Reports', href: 'reports.html', icon: 'bi-file-earmark-bar-graph', subtitle: 'Printable and exportable summaries' },
    { key: 'users', label: 'User Accounts', href: 'users.html', icon: 'bi-shield-lock', subtitle: 'Roles and access control', adminOnly: true }
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
