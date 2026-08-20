// Admin-only hard delete for inspection reports.
// Loaded after admin.js so it can reuse db, reportRows, renderReports and msg.
(function(){
  const body=document.querySelector('#reportBody');
  if(!body)return;

  function ensureDeleteActions(){
    const table=body.closest('table');
    const headRow=table?.querySelector('thead tr');
    if(headRow){
      const headers=[...headRow.querySelectorAll('th')];
      if(headers.length){
        headers[headers.length-1].textContent='รูป / จัดการ';
      }
      const extra=headRow.querySelector('[data-delete-col]');
      if(extra)extra.remove();
    }

    const rows=[...body.querySelectorAll('tr')];
    if(!Array.isArray(reportRows)||!reportRows.length){
      rows.forEach(tr=>{const td=tr.querySelector('td[colspan]');if(td)td.colSpan=8});
      return;
    }

    rows.forEach((tr,index)=>{
      const report=reportRows[index];
      if(!report)return;
      const old=tr.querySelector('td [data-report-delete]')?.closest('td');
      if(old&&old!==tr.lastElementChild)old.remove();

      const photoCell=tr.lastElementChild;
      if(!photoCell||photoCell.querySelector('[data-report-delete]'))return;
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='btn danger';
      btn.style.display='block';
      btn.style.marginTop='7px';
      btn.style.padding='6px 9px';
      btn.style.whiteSpace='nowrap';
      btn.textContent='🗑️ ลบ';
      btn.setAttribute('data-report-delete',report.id);
      btn.addEventListener('click',()=>deleteReport(report.id,btn));
      photoCell.appendChild(btn);
    });
  }

  async function deleteStorageFiles(paths){
    const unique=[...new Set(paths.filter(Boolean))];
    for(let i=0;i<unique.length;i+=1000){
      const result=await db.storage.from('inspection-photos').remove(unique.slice(i,i+1000));
      if(result.error)throw result.error;
    }
  }

  async function deleteReport(id,button){
    const report=reportRows.find(x=>x.id===id);
    if(!report)return;
    const eq=report.equipment?.equipment_code||'ไม่ระบุรหัส';
    const where=locationText(report);
    const when=displayDate(report.inspected_at);
    const photos=(report.inspection_photos||[]).map(x=>x.storage_path).filter(Boolean);

    const ok=confirm(`ต้องการลบรายงานนี้ถาวรหรือไม่?\n\nอุปกรณ์: ${eq}\nจุดติดตั้ง: ${where}\nวันที่ตรวจ: ${when}\nผู้ตรวจ: ${inspectorName(report)}\nรูปภาพ: ${photos.length} รูป\n\nระบบจะลบข้อมูลรายงาน รายการตรวจย่อย และไฟล์รูปออกจาก Supabase ด้วย`);
    if(!ok)return;
    const typed=prompt('เพื่อป้องกันการลบข้อมูลจริงโดยไม่ตั้งใจ กรุณาพิมพ์คำว่า "ลบ" เพื่อยืนยัน');
    if((typed||'').trim()!=='ลบ'){
      if(typeof msg==='function')msg('#reportMsg','ยกเลิกการลบ: คำยืนยันไม่ถูกต้อง');
      return;
    }

    button.disabled=true;
    button.textContent='กำลังลบ...';
    try{
      await deleteStorageFiles(photos);
      const result=await db.from('inspections').delete().eq('id',id).select('id');
      if(result.error)throw result.error;
      if(!result.data?.length)throw new Error('ไม่พบรายการที่ลบ หรือบัญชีนี้ไม่มีสิทธิ์ลบ');

      reportRows=reportRows.filter(x=>x.id!==id);
      renderReports();
      ensureDeleteActions();
      if(typeof msg==='function')msg('#reportMsg','ลบรายงานและรูปภาพออกจาก Supabase เรียบร้อยแล้ว',true);
    }catch(err){
      console.error(err);
      button.disabled=false;
      button.textContent='🗑️ ลบ';
      if(typeof msg==='function')msg('#reportMsg','ลบไม่สำเร็จ: '+(err.message||'เกิดข้อผิดพลาด'));
    }
  }

  const observer=new MutationObserver(()=>queueMicrotask(ensureDeleteActions));
  observer.observe(body,{childList:true,subtree:true});
  ensureDeleteActions();
})();

// Keep the whole system on one entry URL: Admin logout returns to the main login.
(function(){
  const top=document.querySelector('.top');
  const who=document.querySelector('#who');
  if(!top||!who||document.querySelector('#adminLogout'))return;
  const box=document.createElement('div');
  box.style.display='flex';
  box.style.alignItems='center';
  box.style.gap='10px';
  who.parentNode.insertBefore(box,who);
  box.appendChild(who);
  const btn=document.createElement('button');
  btn.id='adminLogout';
  btn.type='button';
  btn.textContent='ออกจากระบบ';
  btn.style.border='1px solid #ffffff66';
  btn.style.background='#fff';
  btn.style.color='#991b1b';
  btn.style.borderRadius='9px';
  btn.style.padding='8px 11px';
  btn.style.fontWeight='800';
  btn.style.cursor='pointer';
  btn.onclick=async()=>{
    btn.disabled=true;
    btn.textContent='กำลังออก...';
    try{await db.auth.signOut()}finally{location.replace('./')}
  };
  box.appendChild(btn);
})();

// Secure user management. Privileged Auth operations happen in the admin-users Edge Function.
(function(){
  const tabs=document.querySelector('.tabs');
  const panel=document.querySelector('#panel');
  if(!tabs||!panel||document.querySelector('#usersTab'))return;

  let users=[];
  let loaded=false;
  const roleText={admin:'Admin',supervisor:'หัวหน้างาน',fireman:'Fireman'};
  const escUser=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  const tab=document.createElement('button');
  tab.type='button';
  tab.dataset.tab='users';
  tab.textContent='👥 จัดการผู้ใช้งาน';
  tabs.appendChild(tab);

  const section=document.createElement('section');
  section.id='usersTab';
  section.className='tab hidden';
  section.innerHTML=`
    <div class="card">
      <h2>👥 จัดการผู้ใช้งาน</h2>
      <p class="report-note">สร้างบัญชี เปิด/ปิดใช้งาน และกำหนดสิทธิ์จากหน้านี้ได้โดยตรง • งาน Auth ฝั่งผู้ดูแลทำผ่าน Supabase Edge Function</p>
      <form id="userCreateForm">
        <div class="grid">
          <div class="field"><label>ชื่อผู้ใช้งาน *</label><input id="newUserName" required placeholder="เช่น สมชาย ใจดี"></div>
          <div class="field"><label>Email *</label><input id="newUserEmail" type="email" required placeholder="name@example.com"></div>
          <div class="field"><label>รหัสผ่านเริ่มต้น *</label><input id="newUserPassword" type="password" minlength="8" required placeholder="อย่างน้อย 8 ตัวอักษร"></div>
          <div class="field"><label>สิทธิ์ *</label><select id="newUserRole"><option value="fireman">Fireman</option><option value="supervisor">หัวหน้างาน</option><option value="admin">Admin</option></select></div>
        </div>
        <div class="actions"><button class="btn primary" id="createUserBtn" type="submit">＋ สร้างบัญชี</button></div>
        <div id="userMsg" class="msg"></div>
      </form>
    </div>
    <div class="card">
      <div class="search"><input id="userSearch" placeholder="🔍 ค้นหาชื่อ / Email / Role"><button class="btn secondary" id="reloadUsers" type="button">↻ โหลดใหม่</button></div>
      <div class="table-wrap"><table class="table" style="min-width:1050px"><thead><tr><th>ชื่อ</th><th>Email</th><th>สิทธิ์</th><th>สถานะ</th><th>เข้าใช้ล่าสุด</th><th>จัดการ</th></tr></thead><tbody id="userBody"><tr><td colspan="6" class="loading">กดเมนู “จัดการผู้ใช้งาน” เพื่อโหลดข้อมูล</td></tr></tbody></table></div>
    </div>`;
  panel.appendChild(section);

  function userMsg(text,ok=false){
    const el=document.querySelector('#userMsg');
    if(!el)return;
    el.textContent=text;
    el.style.color=ok?'#166534':'#b91c1c';
  }

  async function callAdminUsers(payload){
    const r=await db.functions.invoke('admin-users',{body:payload});
    if(r.error)throw r.error;
    if(r.data?.error)throw new Error(r.data.error);
    return r.data||{};
  }

  function dateText(v){
    if(!v)return '—';
    try{return new Date(v).toLocaleString('th-TH',{dateStyle:'medium',timeStyle:'short'})}catch(_){return '—'}
  }

  function filteredUsers(){
    const q=(document.querySelector('#userSearch')?.value||'').trim().toLowerCase();
    if(!q)return users;
    return users.filter(u=>[u.full_name,u.email,u.role,roleText[u.role]].join(' ').toLowerCase().includes(q));
  }

  function renderUsers(){
    const body=document.querySelector('#userBody');
    if(!body)return;
    const list=filteredUsers();
    body.innerHTML=list.map(u=>{
      const self=u.is_current;
      return `<tr data-user-row="${u.id}">
        <td><input data-user-name value="${escUser(u.full_name)}" style="min-width:180px;padding:9px;border:1px solid #d1d5db;border-radius:8px"><br>${self?'<small style="color:#991b1b;font-weight:700">บัญชีที่กำลังใช้งาน</small>':''}</td>
        <td>${escUser(u.email||'—')}</td>
        <td><select data-user-role ${self?'disabled':''} style="padding:9px;border:1px solid #d1d5db;border-radius:8px"><option value="fireman" ${u.role==='fireman'?'selected':''}>Fireman</option><option value="supervisor" ${u.role==='supervisor'?'selected':''}>หัวหน้างาน</option><option value="admin" ${u.role==='admin'?'selected':''}>Admin</option></select></td>
        <td><label style="display:flex;align-items:center;gap:7px;white-space:nowrap"><input data-user-active type="checkbox" ${u.is_active?'checked':''} ${self?'disabled':''}> ${u.is_active?'<span class="badge">ใช้งาน</span>':'<span class="badge off">ปิดใช้งาน</span>'}</label></td>
        <td>${escUser(dateText(u.last_sign_in_at))}</td>
        <td><button class="btn primary" type="button" data-save-user="${u.id}">💾 บันทึก</button></td>
      </tr>`;
    }).join('')||'<tr><td colspan="6" class="loading">ไม่พบผู้ใช้งาน</td></tr>';
    body.querySelectorAll('[data-save-user]').forEach(btn=>btn.onclick=()=>saveUser(btn.dataset.saveUser,btn));
    body.querySelectorAll('[data-user-active]').forEach(cb=>cb.onchange=()=>{
      const span=cb.parentElement?.querySelector('.badge');
      if(span){span.textContent=cb.checked?'ใช้งาน':'ปิดใช้งาน';span.classList.toggle('off',!cb.checked)}
    });
  }

  async function loadUsers(){
    const body=document.querySelector('#userBody');
    if(body)body.innerHTML='<tr><td colspan="6" class="loading">กำลังโหลดบัญชีผู้ใช้งาน...</td></tr>';
    try{
      const data=await callAdminUsers({action:'list'});
      users=Array.isArray(data.users)?data.users:[];
      loaded=true;
      renderUsers();
      userMsg(`โหลดผู้ใช้งานแล้ว ${users.length} บัญชี`,true);
    }catch(err){
      console.error(err);
      if(body)body.innerHTML='<tr><td colspan="6" class="loading">โหลดข้อมูลไม่สำเร็จ</td></tr>';
      userMsg('โหลดผู้ใช้งานไม่สำเร็จ: '+(err.message||'เกิดข้อผิดพลาด'));
    }
  }

  async function saveUser(id,btn){
    const row=document.querySelector(`[data-user-row="${CSS.escape(id)}"]`);
    const original=users.find(x=>x.id===id);
    if(!row||!original)return;
    const fullName=row.querySelector('[data-user-name]').value.trim();
    const role=row.querySelector('[data-user-role]').value;
    const isActive=row.querySelector('[data-user-active]').checked;
    if(!fullName){userMsg('กรุณาระบุชื่อผู้ใช้งาน');return}
    if(!confirm(`บันทึกการเปลี่ยนแปลงบัญชี ${original.email}?\n\nชื่อ: ${fullName}\nสิทธิ์: ${roleText[role]||role}\nสถานะ: ${isActive?'ใช้งาน':'ปิดใช้งาน'}`))return;
    btn.disabled=true;btn.textContent='กำลังบันทึก...';
    try{
      await callAdminUsers({action:'update',id,full_name:fullName,role,is_active:isActive});
      userMsg('บันทึกข้อมูลผู้ใช้งานเรียบร้อยแล้ว',true);
      await loadUsers();
    }catch(err){
      console.error(err);userMsg('บันทึกไม่สำเร็จ: '+(err.message||'เกิดข้อผิดพลาด'));
    }finally{btn.disabled=false;btn.textContent='💾 บันทึก'}
  }

  document.querySelector('#userCreateForm').onsubmit=async e=>{
    e.preventDefault();
    const btn=document.querySelector('#createUserBtn');
    const payload={
      action:'create',
      full_name:document.querySelector('#newUserName').value.trim(),
      email:document.querySelector('#newUserEmail').value.trim(),
      password:document.querySelector('#newUserPassword').value,
      role:document.querySelector('#newUserRole').value
    };
    if(!confirm(`สร้างบัญชีใหม่?\n\n${payload.full_name}\n${payload.email}\nสิทธิ์: ${roleText[payload.role]||payload.role}`))return;
    btn.disabled=true;btn.textContent='กำลังสร้าง...';
    try{
      await callAdminUsers(payload);
      e.target.reset();
      document.querySelector('#newUserRole').value='fireman';
      userMsg('สร้างบัญชีเรียบร้อยแล้ว สามารถใช้ Email/Password เข้าลิงก์หลักได้ทันที',true);
      await loadUsers();
    }catch(err){
      console.error(err);userMsg('สร้างบัญชีไม่สำเร็จ: '+(err.message||'เกิดข้อผิดพลาด'));
    }finally{btn.disabled=false;btn.textContent='＋ สร้างบัญชี'}
  };

  document.querySelector('#userSearch').oninput=renderUsers;
  document.querySelector('#reloadUsers').onclick=loadUsers;

  tab.onclick=async()=>{
    document.querySelectorAll('.tabs button').forEach(x=>x.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.tab').forEach(x=>x.classList.add('hidden'));
    section.classList.remove('hidden');
    if(!loaded)await loadUsers();
  };
})();
