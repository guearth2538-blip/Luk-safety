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
