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

  async function init() {
    try {
      const response = await fetch('api/auth.php?op=session', { cache: 'no-store' });
      if (response.ok) window.location.replace('dashboard.php');
    } catch (error) {
      console.error('[AgriSys] session check failed', error);
      showAlert('Cannot reach the PHP server. Start the app using PHP and reload this page.', 'warning');
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
        const response = await fetch('api/auth.php?op=login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            password: password,
            csrfToken: window.APP_CSRF_TOKEN || ''
          })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Sign in failed. Please try again.');
        window.APP_CSRF_TOKEN = result.csrfToken;
        window.location.replace(result.redirect || 'dashboard.php');
      } catch (error) {
        console.error('[AgriSys] sign in failed', error);
        showAlert(UI.esc(error.message || 'Sign in failed. Please try again.'));
        passwordInput.value = '';
        passwordInput.focus();
      } finally {
        UI.setBusy(submitBtn, false);
      }
    });
  }

  init();
})();
