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
      .fp-head h2{margin:0 0 5px}.fp-head p{margin:0;color:#6b7280;font-size:13px;line-height:1.55}
      .fp-tools{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.fp-tools select{padding:10px 12px;border:1px solid #d1d5db;border-radius:10px;background:#fff;font:inherit}
      .fp-legend{display:flex;gap:14px;align-items:center;flex-wrap:wrap;font-size:13px;color:#4b5563}.fp-dot{width:12px;height:12px;border-radius:50%;display:inline-block;margin-right:5px;vertical-align:-1px}.fp-dot.green{background:#16a34a}.fp-dot.red{background:#dc2626}.fp-dot.gray{background:#94a3b8}
      .fp-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}.fp-summary>div{border:1px solid #e5e7eb;border-radius:12px;padding:12px;background:#fafafa}.fp-summary small{display:block;color:#6b7280;font-weight:700}.fp-summary b{display:block;font-size:22px;margin-top:3px}.fp-summary .ok b{color:#166534}.fp-summary .pending b{color:#b91c1c}.fp-summary .pct b{color:#1d4ed8}
      .fp-wrap{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:16px;align-items:start}.fp-plan{position:relative;aspect-ratio:1000/707;border:1px solid #d1d5db;border-radius:16px;overflow:hidden;background:#fff}
      .fp-plan svg{position:absolute;inset:0;width:100%;height:100%;display:block}.fp-site{fill:#f8fafc;stroke:#d6dce5;stroke-width:2}.fp-road{fill:none;stroke:#cbd5e1;stroke-width:16;stroke-linecap:round;opacity:.55}.fp-building{fill:#fff;stroke:#64748b;stroke-width:2}.fp-unit{fill:#fff;stroke:#ef4444;stroke-width:1.3}.fp-core{fill:#f1f5f9;stroke:#94a3b8;stroke-width:1.5}.fp-hsbc{fill:#f8fafc;stroke:#64748b;stroke-width:2}.fp-label{font:700 13px system-ui;fill:#64748b}.fp-label.big{font-size:24px;fill:#334155}.fp-label.red{font-size:10px;fill:#ef4444}.fp-label.green{font-size:10px;fill:#22c55e}.fp-north{font:700 18px system-ui;fill:#64748b}
      .fp-pin{position:absolute;transform:translate(-50%,-50%);width:31px;height:31px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px #0005;color:#fff;font-weight:900;font-size:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.15s}.fp-pin.checked{background:#16a34a}.fp-pin.pending{background:#dc2626}.fp-pin:hover{transform:translate(-50%,-50%) scale(1.16);z-index:3}.fp-pin.active{outline:4px solid #f59e0b;z-index:4}
      .fp-side{border:1px solid #e5e7eb;border-radius:14px;padding:16px;background:#fff;min-height:260px}.fp-side h3{margin:0 0 12px}.fp-detail{color:#4b5563;font-size:14px;line-height:1.7}.fp-detail b{color:#111827}.fp-status{display:inline-block;padding:5px 9px;border-radius:999px;font-size:12px;font-weight:800}.fp-status.checked{background:#dcfce7;color:#166534}.fp-status.pending{background:#fee2e2;color:#991b1b}.fp-demo{display:inline-block;padding:4px 8px;border-radius:999px;background:#fff7ed;color:#9a3412;font-size:11px;font-weight:800;margin-left:6px}.fp-note{margin-top:13px;padding:11px 13px;border:1px dashed #fdba74;background:#fff7ed;border-radius:11px;color:#9a3412;font-size:12px;line-height:1.55}
      @media(max-width:1000px){.fp-wrap{grid-template-columns:1fr}.fp-summary{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:560px){.fp-summary{grid-template-columns:1fr}.fp-card{padding:14px}.fp-pin{width:27px;height:27px;font-size:9px}}
    `;
    document.head.appendChild(style);

    const card=document.createElement('div');
    card.id='v2FloorPlanCard';
    card.className='fp-card';
    card.innerHTML=`
      <div class="fp-head">
        <div><h2>🗺️ Floor Plan Monitoring <span class="fp-demo">V2 Demo</span></h2><p>Demo ชั้น 1 วาดตามโครงแปลนตัวอย่างที่ส่งมา • จุดสีเขียว/แดงเป็นข้อมูลจำลองเท่านั้น และไม่เชื่อมกับ Version 1</p></div>
        <div class="fp-tools"><label>เลือกชั้น <select id="fpFloor"><option value="1">ชั้น 1 — Demo 21 จุด</option></select></label></div>
      </div>
      <div class="fp-legend"><span><i class="fp-dot green"></i>ตรวจแล้ว</span><span><i class="fp-dot red"></i>ยังไม่ตรวจ</span><span><i class="fp-dot gray"></i>พื้นที่/โครงอาคาร</span></div>
      <div class="fp-summary"><div><small>จุดติดตั้งทั้งหมด</small><b id="fpTotal">21</b></div><div class="ok"><small>ตรวจแล้ว</small><b id="fpChecked">0</b></div><div class="pending"><small>ยังไม่ตรวจ</small><b id="fpPending">0</b></div><div class="pct"><small>ความคืบหน้า</small><b id="fpPct">0%</b></div></div>
      <div class="fp-wrap">
        <div id="fpPlan" class="fp-plan">
          <svg viewBox="0 0 1000 707" preserveAspectRatio="none" aria-label="Floor 1 plan demo based on supplied layout">
            <rect width="1000" height="707" fill="#fff"/>
            <path class="fp-road" d="M65 95 L885 96 Q960 105 948 185 Q930 250 890 330 Q820 470 700 635"/>
            <path class="fp-road" d="M70 650 Q250 610 365 590 Q460 575 520 545"/>
            <text class="fp-label" x="555" y="72">RAMA 4</text>
            <text class="fp-label" x="740" y="560" transform="rotate(-44 740 560)">SOI SALADAENG</text>
            <text class="fp-north" x="48" y="65">N</text>
            <path d="M48 72 L62 98 L48 91 L34 98 Z" fill="#64748b"/>

            <path class="fp-building" d="M155 214 L466 212 L535 196 L606 236 L665 278 L790 346 L690 505 L555 595 L462 522 L356 467 L208 462 L155 405 Z"/>
            <path class="fp-hsbc" d="M640 174 L760 135 L870 220 L817 316 L716 282 Z"/>
            <text class="fp-label big" x="735" y="226">HSBC</text>

            <path class="fp-unit" d="M172 235 L335 235 L335 346 L172 346 Z"/>
            <path class="fp-unit" d="M335 235 L436 235 L436 347 L335 347 Z"/>
            <path class="fp-unit" d="M436 235 L548 235 L548 344 L436 344 Z"/>
            <path class="fp-unit" d="M548 235 L625 265 L590 360 L548 344 Z"/>
            <path class="fp-unit" d="M590 360 L668 392 L620 478 L535 430 Z"/>
            <path class="fp-unit" d="M535 430 L620 478 L555 570 L465 510 Z"/>
            <path class="fp-unit" d="M208 346 L335 346 L335 452 L208 452 Z"/>
            <path class="fp-unit" d="M335 347 L436 347 L465 510 L335 452 Z"/>
            <rect class="fp-core" x="247" y="274" width="78" height="85" rx="6"/>
            <rect class="fp-core" x="366" y="274" width="70" height="85" rx="6"/>
            <rect class="fp-core" x="479" y="330" width="70" height="78" rx="6" transform="rotate(25 514 369)"/>
            <rect class="fp-core" x="535" y="462" width="70" height="70" rx="6" transform="rotate(28 570 497)"/>

            <text class="fp-label green" x="230" y="258">Unit 10 / 11</text>
            <text class="fp-label green" x="360" y="258">Main Lobby</text>
            <text class="fp-label green" x="463" y="258">Unit 33</text>
            <text class="fp-label green" x="575" y="300">Unit 19</text>
            <text class="fp-label green" x="590" y="425">Unit 23-26</text>
            <text class="fp-label green" x="500" y="515">Unit 27-28</text>
            <text class="fp-label green" x="232" y="414">Unit 1 / 2 / 3</text>
            <text class="fp-label red" x="275" y="322">CORE / LIFT</text>
            <text class="fp-label red" x="375" y="322">CORE / LIFT</text>

            <path d="M90 300 Q120 280 145 275" fill="none" stroke="#94a3b8" stroke-width="2"/>
            <path d="M118 485 Q150 472 190 470" fill="none" stroke="#94a3b8" stroke-width="2"/>
            <path d="M630 585 Q665 570 700 545" fill="none" stroke="#94a3b8" stroke-width="2"/>
            <text class="fp-label" x="825" y="660">U CHU LIANG BUILDING • 1 FLOOR</text>
          </svg>
        </div>
        <aside class="fp-side"><h3>รายละเอียดจุดตรวจ</h3><div id="fpDetail" class="fp-detail">คลิกจุดสีเขียวหรือสีแดงบนแปลนเพื่อดูรายละเอียด</div><div class="fp-note">Demo นี้ใช้ตำแหน่งตัวอย่างเพื่อให้เห็นแนวคิดก่อน เมื่อตกลงรูปแบบแล้วค่อยวาง LOC จริงลงตำแหน่งจริงของแปลนทีละจุด</div></aside>
      </div>`;
    const banner=host.querySelector('.v2-banner');
    if(banner)banner.insertAdjacentElement('afterend',card);else host.prepend(card);

    const points=[
      [1,20,34,'LOC-V2-101','ทางเข้าหลักฝั่งตะวันตก','checked','ตรวจล่าสุด 08:05','ตู้ดับเพลิง + ถัง CO2'],
      [2,25,39,'LOC-V2-102','Unit 10','checked','ตรวจล่าสุด 08:09','ถัง BF2000'],
      [3,31,40,'LOC-V2-103','Core Lift ฝั่งซ้าย','pending','ยังไม่ตรวจ','ตู้ดับเพลิง'],
      [4,37,34,'LOC-V2-104','Main Lobby จุดที่ 1','checked','ตรวจล่าสุด 08:16','ถัง CO2'],
      [5,42,41,'LOC-V2-105','Main Lobby จุดที่ 2','checked','ตรวจล่าสุด 08:21','ตู้ดับเพลิง'],
      [6,48,35,'LOC-V2-106','Unit 14','pending','ยังไม่ตรวจ','ถัง BF2000'],
      [7,54,35,'LOC-V2-107','Unit 33 ฝั่งตะวันตก','checked','ตรวจล่าสุด 08:28','ตู้ดับเพลิง'],
      [8,60,39,'LOC-V2-108','Unit 33 ฝั่งตะวันออก','checked','ตรวจล่าสุด 08:31','ถัง CO2'],
      [9,64,44,'LOC-V2-109','ทางเชื่อม HSBC','pending','ยังไม่ตรวจ','ตู้ดับเพลิง'],
      [10,70,37,'LOC-V2-110','HSBC Entrance','checked','ตรวจล่าสุด 08:38','ถัง CO2'],
      [11,74,30,'LOC-V2-111','HSBC Core','checked','ตรวจล่าสุด 08:42','ตู้ดับเพลิง'],
      [12,57,49,'LOC-V2-112','Unit 19','pending','ยังไม่ตรวจ','ถัง BF2000'],
      [13,61,57,'LOC-V2-113','Unit 15-18','checked','ตรวจล่าสุด 08:51','ถัง CO2'],
      [14,65,66,'LOC-V2-114','Unit 23-26','checked','ตรวจล่าสุด 08:56','ตู้ดับเพลิง'],
      [15,58,73,'LOC-V2-115','Unit 27','pending','ยังไม่ตรวจ','ถัง BF2000'],
      [16,51,67,'LOC-V2-116','Unit 28','checked','ตรวจล่าสุด 09:03','ถัง CO2'],
      [17,46,59,'LOC-V2-117','ZA Unit 6','checked','ตรวจล่าสุด 09:07','ตู้ดับเพลิง'],
      [18,39,59,'LOC-V2-118','Unit 4 / 5','pending','ยังไม่ตรวจ','ถัง BF2000'],
      [19,31,57,'LOC-V2-119','Unit 2 / 3','checked','ตรวจล่าสุด 09:14','ถัง CO2'],
      [20,24,54,'LOC-V2-120','Unit 1','checked','ตรวจล่าสุด 09:18','ตู้ดับเพลิง'],
      [21,19,47,'LOC-V2-121','ทางออกฉุกเฉินฝั่งตะวันตก','pending','ยังไม่ตรวจ','ตู้ดับเพลิง + ถัง CO2']
    ];

    const plan=card.querySelector('#fpPlan');
    const detail=card.querySelector('#fpDetail');
    const checkedCount=points.filter(x=>x[5]==='checked').length;
    const pendingCount=points.length-checkedCount;
    card.querySelector('#fpChecked').textContent=checkedCount;
    card.querySelector('#fpPending').textContent=pendingCount;
    card.querySelector('#fpPct').textContent=Math.round(checkedCount/points.length*100)+'%';

    points.forEach(p=>{
      const btn=document.createElement('button');
      btn.type='button';btn.className=`fp-pin ${p[5]}`;btn.style.left=p[1]+'%';btn.style.top=p[2]+'%';btn.textContent=p[0];btn.title=`${p[3]} • ${p[4]}`;
      btn.onclick=()=>{
        card.querySelectorAll('.fp-pin').forEach(x=>x.classList.remove('active'));btn.classList.add('active');
        const status=p[5]==='checked'?'ตรวจแล้ว':'ยังไม่ตรวจ';
        detail.innerHTML=`<div style="margin-bottom:10px"><span class="fp-status ${p[5]}">${status}</span></div><b style="font-size:17px">${p[3]}</b><br>${p[4]}<br><br><b>ชั้น:</b> ชั้น 1<br><b>อุปกรณ์:</b> ${p[7]}<br><b>สถานะ:</b> ${status}<br><b>ข้อมูล:</b> ${p[6]}<br><br><span style="color:#6b7280">V2 จริงสามารถต่อยอดให้คลิกแล้วดูรูปตรวจ ประวัติรายเดือน รายการชำรุด และ Corrective Action ของจุดนี้ได้ทันที</span>`;
      };
      plan.appendChild(btn);
    });
  });
})();
