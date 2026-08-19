const SUPABASE_URL='https://yrhjklnxjchfxbcpopfd.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable__SxBsu9fKpxjS7YPaAyTqA_lqwZW62K';
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let user=null,profile=null,locations=[],equipment=[],reportRows=[];
const extLabel={dry_chemical:'เคมีแห้ง',co2:'CO2',fire_ade:'Fire Ade',avd:'AVD',bf2000:'BF2000'};
const kindLabel={cabinet:'ตู้ดับเพลิง',extinguisher:'ถังดับเพลิง'};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

function msg(id,text,ok=false){
  const e=$(id);if(!e)return;
  e.textContent=text;e.style.color=ok?'#166534':'#b91c1c';
  clearTimeout(e.__timer);e.__timer=setTimeout(()=>e.textContent='',5000);
}

$('#modalClose').onclick=()=>$('#modal').classList.add('hidden');

$$('.tabs button').forEach(b=>b.onclick=async()=>{
  $$('.tabs button').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  $$('.tab').forEach(x=>x.classList.add('hidden'));
  $('#'+b.dataset.tab+'Tab').classList.remove('hidden');
  if(b.dataset.tab==='reports'&&!reportRows.length)await loadReports();
});

function resetLoc(){$('#locationForm').reset();$('#locId').value=''}
function resetEq(){$('#equipmentForm').reset();$('#eqId').value='';$('#eqType').value='cabinet';$('#eqExt').value='';$('#eqType').onchange()}
$('#locReset').onclick=resetLoc;
$('#eqReset').onclick=resetEq;

function localDateValue(d=new Date()){
  const offset=d.getTimezoneOffset()*60000;
  return new Date(d.getTime()-offset).toISOString().slice(0,10);
}
function setDefaultReportDates(){
  const now=new Date(),first=new Date(now.getFullYear(),now.getMonth(),1);
  $('#reportFrom').value=localDateValue(first);
  $('#reportTo').value=localDateValue(now);
}

async function boot(){
  const s=await db.auth.getSession();
  user=s.data.session?.user||null;
  if(!user){$('#access').textContent='กรุณาเข้าสู่ระบบก่อนใช้งานหน้านี้';return}
  const p=await db.from('profiles').select('full_name,role,is_active').eq('id',user.id).single();
  if(p.error||!p.data||p.data.role!=='admin'||!p.data.is_active){
    $('#access').textContent='⛔ หน้านี้สำหรับผู้ดูแลระบบ (admin) เท่านั้น';
    $('#who').textContent=p.data?.full_name||user.email||'';
    return;
  }
  profile=p.data;
  $('#who').textContent=`${profile.full_name} • admin`;
  $('#access').classList.add('hidden');
  $('#panel').classList.remove('hidden');
  setDefaultReportDates();
  await refreshAll();
}

async function refreshAll(){
  await loadLocations();
  await loadEquipment();
  renderLocationSelect();
  renderLocations();
  renderEquipment();
}

async function loadLocations(){
  const r=await db.from('locations').select('*').order('location_code');
  if(r.error){msg('#locMsg','โหลดจุดติดตั้งไม่สำเร็จ: '+r.error.message);return}
  locations=r.data||[];
}

async function loadEquipment(){
  const r=await db.from('equipment').select('*, locations(location_code,location_name,floor)').order('equipment_code');
  if(r.error){msg('#eqMsg','โหลดอุปกรณ์ไม่สำเร็จ: '+r.error.message);return}
  equipment=r.data||[];
}

function renderLocationSelect(){
  const s=$('#eqLocation');
  s.innerHTML='<option value="">เลือกจุดติดตั้ง</option>'+locations.filter(x=>x.is_active).map(x=>`<option value="${x.id}">${esc(x.location_code||'—')} • ${esc(x.location_name)} • ${esc(x.floor)}</option>`).join('');
}

function renderLocations(){
  const q=$('#locSearch').value.trim().toLowerCase();
  const list=locations.filter(x=>[x.location_code,x.location_name,x.floor,x.building,x.zone].join(' ').toLowerCase().includes(q));
  $('#locBody').innerHTML=list.map(x=>`<tr><td>${esc(x.location_code||'—')}</td><td><b>${esc(x.location_name)}</b><br><small>${esc(x.zone||'')}</small></td><td>${esc(x.floor)}</td><td>${esc(x.building||'—')}</td><td><span class="badge ${x.is_active?'':'off'}">${x.is_active?'ใช้งาน':'ปิดใช้งาน'}</span></td><td><button class="btn secondary" data-edit-loc="${x.id}">แก้ไข</button> ${x.is_active?`<button class="btn danger" data-toggle-loc="${x.id}">ปิดใช้งาน</button>`:`<button class="btn primary" data-toggle-loc="${x.id}">เปิดใช้งาน</button>`}</td></tr>`).join('')||'<tr><td colspan="6" class="loading">ไม่พบข้อมูล</td></tr>';
  $$('[data-edit-loc]').forEach(b=>b.onclick=()=>editLocation(b.dataset.editLoc));
  $$('[data-toggle-loc]').forEach(b=>b.onclick=()=>toggleLocation(b.dataset.toggleLoc));
}

function renderEquipment(){
  const q=$('#eqSearch').value.trim().toLowerCase(),kind=$('#eqKind').value;
  const list=equipment.filter(x=>(kind==='all'||x.equipment_type===kind)&&[x.equipment_code,x.equipment_label,x.equipment_type,x.extinguisher_type,x.locations?.location_name,x.locations?.floor].join(' ').toLowerCase().includes(q));
  $('#eqBody').innerHTML=list.map(x=>`<tr><td><b>${esc(x.equipment_code)}</b><br><small>${esc(x.equipment_label||'')}</small></td><td>${kindLabel[x.equipment_type]}</td><td>${esc(x.locations?.location_name||'—')}<br><small>${esc(x.locations?.floor||'')}</small></td><td>${esc(extLabel[x.extinguisher_type]||'—')}</td><td>${x.size_lbs??'—'} ${x.size_lbs?'lbs':''}</td><td><span class="badge ${x.is_active?'':'off'}">${x.is_active?'ใช้งาน':'ปิดใช้งาน'}</span></td><td><button class="btn secondary" data-edit-eq="${x.id}">แก้ไข</button> ${x.is_active?`<button class="btn danger" data-toggle-eq="${x.id}">ปิดใช้งาน</button>`:`<button class="btn primary" data-toggle-eq="${x.id}">เปิดใช้งาน</button>`}</td></tr>`).join('')||'<tr><td colspan="7" class="loading">ไม่พบข้อมูล</td></tr>';
  $$('[data-edit-eq]').forEach(b=>b.onclick=()=>editEquipment(b.dataset.editEq));
  $$('[data-toggle-eq]').forEach(b=>b.onclick=()=>toggleEquipment(b.dataset.toggleEq));
}

function editLocation(id){
  const x=locations.find(v=>v.id===id);if(!x)return;
  $('#locId').value=x.id;$('#locCode').value=x.location_code||'';$('#locName').value=x.location_name;$('#locFloor').value=x.floor;$('#locBuilding').value=x.building||'';$('#locZone').value=x.zone||'';$('#locDesc').value=x.description||'';
  scrollTo({top:0,behavior:'smooth'});
}

function editEquipment(id){
  const x=equipment.find(v=>v.id===id);if(!x)return;
  $$('.tabs button').find(x=>x.dataset.tab==='equipment').click();
  $('#eqId').value=x.id;$('#eqCode').value=x.equipment_code;$('#eqType').value=x.equipment_type;$('#eqLocation').value=x.location_id;$('#eqExt').value=x.extinguisher_type||'';$('#eqSize').value=x.size_lbs??'';$('#eqBrand').value=x.brand||'';$('#eqModel').value=x.model||'';$('#eqSerial').value=x.serial_number||'';$('#eqInstall').value=x.installation_date||'';$('#eqLabel').value=x.equipment_label||'';
  $('#eqType').onchange();scrollTo({top:0,behavior:'smooth'});
}

async function toggleLocation(id){
  const x=locations.find(v=>v.id===id);if(!x)return;
  if(!confirm(`${x.is_active?'ปิดใช้งาน':'เปิดใช้งาน'} จุดติดตั้ง ${x.location_name} ?`))return;
  const r=await db.from('locations').update({is_active:!x.is_active,updated_at:new Date().toISOString()}).eq('id',id);
  if(r.error){msg('#locMsg','แก้ไขสถานะไม่สำเร็จ: '+r.error.message);return}
  await refreshAll();
}

async function toggleEquipment(id){
  const x=equipment.find(v=>v.id===id);if(!x)return;
  if(!confirm(`${x.is_active?'ปิดใช้งาน':'เปิดใช้งาน'} อุปกรณ์ ${x.equipment_code} ?`))return;
  const r=await db.from('equipment').update({is_active:!x.is_active,updated_at:new Date().toISOString()}).eq('id',id);
  if(r.error){msg('#eqMsg','แก้ไขสถานะไม่สำเร็จ: '+r.error.message);return}
  await refreshAll();
}

$('#locationForm').onsubmit=async e=>{
  e.preventDefault();
  const id=$('#locId').value;
  const payload={location_code:$('#locCode').value.trim()||null,location_name:$('#locName').value.trim(),floor:$('#locFloor').value.trim(),building:$('#locBuilding').value.trim()||null,zone:$('#locZone').value.trim()||null,description:$('#locDesc').value.trim()||null,updated_at:new Date().toISOString()};
  const r=id?await db.from('locations').update(payload).eq('id',id):await db.from('locations').insert(payload);
  if(r.error){msg('#locMsg','บันทึกไม่สำเร็จ: '+r.error.message);return}
  msg('#locMsg',id?'แก้ไขจุดติดตั้งแล้ว':'เพิ่มจุดติดตั้งแล้ว',true);resetLoc();await refreshAll();
};

$('#equipmentForm').onsubmit=async e=>{
  e.preventDefault();
  const id=$('#eqId').value,type=$('#eqType').value,ext=$('#eqExt').value||null;
  if(type==='extinguisher'&&!ext){msg('#eqMsg','กรุณาเลือกประเภทถัง');return}
  const payload={equipment_code:$('#eqCode').value.trim(),location_id:$('#eqLocation').value,equipment_type:type,extinguisher_type:type==='extinguisher'?ext:null,size_lbs:$('#eqSize').value?Number($('#eqSize').value):null,brand:$('#eqBrand').value.trim()||null,model:$('#eqModel').value.trim()||null,serial_number:$('#eqSerial').value.trim()||null,installation_date:$('#eqInstall').value||null,equipment_label:$('#eqLabel').value.trim()||null,source_code:$('#eqCode').value.trim(),is_active:true,updated_at:new Date().toISOString()};
  const r=id?await db.from('equipment').update(payload).eq('id',id):await db.from('equipment').insert(payload);
  if(r.error){msg('#eqMsg','บันทึกไม่สำเร็จ: '+r.error.message);return}
  msg('#eqMsg',id?'แก้ไขอุปกรณ์แล้ว':'เพิ่มอุปกรณ์แล้ว',true);resetEq();await refreshAll();
};

function inspectorName(row){return row.inspector_display_name||row.profiles?.full_name||'—'}
function locationText(row){
  const l=row.equipment?.locations;
  if(!l)return '—';
  return [l.location_code,l.location_name,l.floor,l.building].filter(Boolean).join(' • ');
}
function badItems(row){return (row.inspection_items||[]).filter(x=>x.status==='bad').map(x=>x.item_name).filter(Boolean)}
function displayDate(value){return value?new Date(value).toLocaleString('th-TH',{dateStyle:'medium',timeStyle:'short'}):'—'}
function reportDate(value){
  if(!value)return '';
  return new Date(value).toLocaleString('th-TH',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
}

async function loadReports(){
  const body=$('#reportBody');
  const refresh=$('#reportRefresh');
  refresh.disabled=true;refresh.textContent='กำลังโหลด...';
  body.innerHTML='<tr><td colspan="8" class="loading">กำลังโหลดข้อมูลจาก Supabase...</td></tr>';
  try{
    let q=db.from('inspections').select(`
      id, inspected_at, overall_status, general_note, inspector_display_name,
      profiles(full_name),
      equipment(equipment_code,equipment_label,equipment_type,extinguisher_type,size_lbs,locations(location_code,location_name,floor,building,zone)),
      inspection_items(item_code,item_name,status,note),
      inspection_photos(storage_path,file_name,caption)
    `).order('inspected_at',{ascending:false});
    const from=$('#reportFrom').value,to=$('#reportTo').value,status=$('#reportStatus').value;
    if(from)q=q.gte('inspected_at',`${from}T00:00:00+07:00`);
    if(to)q=q.lte('inspected_at',`${to}T23:59:59.999+07:00`);
    if(status!=='all')q=q.eq('overall_status',status);
    const r=await q;
    if(r.error)throw r.error;
    const inspectorQ=$('#reportInspector').value.trim().toLowerCase();
    reportRows=(r.data||[]).filter(x=>!inspectorQ||inspectorName(x).toLowerCase().includes(inspectorQ));
    renderReports();
    msg('#reportMsg',`โหลดแล้ว ${reportRows.length.toLocaleString('th-TH')} รายการ`,true);
  }catch(err){
    console.error(err);reportRows=[];renderReports();
    msg('#reportMsg','โหลดรายงานไม่สำเร็จ: '+(err.message||'เกิดข้อผิดพลาด'));
  }finally{
    refresh.disabled=false;refresh.textContent='🔎 แสดงรายงาน';
  }
}

function renderReports(){
  const total=reportRows.length,good=reportRows.filter(x=>x.overall_status==='good').length,bad=reportRows.filter(x=>x.overall_status==='bad').length,photos=reportRows.reduce((n,x)=>n+(x.inspection_photos?.length||0),0);
  $('#statTotal').textContent=total.toLocaleString('th-TH');
  $('#statGood').textContent=good.toLocaleString('th-TH');
  $('#statBad').textContent=bad.toLocaleString('th-TH');
  $('#statPhotos').textContent=photos.toLocaleString('th-TH');
  $('#reportBody').innerHTML=reportRows.map(x=>{
    const eq=x.equipment||{},issues=badItems(x);
    const eqType=kindLabel[eq.equipment_type]||eq.equipment_type||'—';
    const ext=eq.equipment_type==='extinguisher'?(extLabel[eq.extinguisher_type]||eq.extinguisher_type||'') : '';
    return `<tr><td class="nowrap">${esc(displayDate(x.inspected_at))}</td><td>${esc(locationText(x))}</td><td><b>${esc(eq.equipment_code||'—')}</b><br><small>${esc([eqType,ext,eq.size_lbs?eq.size_lbs+' lbs':''].filter(Boolean).join(' • '))}</small></td><td>${esc(inspectorName(x))}</td><td><span class="badge ${x.overall_status==='bad'?'bad':''}">${x.overall_status==='bad'?'ชำรุด':'ปกติ'}</span></td><td>${issues.length?`<span class="bad-list">${issues.map(esc).join('<br>')}</span>`:'—'}</td><td>${esc(x.general_note||'—')}</td><td>${(x.inspection_photos?.length||0).toLocaleString('th-TH')} รูป</td></tr>`;
  }).join('')||'<tr><td colspan="8" class="loading">ไม่พบข้อมูลตามตัวกรอง</td></tr>';
}

function setSheetWidths(ws,widths){ws['!cols']=widths.map(w=>({wch:w}))}

async function signedPhotoMap(rows){
  const paths=[...new Set(rows.flatMap(x=>(x.inspection_photos||[]).map(p=>p.storage_path).filter(Boolean)))];
  const map={};
  if(!paths.length)return map;
  const chunkSize=100;
  for(let i=0;i<paths.length;i+=chunkSize){
    const chunk=paths.slice(i,i+chunkSize);
    const r=await db.storage.from('inspection-photos').createSignedUrls(chunk,7*24*60*60);
    if(r.error)throw r.error;
    (r.data||[]).forEach((item,index)=>{
      const path=item.path||chunk[index];
      map[path]=item.signedUrl||item.signedURL||'';
    });
  }
  return map;
}

async function exportReports(){
  if(!reportRows.length){msg('#reportMsg','ไม่มีข้อมูลสำหรับ Export กรุณากด “แสดงรายงาน” ก่อน');return}
  if(!window.XLSX){msg('#reportMsg','โหลดระบบสร้าง Excel ไม่สำเร็จ กรุณารีเฟรชหน้าแล้วลองใหม่');return}
  const btn=$('#reportExport');btn.disabled=true;btn.textContent='กำลังสร้าง Excel...';
  try{
    const photoLinks=await signedPhotoMap(reportRows);
    const summary=reportRows.map(x=>{
      const eq=x.equipment||{},loc=eq.locations||{},issues=badItems(x),photos=x.inspection_photos||[];
      return {
        'วัน/เวลา':reportDate(x.inspected_at),
        'รหัสจุดติดตั้ง':loc.location_code||'',
        'จุดติดตั้ง':loc.location_name||'',
        'ชั้น':loc.floor||'',
        'อาคาร':loc.building||'',
        'โซน':loc.zone||'',
        'รหัสอุปกรณ์':eq.equipment_code||'',
        'ประเภทอุปกรณ์':kindLabel[eq.equipment_type]||eq.equipment_type||'',
        'ประเภทถัง':extLabel[eq.extinguisher_type]||eq.extinguisher_type||'',
        'ขนาด (lbs)':eq.size_lbs??'',
        'ผู้ตรวจ':inspectorName(x),
        'ผลการตรวจ':x.overall_status==='bad'?'ชำรุด':'ปกติ',
        'รายการชำรุด':issues.join(', '),
        'หมายเหตุ':x.general_note||'',
        'จำนวนรูป':photos.length,
        'ลิงก์รูปแรก':photos[0]?.storage_path?photoLinks[photos[0].storage_path]||'':''
      };
    });
    const items=[];
    const photoRows=[];
    for(const x of reportRows){
      const eq=x.equipment||{},loc=eq.locations||{};
      for(const item of x.inspection_items||[]){
        items.push({
          'วัน/เวลา':reportDate(x.inspected_at),'รหัสจุดติดตั้ง':loc.location_code||'','จุดติดตั้ง':loc.location_name||'','ชั้น':loc.floor||'','รหัสอุปกรณ์':eq.equipment_code||'','ผู้ตรวจ':inspectorName(x),'หัวข้อตรวจ':item.item_name||'','ผล':item.status==='bad'?'ชำรุด':'ปกติ','หมายเหตุ':item.note||''
        });
      }
      for(const p of x.inspection_photos||[]){
        photoRows.push({
          'วัน/เวลา':reportDate(x.inspected_at),'รหัสจุดติดตั้ง':loc.location_code||'','จุดติดตั้ง':loc.location_name||'','ชั้น':loc.floor||'','รหัสอุปกรณ์':eq.equipment_code||'','ผู้ตรวจ':inspectorName(x),'ชื่อไฟล์':p.file_name||'','คำอธิบาย':p.caption||'','Storage Path':p.storage_path||'','ลิงก์รูปภาพ (7 วัน)':photoLinks[p.storage_path]||''
        });
      }
    }

    const wb=XLSX.utils.book_new();
    const wsSummary=XLSX.utils.json_to_sheet(summary);
    setSheetWidths(wsSummary,[18,16,30,12,22,18,18,18,16,12,16,14,38,30,12,55]);
    summary.forEach((row,i)=>{const cell=wsSummary[`P${i+2}`];if(cell?.v)cell.l={Target:cell.v,Tooltip:'เปิดรูปภาพ'};});
    XLSX.utils.book_append_sheet(wb,wsSummary,'ผลตรวจ');

    const wsItems=XLSX.utils.json_to_sheet(items.length?items:[{'วัน/เวลา':'ไม่มีข้อมูล'}]);
    setSheetWidths(wsItems,[18,16,30,12,18,16,32,12,30]);
    XLSX.utils.book_append_sheet(wb,wsItems,'หัวข้อตรวจ');

    const wsPhotos=XLSX.utils.json_to_sheet(photoRows.length?photoRows:[{'วัน/เวลา':'ไม่มีรูปภาพ'}]);
    setSheetWidths(wsPhotos,[18,16,30,12,18,16,28,28,55,60]);
    photoRows.forEach((row,i)=>{const cell=wsPhotos[`J${i+2}`];if(cell?.v)cell.l={Target:cell.v,Tooltip:'เปิดรูปภาพ'};});
    XLSX.utils.book_append_sheet(wb,wsPhotos,'รูปภาพ');

    const from=$('#reportFrom').value||'all',to=$('#reportTo').value||'all';
    XLSX.writeFile(wb,`FireSafety_Inspection_${from}_to_${to}.xlsx`,{compression:true});
    msg('#reportMsg','สร้างไฟล์ Excel เรียบร้อยแล้ว',true);
  }catch(err){
    console.error(err);msg('#reportMsg','สร้าง Excel ไม่สำเร็จ: '+(err.message||'เกิดข้อผิดพลาด'));
  }finally{
    btn.disabled=false;btn.textContent='📥 ดาวน์โหลด Excel';
  }
}

$('#locSearch').oninput=renderLocations;
$('#eqSearch').oninput=renderEquipment;
$('#eqKind').onchange=renderEquipment;
$('#reportRefresh').onclick=loadReports;
$('#reportExport').onclick=exportReports;
$('#reportInspector').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();loadReports()}});

$('#eqType').onchange=()=>{
  const isExt=$('#eqType').value==='extinguisher';
  $('#eqExt').disabled=!isExt;$('#eqSize').disabled=!isExt;
  if(!isExt){$('#eqExt').value='';$('#eqSize').value=''}
};
$('#eqType').onchange();
boot();
