/* ==========================================================================
   Supabase configuration
   --------------------------------------------------------------------------
   1. Open your Supabase project -> Project Settings -> API.
   2. Copy "Project URL" and the "anon public" key below.
   3. Save this file. Never put the service_role key here.

   The anon key is safe to ship in a browser application because Row Level
   Security is enabled on every table. Access is granted through user login.
   ========================================================================== */

window.APP_CONFIG = {
  SUPABASE_URL: 'https://cxiwbgnrbrdufqjraaoo.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4aXdiZ25yYnJkdWZxanJhYW9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQzMTc2MTQsImV4cCI6MjEwOTg5MzYxNH0.leUTA9utwWL9ifkbpq3KkeCaegzaROLiFGVK9X3-bGk'
};

/* Optional: shown on the login screen and in the top bar. */
window.APP_INFO = {
  university: 'Cebu Technological University',
  systemName: 'Agriculture Information System',
  shortName: 'AgriSys',
  course: 'AP3 - Midterm Project'
};
