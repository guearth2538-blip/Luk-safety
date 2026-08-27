// Fire Safety V2 Floor Plan Monitoring Preview — demo data only, isolated from V1.
(() => {
  function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn);else fn()}
  ready(() => {
    const host=document.querySelector('#v2previewTab');
    if(!host||document.querySelector('#v2FloorPlanCard'))return;

    const style=document.createElement('style');
    style.textContent=`
      .fp-card{background:#fff;border-radius:16px;padding:20px;box-shadow:0 4px 18px #0000000b;margin-bottom:18px}
      .fp-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;margin-bottom:14px}
      .fp-head h2{margin:0 0 5px}.fp-head p{margin:0;color:#6b7280;font-size:13px}
      .fp-tools{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.fp-tools select{padding:10px 12px;border:1px solid #d1d5db;border-radius:10px;background:#fff;font:inherit}
      .fp-legend{display:flex;gap:14px;align-items:center;flex-wrap:wrap;font-size:13px;color:#4b5563}.fp-dot{width:12px;height:12px;border-radius:50%;display:inline-block;margin-right:5px;vertical-align:-1px}.fp-dot.green{background:#16a34a}.fp-dot.red{background:#dc2626}.fp-dot.gray{background:#9ca3af}
      .fp-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0}.fp-summary>div{border:1px solid #e5e7eb;border-radius:12px;padding:12px;background:#fafafa}.fp-summary small{display:block;color:#6b7280;font-weight:700}.fp-summary b{display:block;font-size:22px;margin-top:3px}.fp-summary .ok b{color:#166534}.fp-summary .pending b{color:#b91c1c}
      .fp-wrap{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:16px;align-items:start}.fp-plan{position:relative;min-height:540px;border:1px solid #d1d5db;border-radius:16px;overflow:hidden;background:#f8fafc}
      .fp-plan svg{width:100%;height:540px;display:block}.fp-room{fill:#fff;stroke:#cbd5e1;stroke-width:2}.fp-corridor{fill:#f1f5f9;stroke:#cbd5e1;stroke-width:2}.fp-label{font:700 15px system-ui;fill:#64748b}.fp-pin{position:absolute;transform:translate(-50%,-50%);width:32px;height:32px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px #0003;color:#fff;font-weight:900;font-size:11px;display:flex;align-items:center;justify-content:center;cursor:pointer}.fp-pin.checked{background:#16a34a}.fp-pin.pending{background:#dc2626}.fp-pin:hover{transform:translate(-50%,-50%) scale(1.12);z-index:3}.fp-pin.active{outline:4px solid #f59e0b;z-index:4}
      .fp-side{border:1px solid #e5e7eb;border-radius:14px;padding:16px;background:#fff;min-height:250px}.fp-side h3{margin:0 0 12px}.fp-detail{color:#4b5563;font-size:14px;line-height:1.65}.fp-detail b{color:#111827}.fp-status{display:inline-block;padding:5px 9px;border-radius:999px;font-size:12px;font-weight:800}.fp-status.checked{background:#dcfce7;color:#166534}.fp-status.pending{background:#fee2e2;color:#991b1b}.fp-demo{display:inline-block;padding:4px 8px;border-radius:999px;background:#fff7ed;color:#9a3412;font-size:11px;font-weight:800;margin-left:6px}
      @media(max-width:900px){.fp-wrap{grid-template-columns:1fr}.fp-summary{grid-template-columns:1fr}.fp-plan{min-height:470px}.fp-plan svg{height:470px}}
    `;
    document.head.appendChild(style);

    const card=document.createElement('div');
    card.id='v2FloorPlanCard';
    card.className='fp-card';
    card.innerHTML=`
      <div class="fp-head">
        <div><h2>🗺️ Floor Plan Monitoring <span class="fp-demo">V2 Demo</span></h2><p>เลือกชั้นเพื่อดูสถานะจุดตรวจบนแปลน • ชุดนี้เป็นข้อมูลทดลองแยกจาก Version 1 ทั้งหมด</p></div>
        <div class="fp-tools"><label>ชั้น <select id="fpFloor"><option value="7">ชั้น 7 — Demo 21 จุด</option></select></label></div>
      </div>
      <div class="fp-legend"><span><i class="fp-dot green"></i>ตรวจแล้ว</span><span><i class="fp-dot red"></i>ยังไม่ตรวจ</span><span><i class="fp-dot gray"></i>พื้นที่/ห้อง</span></div>
      <div class="fp-summary"><div><small>จุดติดตั้งทั้งหมด</small><b id="fpTotal">21</b></div><div class="ok"><small>ตรวจแล้ว</small><b id="fpChecked">0</b></div><div class="pending"><small>ยังไม่ตรวจ</small><b id="fpPending">0</b></div></div>
      <div class="fp-wrap">
        <div id="fpPlan" class="fp-plan">
          <svg viewBox="0 0 1000 540" preserveAspectRatio="none" aria-label="Floor plan demo">
            <rect x="20" y="20" width="960" height="500" rx="22" fill="#eef2f7" stroke="#cbd5e1" stroke-width="3"/>
            <rect class="fp-corridor" x="90" y="205" width="820" height="130" rx="20"/>
            <rect class="fp-room" x="70" y="55" width="170" height="120" rx="12"/><text class="fp-label" x="120" y="120">ROOM A</text>
            <rect class="fp-room" x="270" y="55" width="190" height="120" rx="12"/><text class="fp-label" x="325" y="120">BMS</text>
            <rect class="fp-room" x="490" y="55" width="185" height="120" rx="12"/><text class="fp-label" x="535" y="120">OFFICE</text>
            <rect class="fp-room" x="705" y="55" width="220" height="120" rx="12"/><text class="fp-label" x="775" y="120">SERVICE</text>
            <rect class="fp-room" x="70" y="365" width="185" height="115" rx="12"/><text class="fp-label" x="115" y="430">ROOM B</text>
            <rect class="fp-room" x="285" y="365" width="180" height="115" rx="12"/><text class="fp-label" x="330" y="430">STORE</text>
            <rect class="fp-room" x="495" y="365" width="175" height="115" rx="12"/><text class="fp-label" x="530" y="430">PANTRY</text>
            <rect class="fp-room" x="700" y="365" width="225" height="115" rx="12"/><text class="fp-label" x="750" y="430">MEETING</text>
            <text class="fp-label" x="455" y="280">MAIN CORRIDOR</text>
          </svg>
        </div>
        <aside class="fp-side"><h3>รายละเอียดจุดตรวจ</h3><div id="fpDetail" class="fp-detail">คลิกจุดสีเขียวหรือสีแดงบนแปลนเพื่อดูรายละเอียด</div></aside>
      </div>`;
    host.insertBefore(card, host.firstChild?.nextSibling || host.firstChild);

    const points=[
      [1,11,24,'LOC-V2-701','โถงลิฟต์ฝั่ง A','checked','ตรวจล่าสุด 08:15'],[2,19,24,'LOC-V2-702','หน้าห้อง ROOM A','checked','ตรวจล่าสุด 08:18'],[3,29,24,'LOC-V2-703','ทางเดินหน้า BMS','checked','ตรวจล่าสุด 08:21'],[4,39,24,'LOC-V2-704','ห้อง BMS จุดที่ 1','pending','ยังไม่ตรวจ'],[5,48,24,'LOC-V2-705','ห้อง BMS จุดที่ 2','checked','ตรวจล่าสุด 08:28'],[6,58,24,'LOC-V2-706','หน้า OFFICE','pending','ยังไม่ตรวจ'],[7,68,24,'LOC-V2-707','ทางเดินฝั่งตะวันออก','checked','ตรวจล่าสุด 08:34'],[8,79,24,'LOC-V2-708','หน้า SERVICE','checked','ตรวจล่าสุด 08:37'],
      [9,12,50,'LOC-V2-709','Main Corridor A','checked','ตรวจล่าสุด 08:42'],[10,22,50,'LOC-V2-710','Main Corridor B','pending','ยังไม่ตรวจ'],[11,32,50,'LOC-V2-711','Main Corridor C','checked','ตรวจล่าสุด 08:47'],[12,42,50,'LOC-V2-712','Main Corridor D','checked','ตรวจล่าสุด 08:50'],[13,52,50,'LOC-V2-713','Main Corridor E','pending','ยังไม่ตรวจ'],[14,62,50,'LOC-V2-714','Main Corridor F','checked','ตรวจล่าสุด 08:56'],[15,72,50,'LOC-V2-715','Main Corridor G','checked','ตรวจล่าสุด 09:00'],[16,83,50,'LOC-V2-716','Main Corridor H','pending','ยังไม่ตรวจ'],
      [17,15,80,'LOC-V2-717','หน้า ROOM B','checked','ตรวจล่าสุด 09:05'],[18,31,80,'LOC-V2-718','หน้า STORE','pending','ยังไม่ตรวจ'],[19,49,80,'LOC-V2-719','หน้า PANTRY','checked','ตรวจล่าสุด 09:11'],[20,68,80,'LOC-V2-720','หน้า MEETING','checked','ตรวจล่าสุด 09:15'],[21,85,80,'LOC-V2-721','โถงบันไดหนีไฟ','pending','ยังไม่ตรวจ']
    ];

    const plan=card.querySelector('#fpPlan');
    const detail=card.querySelector('#fpDetail');
    const checked=points.filter(x=>x[5]==='checked').length;
    card.querySelector('#fpChecked').textContent=checked;
    card.querySelector('#fpPending').textContent=points.length-checked;

    points.forEach(p=>{
      const btn=document.createElement('button');
      btn.type='button';btn.className=`fp-pin ${p[5]}`;btn.style.left=p[1]+'%';btn.style.top=p[2]+'%';btn.textContent=p[0];btn.title=`${p[3]} • ${p[4]}`;
      btn.onclick=()=>{
        card.querySelectorAll('.fp-pin').forEach(x=>x.classList.remove('active'));btn.classList.add('active');
        const status=p[5]==='checked'?'ตรวจแล้ว':'ยังไม่ตรวจ';
        detail.innerHTML=`<div style="margin-bottom:10px"><span class="fp-status ${p[5]}">${status}</span></div><b>${p[3]}</b><br>${p[4]}<br><br><b>ชั้น:</b> ชั้น 7<br><b>สถานะ:</b> ${status}<br><b>ข้อมูล:</b> ${p[6]}<br><br><span style="color:#6b7280">ใน V2 จริง สามารถต่อยอดให้คลิกแล้วดูอุปกรณ์ รูปตรวจ ประวัติ และ Corrective Action ของจุดนี้ได้</span>`;
      };
      plan.appendChild(btn);
    });
  });
})();
