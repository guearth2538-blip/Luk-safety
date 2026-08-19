/* Dashboard fixes + supervisor/admin QR management. */
(() => {
  let masterLocationCount = null;
  let observer = null;
  let qrRows = [];
  let qrLoaded = false;

  function applyCount() {
    const el = document.querySelector('#mLocations');
    if (!el || masterLocationCount === null) return;
    const value = String(masterLocationCount);
    if (el.textContent !== value) el.textContent = value;
  }

  async function refreshMasterLocationCount() {
    try {
      const { count, error } = await db.from('locations').select('*', { count: 'exact', head: true }).eq('is_active', true);
      if (error) throw error;
      masterLocationCount = count ?? 0;
      applyCount();
      const el = document.querySelector('#mLocations');
      if (el && !observer) {
        observer = new MutationObserver(applyCount);
        observer.observe(el, { childList: true, characterData: true, subtree: true });
      }
    } catch (err) { console.error('Unable to load master location count', err); }
  }

  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  function ensureQrLib() {
    return new Promise((resolve, reject) => {
      if (window.QRCode) return resolve();
      const old = document.querySelector('script[data-qrcode-lib]');
      if (old) { old.addEventListener('load', resolve, {once:true}); old.addEventListener('error', reject, {once:true}); return; }
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
      s.dataset.qrcodeLib = '1'; s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
    });
  }

  function injectQrPanel() {
    if (document.querySelector('#qrManagementCard')) return;
    const dashboard = document.querySelector('#dashboard');
    if (!dashboard) return;
    const card = document.createElement('div');
    card.id = 'qrManagementCard';
    card.className = 'card';
    card.style.marginTop = '18px';
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
        <div><h3 style="margin:0 0 5px">▦ QR Code จุดตรวจ Fire Man</h3><p style="margin:0;color:#6b7280">สำหรับหัวหน้างาน/Admin เท่านั้น • ใช้พิมพ์ QR ไปติด ณ จุดตรวจจริง</p></div>
        <button id="qrToggle" class="ghost" type="button">เปิดรายการ QR</button>
      </div>
      <div id="qrManagerBody" style="display:none;margin-top:14px">
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">
          <input id="qrSearch" placeholder="🔍 ค้นหา LOC / ชื่อจุด / ชั้น..." style="flex:1;min-width:220px;padding:11px;border:1px solid #d1d5db;border-radius:10px">
          <button id="qrPrint" class="primary" type="button">🖨 พิมพ์ QR</button>
        </div>
        <div id="qrStatus" style="color:#6b7280;padding:8px 0">กด “เปิดรายการ QR” เพื่อโหลดข้อมูล</div>
        <div id="qrGrid" class="dashboard-qr-grid"></div>
      </div>`;
    dashboard.appendChild(card);

    const style = document.createElement('style');
    style.textContent = `.dashboard-qr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(205px,1fr));gap:12px}.dashboard-qr-card{border:1px solid #e5e7eb;border-radius:14px;padding:14px;text-align:center;background:#fff}.dashboard-qr-card .qrbox{display:flex;justify-content:center;min-height:142px}.dashboard-qr-card h4{margin:8px 0 4px}.dashboard-qr-card p{margin:3px 0;color:#6b7280;font-size:13px}.dashboard-qr-card .loc{font-weight:900;color:#991b1b}@media print{body *{visibility:hidden!important}#qrManagementCard,#qrManagementCard *{visibility:visible!important}#qrManagementCard{position:absolute;left:0;top:0;width:100%;box-shadow:none!important;border:0!important}#qrManagementCard>div:first-child,#qrSearch,#qrPrint,#qrStatus{display:none!important}.dashboard-qr-grid{grid-template-columns:repeat(3,1fr)!important}.dashboard-qr-card{break-inside:avoid;page-break-inside:avoid}}`;
    document.head.appendChild(style);

    document.querySelector('#qrToggle').onclick = async () => {
      const body = document.querySelector('#qrManagerBody');
      const opening = body.style.display === 'none';
      body.style.display = opening ? 'block' : 'none';
      document.querySelector('#qrToggle').textContent = opening ? 'ซ่อนรายการ QR' : 'เปิดรายการ QR';
      if (opening && !qrLoaded) await loadQrDirectory();
    };
    document.querySelector('#qrSearch').oninput = e => renderQrRows(filterQr(e.target.value));
    document.querySelector('#qrPrint').onclick = () => window.print();
  }

  async function authorizedForQr() {
    const { data: { user } } = await db.auth.getUser();
    if (!user) return false;
    const { data, error } = await db.from('profiles').select('role,is_active').eq('id', user.id).single();
    if (error || !data?.is_active) return false;
    return data.role === 'supervisor' || data.role === 'admin';
  }

  async function loadQrDirectory() {
    const status = document.querySelector('#qrStatus');
    try {
      status.textContent = 'กำลังโหลด QR จุดตรวจ...';
      await ensureQrLib();
      const { data, error } = await db.rpc('get_fireman_qr_directory');
      if (error) throw error;
      qrRows = data || []; qrLoaded = true;
      status.textContent = `ทั้งหมด ${qrRows.length} จุด`;
      renderQrRows(qrRows);
    } catch (err) {
      console.error(err); status.textContent = 'โหลด QR ไม่สำเร็จ หรือบัญชีนี้ไม่มีสิทธิ์';
    }
  }

  function filterQr(q) {
    q = String(q || '').trim().toLowerCase();
    if (!q) return qrRows;
    return qrRows.filter(r => `${r.location_code} ${r.location_name} ${r.floor || ''} ${r.building || ''}`.toLowerCase().includes(q));
  }

  function renderQrRows(rows) {
    const grid = document.querySelector('#qrGrid'); if (!grid) return;
    grid.innerHTML = rows.map((r,i) => `<article class="dashboard-qr-card"><div class="qrbox" id="dashqr-${i}"></div><div class="loc">${esc(r.location_code)}</div><h4>${esc(r.location_name)}</h4><p>${esc(r.floor || '-')} ${r.building ? '• '+esc(r.building) : ''}</p></article>`).join('');
    setTimeout(() => rows.forEach((r,i) => {
      const el = document.querySelector(`#dashqr-${i}`); if (!el || !window.QRCode) return;
      const url = `${location.origin}${location.pathname.replace(/index\.html$/,'')}fireman.html?qr=${encodeURIComponent(r.token)}`;
      new QRCode(el, { text:url, width:138, height:138, correctLevel:QRCode.CorrectLevel.M });
    }), 0);
  }

  async function setupQrPanel() {
    try { if (await authorizedForQr()) injectQrPanel(); } catch (e) { console.error('QR panel auth check failed', e); }
  }

  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(refreshMasterLocationCount, 800);
    setTimeout(setupQrPanel, 900);
    document.addEventListener('click', event => { if (event.target.closest('[data-page="dashboard"]')) setTimeout(applyCount, 50); });
    const search = document.querySelector('#dashboardSearch'); if (search) search.addEventListener('input', () => setTimeout(applyCount, 50));
    if (!document.querySelector('script[data-usability-enhancements]')) {
      const script = document.createElement('script'); script.src = 'usability-enhancements.js'; script.dataset.usabilityEnhancements = 'true'; document.body.appendChild(script);
    }
  });

  if (typeof db !== 'undefined' && db.auth) {
    db.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') { setTimeout(refreshMasterLocationCount, 300); setTimeout(setupQrPanel, 500); }
    });
  }
})();

/* Single-entry role router: one login URL, then route by Supabase profile role. */
(() => {
  let navigating = false;
  const basePath = () => location.pathname.replace(/[^/]*$/, '');

  async function routeByRole() {
    if (navigating || typeof db === 'undefined' || !db.auth) return;
    try {
      const { data: { session } } = await db.auth.getSession();
      if (!session) return;
      const { data: profile, error } = await db.from('profiles').select('role,is_active').eq('id', session.user.id).maybeSingle();
      if (error) throw error;
      if (!profile?.is_active) {
        await db.auth.signOut();
        const m = document.querySelector('#authMsg');
        if (m) m.textContent = 'บัญชีนี้ถูกปิดใช้งาน';
        return;
      }

      if (profile.role === 'admin') {
        navigating = true;
        location.replace(basePath() + 'admin-v2.html');
        return;
      }

      if (profile.role === 'fireman') {
        navigating = true;
        const saved = sessionStorage.getItem('firemanReturn');
        sessionStorage.removeItem('firemanReturn');
        if (saved) {
          try {
            const u = new URL(saved, location.href);
            if (u.origin === location.origin && u.pathname.endsWith('/fireman.html')) {
              location.replace(u.href);
              return;
            }
          } catch (_) {}
        }
        location.replace(basePath() + 'fireman.html');
        return;
      }

      if (profile.role === 'supervisor') {
        const role = document.querySelector('#userRoleLabel');
        if (role) role.textContent = 'หัวหน้างาน';
        return;
      }

      await db.auth.signOut();
      const m = document.querySelector('#authMsg');
      if (m) m.textContent = 'บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานระบบ';
    } catch (err) {
      console.error('Role routing failed', err);
    }
  }

  setTimeout(routeByRole, 50);
  if (typeof db !== 'undefined' && db.auth) {
    db.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        setTimeout(routeByRole, 0);
      }
    });
  }
})();
