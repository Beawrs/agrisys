/* Login page */
(function () {
  'use strict';

  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const alertBox = document.getElementById('loginAlert');
  const submitBtn = document.getElementById('loginBtn');
  const toggleBtn = document.getElementById('togglePassword');

  function showAlert(message, variant) {
    alertBox.className = 'alert alert-' + (variant || 'danger');
    alertBox.innerHTML = message;
    alertBox.classList.remove('d-none');
  }

  function hideAlert() {
    alertBox.classList.add('d-none');
  }

  function friendlyAuthError(error) {
    const message = String((error && error.message) || '');
    if (/invalid login credentials/i.test(message)) {
      return 'Incorrect email or password. Please try again.';
    }
    if (/email not confirmed/i.test(message)) {
      return 'This account has not been confirmed yet. Contact the administrator.';
    }
    if (/rate limit|too many/i.test(message)) {
      return 'Too many sign-in attempts. Please wait a moment and try again.';
    }
    if (/failed to fetch|network/i.test(message)) {
      return 'Cannot reach the server. Check your internet connection and try again.';
    }
    return message || 'Sign in failed. Please try again.';
  }

  async function init() {
    if (!window.APP_READY) {
      showAlert(
        '<strong>Database not connected.</strong> Edit <code>js/config.js</code> and add your Supabase ' +
        'Project URL and anon key, then reload this page. Full steps are in <code>docs/SETUP.md</code>.',
        'warning'
      );
      form.querySelectorAll('input, button').forEach(function (el) { el.disabled = true; });
      return;
    }

    try {
      const res = await db.auth.getSession();
      if (res.data && res.data.session) {
        window.location.replace('dashboard.html');
      }
    } catch (error) {
      console.error(error);
    }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      const show = passwordInput.type === 'password';
      passwordInput.type = show ? 'text' : 'password';
      toggleBtn.innerHTML = '<i class="bi ' + (show ? 'bi-eye-slash' : 'bi-eye') + '"></i>';
      toggleBtn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
  }

  if (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      hideAlert();

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email || !password) {
        showAlert('Please enter both your email address and password.');
        return;
      }

      UI.setBusy(submitBtn, true);
      try {
        const res = await db.auth.signInWithPassword({ email: email, password: password });
        if (res.error) throw res.error;
        window.location.replace('dashboard.html');
      } catch (error) {
        console.error('[AgriSys] sign in failed', error);
        showAlert(UI.esc(friendlyAuthError(error)));
        passwordInput.value = '';
        passwordInput.focus();
      } finally {
        UI.setBusy(submitBtn, false);
      }
    });
  }

  init();
})();
