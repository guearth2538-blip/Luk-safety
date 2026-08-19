/* Keep Dashboard "จุดติดตั้งทั้งหมด" synced with active Master Data locations. */
(() => {
  let masterLocationCount = null;
  let observer = null;

  function applyCount() {
    const el = document.querySelector('#mLocations');
    if (!el || masterLocationCount === null) return;
    const value = String(masterLocationCount);
    if (el.textContent !== value) el.textContent = value;
  }

  async function refreshMasterLocationCount() {
    try {
      const { count, error } = await db
        .from('locations')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      if (error) throw error;
      masterLocationCount = count ?? 0;
      applyCount();

      const el = document.querySelector('#mLocations');
      if (el && !observer) {
        observer = new MutationObserver(applyCount);
        observer.observe(el, { childList: true, characterData: true, subtree: true });
      }
    } catch (err) {
      console.error('Unable to load master location count', err);
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(refreshMasterLocationCount, 800);
    document.addEventListener('click', (event) => {
      if (event.target.closest('[data-page="dashboard"]')) {
        setTimeout(applyCount, 50);
      }
    });
    const search = document.querySelector('#dashboardSearch');
    if (search) search.addEventListener('input', () => setTimeout(applyCount, 50));

    if (!document.querySelector('script[data-usability-enhancements]')) {
      const script = document.createElement('script');
      script.src = 'usability-enhancements.js';
      script.dataset.usabilityEnhancements = 'true';
      document.body.appendChild(script);
    }
  });

  if (typeof db !== 'undefined' && db.auth) {
    db.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setTimeout(refreshMasterLocationCount, 300);
      }
    });
  }
})();
