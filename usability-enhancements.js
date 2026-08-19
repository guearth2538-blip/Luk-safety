/* Fire Safety Inspection - usability enhancements */
(() => {
  const originalLoadDashboard = loadDashboard;
  loadDashboard = async function(filter='') {
    await originalLoadDashboard(filter);
    const chart = document.querySelector('#floorChart');
    if (!chart) return;
    [...chart.querySelectorAll('.bar-item')].forEach(item => {
      const n = Number(item.querySelector('b')?.textContent || 0);
      if (n <= 0) item.remove();
    });
    if (!chart.querySelector('.bar-item')) chart.innerHTML = '<div class="empty">ยังไม่พบอุปกรณ์ชำรุด</div>';
  };

  const inspectorInput = document.querySelector('#inspectorName');
  if (inspectorInput) {
    inspectorInput.readOnly = false;
    inspectorInput.setAttribute('list','inspectorOptions');
    inspectorInput.placeholder = 'เลือก/พิมพ์ชื่อผู้ตรวจ เช่น M1';
    const dl = document.createElement('datalist');
    dl.id = 'inspectorOptions';
    const codes = [...Array.from({length:6},(_,i)=>`M${i+1}`), ...Array.from({length:10},(_,i)=>`S${i+1}`)];
    dl.innerHTML = codes.map(x=>`<option value="${x}"></option>`).join('');
    document.body.appendChild(dl);
  }

  const originalSetDate = setDate;
  setDate = function() {
    const chosen = inspectorInput?.value || '';
    originalSetDate();
    if (inspectorInput) {
      inspectorInput.readOnly = false;
      inspectorInput.setAttribute('list','inspectorOptions');
      if (chosen) inspectorInput.value = chosen;
    }
  };

  renderEquipmentChoices = function() {
    const box = document.querySelector('#equipmentChoices');
    if (!box) return;
    if (!locationEquipment.length) {
      box.innerHTML = '<div class="picker-empty">เลือกจุดติดตั้งและชั้นก่อน เพื่อแสดงอุปกรณ์ทั้งหมดในจุดนี้</div>';
      const idInput = document.querySelector('#equipmentId'); if (idInput) idInput.value='';
      return;
    }
    let html = '<div class="picker-head"><b>อุปกรณ์ทั้งหมดในจุดติดตั้งนี้</b><small>เลือกตู้และ/หรือถังที่ต้องการตรวจ</small></div>';
    for (const type of ['cabinet','extinguisher']) {
      const list = locationEquipment.filter(e=>e.equipment_type===type);
      if (!list.length) continue;
      html += `<div class="group-title">${typeText[type]} (${list.length})</div>`;
      for (const e of list) {
        const label = e.equipment_label || typeText[type];
        const detail = type==='extinguisher'
          ? `${extLabel[e.extinguisher_type]||e.extinguisher_type||'ไม่ระบุ'}${e.size_lbs?' • '+e.size_lbs+' lbs':''}`
          : `Fire Hose Cabinet${e.extinguisher_type?' • ภายในมี '+(extLabel[e.extinguisher_type]||e.extinguisher_type):''}`;
        html += `<label class="equipment-choice"><input type="checkbox" name="masterEquipment" value="${e.id}" data-kind="${type}"><span class="choice-main"><b>${esc(e.equipment_code)}</b><small>${esc(label)} • ${esc(detail)}</small></span><span class="choice-badge">${type==='cabinet'?'ตู้':'ถัง'}</span></label>`;
      }
    }
    box.innerHTML = html;
    $$('input[name="masterEquipment"]').forEach(cb => cb.onchange = () => {
      const kind = cb.dataset.kind;
      if (cb.checked) {
        $$('input[name="masterEquipment"][data-kind="'+kind+'"]').filter(x=>x!==cb).forEach(x=>x.checked=false);
        const typeCheck = $$('input[name="equipmentTypes"]').find(x=>x.value===kind);
        if (typeCheck) typeCheck.checked = true;
      }
      for (const type of ['cabinet','extinguisher']) {
        const typeCheck = $$('input[name="equipmentTypes"]').find(x=>x.value===type);
        if (typeCheck && !$$('input[name="masterEquipment"][data-kind="'+type+'"]:checked').length) typeCheck.checked = false;
      }
      renderEquipmentForms();
      const ids = selectedEquipmentIds();
      const idInput = document.querySelector('#equipmentId');
      if (idInput) idInput.value = ids.map(id=>locationEquipment.find(e=>e.id===id)?.equipment_code).filter(Boolean).join(' + ');
      updateComponentDefaults();
    });
  };

  createInspectionForEquipment = async function(eq,type) {
    const checks = collectChecks(type);
    const status = checks.some(x=>x.status==='bad')?'bad':'good';
    const note = document.querySelector(`[data-note="${type}"]`)?.value || '';
    const chosenInspector = (document.querySelector('#inspectorName')?.value || currentProfile?.full_name || '').trim();
    const noteParts = [];
    if (chosenInspector) noteParts.push(`ผู้ตรวจหน้างาน: ${chosenInspector}`);
    if (note) noteParts.push(`${typeText[type]}: ${note}`);
    const ins = await db.from('inspections').insert({equipment_id:eq.id,inspector_id:currentUser.id,inspected_at:new Date().toISOString(),overall_status:status,general_note:noteParts.join('\n')||null}).select().single();
    if (ins.error) throw ins.error;
    for (const item of checks) {
      const ii = await db.from('inspection_items').insert({inspection_id:ins.data.id,item_code:`${type}-${item.name}`,item_name:`${typeText[type]}: ${item.name}`,status:item.status,note:item.name===checks[checks.length-1]?.name?note:null});
      if (ii.error) throw ii.error;
    }
    await uploadPhotos(ins.data.id);
    return ins.data.id;
  };

  const style = document.createElement('style');
  style.textContent = '#floorChart .empty{width:100%;padding:40px 12px;color:#6b7280;text-align:center}.equipment-choice small{line-height:1.45}';
  document.head.appendChild(style);
})();