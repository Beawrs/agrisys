/* ==========================================================================
   Supabase client bootstrap
   Creates window.db when js/config.js contains real credentials.
   ========================================================================== */

(function () {
  'use strict';

  const cfg = window.APP_CONFIG || {};
  const url = String(cfg.SUPABASE_URL || '').trim();
  const key = String(cfg.SUPABASE_ANON_KEY || '').trim();

  const looksReal =
    /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) &&
    key.length > 40 &&
    !/YOUR-|PASTE|CHANGE/i.test(key);

  window.APP_READY = Boolean(looksReal && window.supabase);

  if (window.APP_READY) {
    window.db = window.supabase.createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  } else {
    window.db = null;
    // Helpful diagnostics in the console (not shown to end users).
    if (!window.supabase) {
      console.warn('[AgriSys] Supabase JS library did not load. Check your internet connection or the CDN script tag.');
    } else if (!looksReal) {
      console.warn('[AgriSys] Supabase is not configured yet. Edit js/config.js with your Project URL and anon key.');
    }
  }
})();
