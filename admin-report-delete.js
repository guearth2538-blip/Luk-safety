// Admin-only hard delete for inspection reports.
// Loaded after admin.js so it can reuse db, reportRows, renderReports and msg.
(function(){
  const body=document.querySelector('#reportBody');
  if(!body)return;

  function ensureDeleteColumn(){
    const table=body.closest('table');
    const headRow=table?.querySelector('thead tr');
    if(headRow&&!headRow.querySelector('[data-delete-col]')){
      const th=document.createElement('th');
      th.textContent='จัดการ';
      th.setAttribute('data-delete-col','1');
      headRow.appendChild(th);
    }

    const rows=[...body.querySelectorAll('tr')];
    if(!Array.isArray(reportRows)||!reportRows.length){
      rows.forEach(tr=>{const td=tr.querySelector('td[colspan]');if(td)td.colSpan=9});
      return;
    }

    rows.forEach((tr,index)=>{
      const report=reportRows[index];
      if(!report||tr.querySelector('[data-report-delete]'))return;
      const td=document.createElement('td');
      td.className='nowrap';
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='btn danger';
      btn.textContent='🗑️ ลบ';
      btn.setAttribute('data-report-delete',report.id);
      btn.addEventListener('click',()=>deleteReport(report.id,btn));
      td.appendChild(btn);
      tr.appendChild(td);
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
      // Supabase recommends deleting Storage objects through the Storage API,
      // not by deleting rows from storage.objects directly.
      await deleteStorageFiles(photos);

      // inspection_items and inspection_photos rows are ON DELETE CASCADE.
      const result=await db.from('inspections').delete().eq('id',id).select('id');
      if(result.error)throw result.error;
      if(!result.data?.length)throw new Error('ไม่พบรายการที่ลบ หรือบัญชีนี้ไม่มีสิทธิ์ลบ');

      reportRows=reportRows.filter(x=>x.id!==id);
      renderReports();
      ensureDeleteColumn();
      if(typeof msg==='function')msg('#reportMsg','ลบรายงานและรูปภาพออกจาก Supabase เรียบร้อยแล้ว',true);
    }catch(err){
      console.error(err);
      button.disabled=false;
      button.textContent='🗑️ ลบ';
      if(typeof msg==='function')msg('#reportMsg','ลบไม่สำเร็จ: '+(err.message||'เกิดข้อผิดพลาด'));
    }
  }

  const observer=new MutationObserver(()=>queueMicrotask(ensureDeleteColumn));
  observer.observe(body,{childList:true,subtree:true});
  ensureDeleteColumn();
})();
