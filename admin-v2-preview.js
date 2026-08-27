// Fire Safety Version 2 preview — Admin only, read-only.
// Uses existing inspection data to preview Corrective Action + Executive Analytics
// without changing production records or database schema.
(() => {
  const tabs = document.querySelector('.tabs');
  const panel = document.querySelector('#panel');
  if (!tabs || !panel || document.querySelector('#v2previewTab')) return;

  let loaded = false;

  const escV2 = s => String(s ?? '').replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[m]));
  const dateV2 = value => value
    ? new Date(value).toLocaleString('th-TH', { dateStyle:'medium', timeStyle:'short' })
    : '—';

  const style = document.createElement('style');
  style.textContent = `
    [data-tab="v2preview"]{background:#fff7ed!important;color:#9a3412;border:1px solid #fed7aa!important}
    [data-tab="v2preview"].active{background:#c2410c!important;color:#fff!important;border-color:#c2410c!important}
    .v2-banner{display:flex;align-items:flex-start;gap:12px;padding:15px 16px;border:1px solid #fdba74;background:#fff7ed;border-radius:14px;margin-bottom:18px}
    .v2-banner b{display:block;color:#9a3412;margin-bottom:3px}.v2-banner p{margin:0;color:#7c2d12;font-size:13px}
    .v2-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}
    .v2-metric{background:#fff;border:1px solid #e5e7eb;border-radius:15px;padding:16px;box-shadow:0 3px 14px #00000008}
    .v2-metric small{display:block;color:#6b7280;font-weight:700}.v2-metric b{display:block;font-size:27px;margin-top:5px}.v2-metric.bad b{color:#b91c1c}.v2-metric.good b{color:#166534}.v2-metric.orange b{color:#c2410c}
    .v2-grid{display:grid;grid-template-columns:1.35fr .65fr;gap:18px;align-items:start}.v2-card{background:#fff;border-radius:16px;padding:20px;box-shadow:0 4px 18px #0000000b;margin-bottom:18px}
    .v2-card h2,.v2-card h3{margin-top:0}.v2-sub{color:#6b7280;font-size:13px;margin-top:-6px;margin-bottom:16px}
    .v2-readonly{display:inline-block;padding:4px 8px;border-radius:999px;background:#f3f4f6;color:#4b5563;font-size:11px;font-weight:800}
    .v2-action-badge{display:inline-block;padding:5px 9px;border-radius:999px;background:#ffedd5;color:#9a3412;font-size:12px;font-weight:800;white-space:nowrap}
    .v2-progress{height:13px;background:#e5e7eb;border-radius:999px;overflow:hidden;margin:8px 0}.v2-progress>span{display:block;height:100%;background:#166534;border-radius:999px}
    .v2-score{font-size:34px;font-weight:900;color:#166534}.v2-list{display:grid;gap:9px}.v2-list-row{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #f1f5f9}.v2-list-row:last-child{border-bottom:0}.v2-list-row span{color:#4b5563}.v2-list-row b{color:#111827}
    .v2-roadmap{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.v2-phase{position:relative;border:1px solid #e5e7eb;border-radius:15px;padding:17px;background:#fff}.v2-phase.done{border-color:#86efac;background:#f0fdf4}.v2-phase.next{border-color:#fdba74;background:#fff7ed}.v2-phase small{font-weight:900;color:#6b7280}.v2-phase h3{margin:8px 0 7px}.v2-phase p{color:#6b7280;font-size:13px;line-height:1.55;margin:0}.v2-phase .tag{position:absolute;right:12px;top:12px;font-size:11px;font-weight:800;padding:4px 7px;border-radius:999px;background:#f3f4f6}.v2-phase.done .tag{background:#dcfce7;color:#166534}.v2-phase.next .tag{background:#ffedd5;color:#9a3412}
    .v2-empty{text-align:center;color:#6b7280;padding:28px}.v2-loading{text-align:center;color:#6b7280;padding:35px}
    @media(max-width:950px){.v2-metrics{grid-template-columns:repeat(2,1fr)}.v2-grid{grid-template-columns:1fr}.v2-roadmap{grid-template-columns:1fr}}
    @media(max-width:560px){.v2-metrics{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const tab = document.createElement('button');
  tab.type = 'button';
  tab.dataset.tab = 'v2preview';
  tab.textContent = '🧪 Version 2 ทดลอง';
  tabs.appendChild(tab);

  const section = document.createElement('section');
  section.id = 'v2previewTab';
  section.className = 'tab hidden';
  section.innerHTML = `
    <div class="v2-banner">
      <div style="font-size:24px">🧪</div>
      <div><b>Version 2 Preview — โหมดทดลองแบบอ่านอย่างเดียว</b><p>หน้านี้ใช้ข้อมูลตรวจจริงเพื่อจำลองระบบติดตามงานแก้ไข แต่ยังไม่สร้าง/แก้ไข Corrective Action จริง จึงไม่กระทบ Version 1 ที่ใช้งานอยู่</p></div>
    </div>
    <div id="v2PreviewBody"><div class="v2-loading">เปิดเมนู Version 2 เพื่อโหลดข้อมูล...</div></div>`;
  panel.appendChild(section);

  tab.addEventListener('click', async () => {
    document.querySelectorAll('.tabs button').forEach(x => x.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.tab').forEach(x => x.classList.add('hidden'));
    section.classList.remove('hidden');
    if (!loaded) await loadV2Preview();
  });

  function groupTop(rows, getter, limit = 5) {
    const map = new Map();
    rows.forEach(row => {
      const key = getter(row);
      if (!key) return;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()].sort((a,b) => b[1] - a[1]).slice(0, limit);
  }

  function badItemText(row) {
    const items = (row.inspection_items || []).filter(x => x.status === 'bad').map(x => x.item_name).filter(Boolean);
    return items.length ? items.join(', ') : (row.general_note || 'พบผลตรวจชำรุด');
  }

  function locationTextV2(row) {
    const l = row.equipment?.locations;
    if (!l) return '—';
    return [l.location_code, l.location_name, l.floor, l.building].filter(Boolean).join(' • ');
  }

  async function loadV2Preview() {
    const body = document.querySelector('#v2PreviewBody');
    body.innerHTML = '<div class="v2-loading">กำลังวิเคราะห์ข้อมูล Version 2 จาก Supabase...</div>';
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const end = now.toISOString();

      const [totalR, badCountR, equipmentR, locationsR, badRowsR] = await Promise.all([
        db.from('inspections').select('id', { count:'exact', head:true }).gte('inspected_at', start).lte('inspected_at', end),
        db.from('inspections').select('id', { count:'exact', head:true }).eq('overall_status','bad').gte('inspected_at', start).lte('inspected_at', end),
        db.from('equipment').select('id', { count:'exact', head:true }).eq('is_active', true),
        db.from('locations').select('id', { count:'exact', head:true }).eq('is_active', true),
        db.from('inspections').select(`
          id, inspected_at, overall_status, general_note, inspector_display_name,
          equipment(equipment_code,equipment_label,equipment_type,locations(location_code,location_name,floor,building)),
          inspection_items(item_name,status,note)
        `).eq('overall_status','bad').gte('inspected_at', start).lte('inspected_at', end).order('inspected_at',{ascending:false}).limit(1000)
      ]);

      for (const r of [totalR,badCountR,equipmentR,locationsR,badRowsR]) if (r.error) throw r.error;

      const total = totalR.count || 0;
      const bad = badCountR.count || 0;
      const good = Math.max(0, total - bad);
      const rate = total ? Math.round((good / total) * 100) : 0;
      const badRows = badRowsR.data || [];
      const problemLocations = new Set(badRows.map(r => r.equipment?.locations?.location_code || r.equipment?.locations?.location_name).filter(Boolean)).size;

      const topLocations = groupTop(badRows, r => r.equipment?.locations?.location_name || r.equipment?.locations?.location_code);
      const itemRows = badRows.flatMap(r => (r.inspection_items || []).filter(i => i.status === 'bad'));
      const topItems = groupTop(itemRows, i => i.item_name);

      const rowsHtml = badRows.slice(0, 12).map((r, i) => `
        <tr>
          <td style="text-align:center">${i + 1}</td>
          <td class="nowrap">${escV2(dateV2(r.inspected_at))}</td>
          <td>${escV2(locationTextV2(r))}</td>
          <td><b>${escV2(r.equipment?.equipment_code || '—')}</b><br><small>${escV2(r.equipment?.equipment_label || '')}</small></td>
          <td class="bad-list">${escV2(badItemText(r))}</td>
          <td>${escV2(r.inspector_display_name || '—')}</td>
          <td><span class="v2-action-badge">รอสร้าง Action Plan</span></td>
        </tr>`).join('');

      const listHtml = (items, emptyText) => items.length
        ? items.map(([name,count]) => `<div class="v2-list-row"><span>${escV2(name)}</span><b>${count.toLocaleString('th-TH')}</b></div>`).join('')
        : `<div class="v2-empty">${emptyText}</div>`;

      body.innerHTML = `
        <div class="v2-metrics">
          <div class="v2-metric"><small>อุปกรณ์ Active</small><b>${(equipmentR.count || 0).toLocaleString('th-TH')}</b><small>รายการในฐานข้อมูลปัจจุบัน</small></div>
          <div class="v2-metric good"><small>การตรวจเดือนนี้</small><b>${total.toLocaleString('th-TH')}</b><small>ผลปกติ ${good.toLocaleString('th-TH')} รายการ</small></div>
          <div class="v2-metric bad"><small>พบผลชำรุดเดือนนี้</small><b>${bad.toLocaleString('th-TH')}</b><small>${problemLocations.toLocaleString('th-TH')} จุดติดตั้งที่พบปัญหา</small></div>
          <div class="v2-metric orange"><small>จุดติดตั้ง Active</small><b>${(locationsR.count || 0).toLocaleString('th-TH')}</b><small>พร้อมต่อยอดติดตามรายพื้นที่</small></div>
        </div>

        <div class="v2-grid">
          <div>
            <div class="v2-card">
              <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><h2>🛠 Corrective Action Preview</h2><div class="v2-sub">นำผล “ชำรุด” จากเดือนปัจจุบันมาแสดงเป็นคิวงานแก้ไขเบื้องต้น</div></div><span class="v2-readonly">READ ONLY</span></div>
              <div class="table-wrap"><table class="table" style="min-width:1050px"><thead><tr><th style="text-align:center">ลำดับ</th><th>วันที่พบ</th><th>จุดติดตั้ง</th><th>อุปกรณ์</th><th>ประเด็นชำรุด</th><th>ผู้ตรวจ</th><th>สถานะ V2</th></tr></thead><tbody>${rowsHtml || '<tr><td colspan="7" class="v2-empty">เดือนนี้ยังไม่พบรายการชำรุด</td></tr>'}</tbody></table></div>
              <p class="report-note"><b>เมื่อเปิดใช้จริง:</b> ตารางนี้จะเพิ่ม ผู้รับผิดชอบ • Due Date • ระดับความเร่งด่วน • รูปหลังแก้ไข • ผู้อนุมัติปิดงาน • จำนวนวันค้าง</p>
            </div>
          </div>
          <div>
            <div class="v2-card">
              <h3>📈 Executive Snapshot</h3>
              <div class="v2-score">${rate}%</div><div class="v2-sub">สัดส่วนผลตรวจปกติในเดือนนี้</div>
              <div class="v2-progress"><span style="width:${Math.max(0,Math.min(100,rate))}%"></span></div>
              <div class="v2-list-row"><span>ตรวจทั้งหมด</span><b>${total.toLocaleString('th-TH')}</b></div>
              <div class="v2-list-row"><span>ปกติ</span><b>${good.toLocaleString('th-TH')}</b></div>
              <div class="v2-list-row"><span>ชำรุด</span><b style="color:#b91c1c">${bad.toLocaleString('th-TH')}</b></div>
            </div>
            <div class="v2-card"><h3>📍 จุดที่พบปัญหาบ่อย</h3><div class="v2-list">${listHtml(topLocations,'ยังไม่มีข้อมูลชำรุดเดือนนี้')}</div></div>
            <div class="v2-card"><h3>⚠️ หัวข้อชำรุดที่พบบ่อย</h3><div class="v2-list">${listHtml(topItems,'ยังไม่มีข้อมูลหัวข้อชำรุดเดือนนี้')}</div></div>
          </div>
        </div>

        <div class="v2-card">
          <h2>🗺 Roadmap จากระบบตรวจ → Fire Safety Management System</h2>
          <div class="v2-sub">แนวทางแยกการพัฒนาเป็นเฟส เพื่อไม่กระทบระบบตรวจหน้างานที่ผ่านการใช้งานแล้ว</div>
          <div class="v2-roadmap">
            <div class="v2-phase done"><span class="tag">ใช้งานแล้ว</span><small>VERSION 1</small><h3>Inspection Digitization</h3><p>QR จุดตรวจ • บันทึกผล • รูปหลักฐาน • Dashboard • Report • แยกสิทธิ์ผู้ใช้</p></div>
            <div class="v2-phase next"><span class="tag">ขั้นถัดไป</span><small>VERSION 2</small><h3>Corrective Action Management</h3><p>Assign ผู้รับผิดชอบ • Due Date • Priority • ติดตามงานค้าง • รูปหลังแก้ไข • Close & Verify</p></div>
            <div class="v2-phase"><span class="tag">Roadmap</span><small>VERSION 3</small><h3>Management Analytics</h3><p>KPI ผู้บริหาร • แนวโน้มรายเดือน • Repeat Defect • SLA การแก้ไข • วิเคราะห์พื้นที่เสี่ยง</p></div>
          </div>
        </div>`;
      loaded = true;
    } catch (err) {
      console.error('Version 2 preview failed', err);
      body.innerHTML = `<div class="v2-card"><div class="msg">โหลด Version 2 Preview ไม่สำเร็จ: ${escV2(err.message || 'เกิดข้อผิดพลาด')}</div></div>`;
    }
  }
})();
