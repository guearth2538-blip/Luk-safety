// Fire Safety V2 Floor Plan Workspace — isolated from V1.
(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const ready = fn => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn();

  ready(() => {
    const host = $('#v2previewTab');
    if (!host || $('#v2FloorPlanCard')) return;

    const style = document.createElement('style');
    style.textContent = `
      .fp-card{background:#fff;border-radius:16px;padding:20px;box-shadow:0 4px 18px #0000000b;margin-bottom:18px}
      .fp-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;margin-bottom:14px}.fp-head h2{margin:0 0 5px}.fp-head p{margin:0;color:#6b7280;font-size:13px}
      .fp-tools{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.fp-tools input,.fp-tools select{padding:10px 12px;border:1px solid #d1d5db;border-radius:10px;background:#fff;font:inherit}.fp-tools input{width:120px}
      .fp-btn{border:0;border-radius:10px;padding:10px 13px;font-weight:800;cursor:pointer;background:#e5e7eb}.fp-btn.primary{background:#b91c1c;color:#fff}.fp-btn.green{background:#166534;color:#fff}.fp-btn:disabled{opacity:.5;cursor:not-allowed}
      .fp-banner{background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a8a;border-radius:12px;padding:12px 14px;margin-bottom:14px;font-size:13px;line-height:1.55}
      .fp-legend{display:flex;gap:14px;align-items:center;flex-wrap:wrap;font-size:13px;color:#4b5563}.fp-dot{width:12px;height:12px;border-radius:50%;display:inline-block;margin-right:5px;vertical-align:-1px}.fp-dot.green{background:#16a34a}.fp-dot.red{background:#dc2626}.fp-dot.orange{background:#f59e0b}
      .fp-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}.fp-summary>div{border:1px solid #e5e7eb;border-radius:12px;padding:12px;background:#fafafa}.fp-summary small{display:block;color:#6b7280;font-weight:700}.fp-summary b{display:block;font-size:22px;margin-top:3px}.fp-summary .ok b{color:#166534}.fp-summary .pending b{color:#b91c1c}
      .fp-wrap{display:grid;grid-template-columns:minmax(0,1fr) 310px;gap:16px;align-items:start}.fp-plan{position:relative;border:1px solid #d1d5db;border-radius:16px;overflow:hidden;background:#f8fafc;min-height:480px;display:flex;align-items:center;justify-content:center}.fp-plan.editing{cursor:crosshair;outline:3px solid #f59e0b33}.fp-plan img{width:100%;height:auto;display:block;user-select:none;-webkit-user-drag:none}.fp-empty{text-align:center;color:#6b7280;padding:60px 25px}.fp-empty b{display:block;color:#111827;font-size:18px;margin-bottom:8px}
      .fp-pin{position:absolute;transform:translate(-50%,-50%);width:32px;height:32px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px #0004;color:#fff;font-weight:900;font-size:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:2;touch-action:none}.fp-pin.checked{background:#16a34a}.fp-pin.pending{background:#dc2626}.fp-pin.selected{outline:4px solid #f59e0b;z-index:5}.fp-pin.dragging{cursor:grabbing;transform:translate(-50%,-50%) scale(1.13)}
      .fp-side{border:1px solid #e5e7eb;border-radius:14px;padding:16px;background:#fff;min-height:250px;position:sticky;top:12px}.fp-side h3{margin:0 0 12px}.fp-detail{color:#4b5563;font-size:14px;line-height:1.65}.fp-detail b{color:#111827}.fp-form{display:grid;gap:10px}.fp-form label{font-size:12px;font-weight:800;color:#374151}.fp-form input,.fp-form select{width:100%;margin-top:4px;padding:9px 10px;border:1px solid #d1d5db;border-radius:9px;font:inherit}.fp-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}.fp-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}.fp-msg{font-size:12px;color:#6b7280;min-height:18px;margin-top:6px}.fp-danger{background:#fee2e2;color:#991b1b}.fp-plan-name{font-weight:800;color:#111827;margin-left:5px}
      @media(max-width:950px){.fp-wrap{grid-template-columns:1fr}.fp-side{position:static}.fp-summary{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:560px){.fp-summary{grid-template-columns:1fr}.fp-tools{align-items:stretch}.fp-tools>*{flex:1}}
    `;
    document.head.appendChild(style);

    const card = document.createElement('div');
    card.id = 'v2FloorPlanCard';
    card.className = 'fp-card';
    card.innerHTML = `
      <div class="fp-head">
        <div><h2>🗺️ Floor Plan Monitoring <span style="font-size:11px;padding:4px 8px;border-radius:999px;background:#fff7ed;color:#9a3412">V2 Workspace</span></h2><p>แปลนภาพจริง + LOC จริง • แยกตารางและ Storage จาก Version 1</p></div>
        <div class="fp-tools">
          <input id="fpFloor" value="ชั้น 1" placeholder="เช่น ชั้น 1">
          <button id="fpLoad" class="fp-btn" type="button">เปิดชั้น</button>
          <label class="fp-btn primary" style="display:inline-flex;align-items:center">📁 อัปโหลดแปลน<input id="fpUpload" type="file" accept="image/png,image/jpeg,image/webp" hidden></label>
          <button id="fpAddMode" class="fp-btn green" type="button" disabled>＋ วาง LOC</button>
        </div>
      </div>
      <div class="fp-banner"><b>วิธีใช้:</b> เลือกชั้น → อัปโหลดภาพแปลนจริง → กด “วาง LOC” → คลิกตำแหน่งจริงบนแปลน → กรอก LOC แล้วบันทึก จุดที่บันทึกแล้วสามารถลากปรับตำแหน่งได้ ทุกอย่างอยู่ใน V2 เท่านั้น</div>
      <div class="fp-legend"><span><i class="fp-dot green"></i>ตรวจแล้ว</span><span><i class="fp-dot red"></i>ยังไม่ตรวจ</span><span><i class="fp-dot orange"></i>จุดที่กำลังแก้ไข</span><span>แปลน: <span id="fpPlanName" class="fp-plan-name">ยังไม่ได้อัปโหลด</span></span></div>
      <div class="fp-summary"><div><small>จุดทั้งหมด</small><b id="fpTotal">0</b></div><div class="ok"><small>ตรวจแล้ว</small><b id="fpChecked">0</b></div><div class="pending"><small>ยังไม่ตรวจ</small><b id="fpPending">0</b></div><div><small>ความคืบหน้า</small><b id="fpPct">0%</b></div></div>
      <div class="fp-wrap">
        <div id="fpPlan" class="fp-plan"><div class="fp-empty"><b>ยังไม่มีแปลนของชั้นนี้</b>กด “อัปโหลดแปลน” แล้วเลือกไฟล์ JPG / PNG / WEBP</div></div>
        <aside class="fp-side">
          <h3>รายละเอียด / จัดตำแหน่ง LOC</h3>
          <div id="fpDetail" class="fp-detail">เลือกจุดบนแปลน หรือกด “วาง LOC” เพื่อเพิ่มจุดใหม่</div>
          <div id="fpMsg" class="fp-msg"></div>
        </aside>
      </div>`;
    host.insertBefore(card, host.firstChild?.nextSibling || host.firstChild);

    let currentPlan = null;
    let points = [];
    let selected = null;
    let addMode = false;
    let dragging = null;
    const planEl = $('#fpPlan');
    const detail = $('#fpDetail');
    const msg = $('#fpMsg');

    function setMsg(t, bad=false){ msg.textContent=t||''; msg.style.color=bad?'#b91c1c':'#6b7280'; }
    function floorValue(){ return $('#fpFloor').value.trim() || 'ชั้น 1'; }
    function storageFloorKey(value){
      const ascii=String(value||'').normalize('NFKD').replace(/[^\x00-\x7F]/g,' ').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
      return `floor-${ascii||'plan'}`;
    }
    function updateStats(){ const c=points.filter(p=>p.status==='checked').length; $('#fpTotal').textContent=points.length; $('#fpChecked').textContent=c; $('#fpPending').textContent=points.length-c; $('#fpPct').textContent=points.length?Math.round(c/points.length*100)+'%':'0%'; }
    async function signedPlanUrl(path){ const r=await db.storage.from('v2-floorplans').createSignedUrl(path,3600); if(r.error)throw r.error; return r.data.signedUrl; }

    async function loadFloor(){
      setMsg('กำลังโหลดแปลน...'); selected=null; points=[]; currentPlan=null; addMode=false; planEl.classList.remove('editing'); $('#fpAddMode').disabled=true; $('#fpPlanName').textContent='กำลังโหลด...';
      const floor=floorValue();
      const pr=await db.from('v2_floor_plans').select('*').eq('floor',floor).eq('is_active',true).maybeSingle();
      if(pr.error) return setMsg('โหลดแปลนไม่สำเร็จ: '+pr.error.message,true);
      if(!pr.data){ planEl.innerHTML='<div class="fp-empty"><b>ยังไม่มีแปลนของ '+esc(floor)+'</b>กด “อัปโหลดแปลน” แล้วเลือกภาพแปลนจริง</div>'; $('#fpPlanName').textContent='ยังไม่ได้อัปโหลด'; updateStats(); detail.textContent='เมื่ออัปโหลดแปลนแล้ว คุณสามารถวาง LOC จริงได้'; setMsg(''); return; }
      currentPlan=pr.data;
      const rr=await db.from('v2_floor_points').select('*').eq('floor_plan_id',currentPlan.id).eq('is_active',true).order('sort_order').order('loc_code');
      if(rr.error)return setMsg('โหลดจุด LOC ไม่สำเร็จ: '+rr.error.message,true);
      points=rr.data||[];
      try{
        const url=await signedPlanUrl(currentPlan.storage_path);
        planEl.innerHTML=`<img id="fpImage" src="${url}" alt="${esc(floor)} floor plan">`;
        $('#fpPlanName').textContent=currentPlan.original_name||currentPlan.storage_path;
        $('#fpAddMode').disabled=false;
        renderPins(); updateStats(); showHelp(); setMsg(`โหลด ${floor} แล้ว • ${points.length} จุด`);
      }catch(e){setMsg('เปิดไฟล์แปลนไม่สำเร็จ: '+e.message,true)}
    }

    async function uploadPlan(file){
      if(!file)return;
      if(file.size>10*1024*1024)return setMsg('ไฟล์ใหญ่เกิน 10 MB',true);
      const floor=floorValue(); setMsg('กำลังอัปโหลดแปลนจริง...');
      const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'') || 'jpg';
      const safeFloor=storageFloorKey(floor);
      const path=`${safeFloor}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const up=await db.storage.from('v2-floorplans').upload(path,file,{contentType:file.type,upsert:false});
      if(up.error)return setMsg('อัปโหลดไม่สำเร็จ: '+up.error.message,true);
      const {data:{user}}=await db.auth.getUser();
      const old=await db.from('v2_floor_plans').select('*').eq('floor',floor).maybeSingle();
      if(old.error)return setMsg(old.error.message,true);
      let res;
      if(old.data){
        res=await db.from('v2_floor_plans').update({storage_path:path,original_name:file.name,updated_at:new Date().toISOString(),updated_by:user?.id||null,is_active:true}).eq('id',old.data.id).select().single();
        if(!res.error && old.data.storage_path && old.data.storage_path!==path) db.storage.from('v2-floorplans').remove([old.data.storage_path]);
      } else res=await db.from('v2_floor_plans').insert({floor,storage_path:path,original_name:file.name,updated_by:user?.id||null}).select().single();
      if(res.error)return setMsg('บันทึกข้อมูลแปลนไม่สำเร็จ: '+res.error.message,true);
      setMsg('อัปโหลดแปลนเรียบร้อย'); await loadFloor();
    }

    function pctFromEvent(e){ const r=planEl.getBoundingClientRect(); return {x:Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100)),y:Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*100))}; }
    function renderPins(){
      planEl.querySelectorAll('.fp-pin').forEach(x=>x.remove());
      points.forEach((p,i)=>{
        const b=document.createElement('button'); b.type='button'; b.className=`fp-pin ${p.status}${selected?.id===p.id?' selected':''}`; b.style.left=p.x_pct+'%'; b.style.top=p.y_pct+'%'; b.textContent=i+1; b.title=`${p.loc_code} • ${p.loc_name||''}`;
        b.onpointerdown=e=>{ if(addMode)return; dragging={point:p,button:b,moved:false}; b.setPointerCapture?.(e.pointerId); b.classList.add('dragging'); e.stopPropagation(); };
        b.onpointermove=e=>{ if(!dragging||dragging.point.id!==p.id)return; dragging.moved=true; const q=pctFromEvent(e); b.style.left=q.x+'%'; b.style.top=q.y+'%'; };
        b.onpointerup=async e=>{ if(!dragging||dragging.point.id!==p.id)return; b.classList.remove('dragging'); const moved=dragging.moved; dragging=null; if(moved){const q=pctFromEvent(e);p.x_pct=q.x;p.y_pct=q.y;const r=await db.from('v2_floor_points').update({x_pct:q.x,y_pct:q.y,updated_at:new Date().toISOString()}).eq('id',p.id);setMsg(r.error?'ย้ายจุดไม่สำเร็จ: '+r.error.message:'บันทึกตำแหน่งใหม่แล้ว',!!r.error);renderPins();}else selectPoint(p); e.stopPropagation(); };
        planEl.appendChild(b);
      });
    }
    function showHelp(){ detail.innerHTML='<b>โหมดดูแปลน</b><br>• คลิก LOC เพื่อดู/แก้ข้อมูล<br>• ลาก LOC เพื่อย้ายตำแหน่ง<br>• กด “วาง LOC” แล้วคลิกพื้นที่บนแปลนเพื่อเพิ่มจุดใหม่'; }
    function pointForm(p,isNew=false){
      selected=p;
      detail.innerHTML=`<form id="fpPointForm" class="fp-form"><label>รหัส LOC<input id="fpLocCode" required value="${esc(p.loc_code||'')}"></label><label>ชื่อจุดติดตั้ง<input id="fpLocName" value="${esc(p.loc_name||'')}"></label><label>อุปกรณ์ / รายละเอียด<input id="fpEquipment" value="${esc(p.equipment_label||'')}"></label><div class="fp-row"><label>สถานะ<select id="fpStatus"><option value="pending" ${p.status!=='checked'?'selected':''}>ยังไม่ตรวจ</option><option value="checked" ${p.status==='checked'?'selected':''}>ตรวจแล้ว</option></select></label><label>พิกัด<input value="${Number(p.x_pct).toFixed(1)}%, ${Number(p.y_pct).toFixed(1)}%" readonly></label></div><div class="fp-actions"><button class="fp-btn primary" type="submit">💾 ${isNew?'เพิ่ม LOC':'บันทึก'}</button>${isNew?'<button id="fpCancelNew" class="fp-btn" type="button">ยกเลิก</button>':'<button id="fpDeletePoint" class="fp-btn fp-danger" type="button">ลบจุด V2</button>'}</div></form>`;
      $('#fpPointForm').onsubmit=async e=>{e.preventDefault();const payload={floor_plan_id:currentPlan.id,loc_code:$('#fpLocCode').value.trim(),loc_name:$('#fpLocName').value.trim()||null,equipment_label:$('#fpEquipment').value.trim()||null,status:$('#fpStatus').value,x_pct:p.x_pct,y_pct:p.y_pct,updated_at:new Date().toISOString()};if(!payload.loc_code)return setMsg('กรุณากรอกรหัส LOC',true);let r;if(isNew)r=await db.from('v2_floor_points').insert(payload).select().single();else r=await db.from('v2_floor_points').update(payload).eq('id',p.id).select().single();if(r.error)return setMsg('บันทึก LOC ไม่สำเร็จ: '+r.error.message,true);setMsg('บันทึก LOC เรียบร้อย');addMode=false;planEl.classList.remove('editing');$('#fpAddMode').textContent='＋ วาง LOC';await loadFloor();};
      if(isNew) $('#fpCancelNew').onclick=()=>{addMode=false;selected=null;planEl.classList.remove('editing');$('#fpAddMode').textContent='＋ วาง LOC';showHelp();};
      else $('#fpDeletePoint').onclick=async()=>{if(!confirm(`ลบ ${p.loc_code} ออกจากแปลน V2?`))return;const r=await db.from('v2_floor_points').delete().eq('id',p.id);if(r.error)return setMsg(r.error.message,true);await loadFloor();};
      renderPins();
    }
    function selectPoint(p){ pointForm(p,false); }
    planEl.addEventListener('click',e=>{if(!addMode||!currentPlan||!$('#fpImage')||e.target.closest('.fp-pin'))return;const q=pctFromEvent(e);const n=points.length+1;pointForm({loc_code:`LOC-V2-${String(n).padStart(3,'0')}`,loc_name:'',equipment_label:'',status:'pending',x_pct:q.x,y_pct:q.y},true);});
    $('#fpAddMode').onclick=()=>{if(!currentPlan)return;addMode=!addMode;planEl.classList.toggle('editing',addMode);$('#fpAddMode').textContent=addMode?'✕ ยกเลิกวาง LOC':'＋ วาง LOC';if(addMode){selected=null;detail.innerHTML='<b>โหมดวาง LOC</b><br>คลิกตำแหน่งจริงบนภาพแปลน แล้วกรอกรหัส/ชื่อจุดด้านขวา';renderPins();}else showHelp();};
    $('#fpLoad').onclick=loadFloor;
    $('#fpFloor').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();loadFloor();}});
    $('#fpUpload').onchange=async e=>{const f=e.target.files?.[0];e.target.value='';if(f)await uploadPlan(f);};
    loadFloor();
  });
})();
