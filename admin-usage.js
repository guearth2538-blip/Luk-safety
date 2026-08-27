// Admin Supabase usage dashboard — read-only metrics for admins.
(() => {
  const $ = s => document.querySelector(s);
  const fmtBytes = n => {
    n = Number(n || 0);
    if (n < 1024) return `${n} B`;
    if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
    return `${(n / 1024 ** 3).toFixed(2)} GB`;
  };
  const pct = (used, limit) => Math.max(0, Math.min(100, limit ? used / limit * 100 : 0));
  const ready = fn => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn();

  ready(() => {
    const panel = $('#panel');
    const tabs = panel?.querySelector('.tabs');
    if (!panel || !tabs || $('#usageTab')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.tab = 'usage';
    btn.textContent = '📦 พื้นที่ใช้งาน';
    tabs.appendChild(btn);

    const section = document.createElement('section');
    section.id = 'usageTab';
    section.className = 'tab hidden';
    section.innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
          <div><h2 style="margin:0 0 6px">📦 พื้นที่ใช้งาน Supabase</h2><div style="color:#6b7280;font-size:13px">อ่านค่าจริงจาก Database และ Storage • เฉพาะ Admin</div></div>
          <button id="usageRefresh" class="btn primary" type="button">↻ อัปเดตข้อมูล</button>
        </div>
        <div id="usageMsg" class="msg"></div>
      </div>

      <div class="report-stats" id="usageStats">
        <div class="stat"><small>Database</small><b id="usageDb">—</b><div id="usageDbPct" style="font-size:12px;color:#6b7280"></div></div>
        <div class="stat"><small>Storage</small><b id="usageStorage">—</b><div id="usageStoragePct" style="font-size:12px;color:#6b7280"></div></div>
        <div class="stat"><small>ไฟล์ใน Storage</small><b id="usageFiles">—</b><div style="font-size:12px;color:#6b7280">ทุก bucket รวมกัน</div></div>
        <div class="stat"><small>คาดว่าเหลือ</small><b id="usageMonths">—</b><div id="usageMonthsNote" style="font-size:12px;color:#6b7280"></div></div>
      </div>

      <div class="card">
        <h3 style="margin-top:0">พื้นที่คงเหลือ</h3>
        <div style="display:grid;gap:16px">
          <div><div style="display:flex;justify-content:space-between;gap:12px"><b>Database</b><span id="usageDbBarText">—</span></div><div style="height:12px;background:#e5e7eb;border-radius:999px;overflow:hidden;margin-top:7px"><div id="usageDbBar" style="height:100%;width:0;background:#166534"></div></div></div>
          <div><div style="display:flex;justify-content:space-between;gap:12px"><b>Storage</b><span id="usageStorageBarText">—</span></div><div style="height:12px;background:#e5e7eb;border-radius:999px;overflow:hidden;margin-top:7px"><div id="usageStorageBar" style="height:100%;width:0;background:#166534"></div></div></div>
        </div>
        <p style="font-size:12px;color:#6b7280;margin-bottom:0">ค่าเริ่มต้นสำหรับ Free Plan: Database 500 MB ต่อโปรเจกต์ และ Storage 1 GB ต่อองค์กร หากเปลี่ยน Plan ให้แก้สมมติฐานด้านล่างก่อนใช้การคาดการณ์</p>
      </div>

      <div class="card">
        <h3 style="margin-top:0">🧮 ประมาณการสำหรับการตรวจ 277 จุด/เดือน</h3>
        <div class="grid">
          <div class="field"><label>จำนวนจุดตรวจ / เดือน</label><input id="usagePoints" type="number" min="1" value="277"></div>
          <div class="field"><label>รูปเฉลี่ย / จุด</label><input id="usagePhotosPerPoint" type="number" min="0" step="0.1" value="2"></div>
          <div class="field"><label>ขนาดรูปเฉลี่ยหลังบีบอัด (KB)</label><input id="usageAvgPhotoKb" type="number" min="1" value="200"></div>
          <div class="field"><label>Storage limit (GB)</label><input id="usageStorageLimitGb" type="number" min="0.1" step="0.1" value="1"></div>
          <div class="field"><label>Database limit (MB)</label><input id="usageDbLimitMb" type="number" min="1" value="500"></div>
        </div>
        <div class="actions"><button id="usageCalc" class="btn secondary" type="button">คำนวณใหม่</button></div>
        <div id="usageEstimate" style="margin-top:14px;padding:14px;border:1px solid #e5e7eb;border-radius:12px;background:#fafafa"></div>
      </div>

      <div class="card">
        <h3 style="margin-top:0">Storage แยกตาม Bucket</h3>
        <div class="table-wrap"><table class="table" style="min-width:600px"><thead><tr><th>Bucket</th><th>จำนวนไฟล์</th><th>พื้นที่</th></tr></thead><tbody id="usageBucketBody"><tr><td colspan="3" class="loading">ยังไม่ได้โหลดข้อมูล</td></tr></tbody></table></div>
      </div>`;
    panel.appendChild(section);

    const style = document.createElement('style');
    style.textContent = `.usage-warn{color:#b45309!important}.usage-bad{color:#b91c1c!important}`;
    document.head.appendChild(style);

    let snapshot = null;

    function limits(){
      return {
        db: Number($('#usageDbLimitMb').value || 500) * 1024 ** 2,
        storage: Number($('#usageStorageLimitGb').value || 1) * 1024 ** 3
      };
    }

    function barColor(p){ return p >= 90 ? '#b91c1c' : p >= 75 ? '#d97706' : '#166534'; }

    function renderEstimate(){
      const points = Math.max(0, Number($('#usagePoints').value || 0));
      const photos = Math.max(0, Number($('#usagePhotosPerPoint').value || 0));
      const kb = Math.max(0, Number($('#usageAvgPhotoKb').value || 0));
      const lim = limits();
      const currentStorage = Number(snapshot?.storage_bytes || 0);
      const monthlyStorage = points * photos * kb * 1024;
      const remaining = Math.max(0, lim.storage - currentStorage);
      const months = monthlyStorage > 0 ? remaining / monthlyStorage : Infinity;
      const monthlyText = fmtBytes(monthlyStorage);
      const monthText = Number.isFinite(months) ? (months < 1 ? '< 1 เดือน' : `${months.toFixed(months < 10 ? 1 : 0)} เดือน`) : 'ไม่จำกัดตามรูป';
      $('#usageMonths').textContent = monthText;
      $('#usageMonthsNote').textContent = `${photos} รูป/จุด • ${kb} KB/รูป`;
      $('#usageEstimate').innerHTML = `<b>ประมาณการ:</b> ถ้าตรวจ ${points.toLocaleString('th-TH')} จุด/เดือน และถ่ายเฉลี่ย ${photos} รูป/จุด ที่ ${kb} KB/รูป จะเพิ่ม Storage ประมาณ <b>${monthlyText}/เดือน</b> และจากพื้นที่ที่ใช้ปัจจุบันจะเหลือประมาณ <b>${monthText}</b> ก่อนถึง Storage limit ที่ตั้งไว้<br><span style="color:#6b7280;font-size:12px">เป็นค่าประมาณเพื่อวางแผน พื้นที่จริงขึ้นกับจำนวนรูปและขนาดไฟล์จริงในแต่ละเดือน</span>`;
    }

    function render(){
      if (!snapshot) return;
      const lim = limits();
      const db = Number(snapshot.database_bytes || 0), st = Number(snapshot.storage_bytes || 0);
      const dbP = pct(db, lim.db), stP = pct(st, lim.storage);
      $('#usageDb').textContent = fmtBytes(db);
      $('#usageStorage').textContent = fmtBytes(st);
      $('#usageFiles').textContent = Number(snapshot.storage_files || 0).toLocaleString('th-TH');
      $('#usageDbPct').textContent = `${dbP.toFixed(1)}% ของ ${fmtBytes(lim.db)}`;
      $('#usageStoragePct').textContent = `${stP.toFixed(1)}% ของ ${fmtBytes(lim.storage)}`;
      $('#usageDbBar').style.width = `${dbP}%`; $('#usageDbBar').style.background = barColor(dbP);
      $('#usageStorageBar').style.width = `${stP}%`; $('#usageStorageBar').style.background = barColor(stP);
      $('#usageDbBarText').textContent = `${fmtBytes(db)} / ${fmtBytes(lim.db)}`;
      $('#usageStorageBarText').textContent = `${fmtBytes(st)} / ${fmtBytes(lim.storage)}`;
      const buckets = Array.isArray(snapshot.buckets) ? snapshot.buckets : [];
      $('#usageBucketBody').innerHTML = buckets.length ? buckets.map(x => `<tr><td><b>${String(x.bucket_id || '—')}</b></td><td>${Number(x.files || 0).toLocaleString('th-TH')}</td><td>${fmtBytes(x.bytes)}</td></tr>`).join('') : '<tr><td colspan="3" class="loading">ยังไม่มีไฟล์ใน Storage</td></tr>';
      renderEstimate();
    }

    async function loadUsage(){
      const refresh = $('#usageRefresh');
      refresh.disabled = true; refresh.textContent = 'กำลังโหลด...';
      $('#usageMsg').textContent = 'กำลังอ่านข้อมูลจาก Supabase...'; $('#usageMsg').style.color = '#6b7280';
      try {
        const { data, error } = await db.rpc('get_admin_usage_snapshot');
        if (error) throw error;
        snapshot = data || {};
        render();
        const d = snapshot.captured_at ? new Date(snapshot.captured_at).toLocaleString('th-TH') : '—';
        $('#usageMsg').textContent = `อัปเดตล่าสุด ${d}`; $('#usageMsg').style.color = '#166534';
      } catch (e) {
        console.error(e);
        $('#usageMsg').textContent = 'โหลดพื้นที่ใช้งานไม่สำเร็จ: ' + (e.message || 'เกิดข้อผิดพลาด'); $('#usageMsg').style.color = '#b91c1c';
      } finally {
        refresh.disabled = false; refresh.textContent = '↻ อัปเดตข้อมูล';
      }
    }

    btn.addEventListener('click', async e => {
      e.preventDefault();
      panel.querySelectorAll('.tabs button').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      panel.querySelectorAll('.tab').forEach(x => x.classList.add('hidden'));
      section.classList.remove('hidden');
      if (!snapshot) await loadUsage(); else render();
    });

    $('#usageRefresh').onclick = loadUsage;
    $('#usageCalc').onclick = render;
    ['#usagePoints','#usagePhotosPerPoint','#usageAvgPhotoKb','#usageStorageLimitGb','#usageDbLimitMb'].forEach(id => $(id).addEventListener('input', () => snapshot && render()));
  });
})();