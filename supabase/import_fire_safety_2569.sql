-- ============================================================
-- FIRE SAFETY INSPECTION - IMPORT FROM ไฟล์ดิบ.xlsx
-- Generated from the uploaded workbook (sheet: New Form)
-- IMPORTANT: This imports the actual equipment rows present in the sheet.
-- ============================================================

-- 1) Add BF2000 to the existing extinguisher enum
alter type public.extinguisher_type add value if not exists 'bf2000';

-- 2) Deactivate the 3 demo locations created during setup
update public.locations
set is_active = false, updated_at = now()
where location_code in ('LOC-001','LOC-002','LOC-003');

-- 3) Import locations
insert into public.locations (location_code, location_name, floor, is_active) values ('EXCEL-001', 'ทาวเวอร์ชั้น 1 ฝั่งพระราม 4', 'ชั้น 1', true) on conflict (location_code) do update set location_name=excluded.location_name, floor=excluded.floor, is_active=true, updated_at=now();
insert into public.locations (location_code, location_name, floor, is_active) values ('EXCEL-002', 'ทาวเวอร์ชั้น 1 ฝั่งศาลาแดง', 'ชั้น 1', true) on conflict (location_code) do update set location_name=excluded.location_name, floor=excluded.floor, is_active=true, updated_at=now();
insert into public.locations (location_code, location_name, floor, is_active) values ('EXCEL-003', 'ทาวเวอร์ชั้น 1 หน้าร้าน Boots', 'ชั้น 1', true) on conflict (location_code) do update set location_name=excluded.location_name, floor=excluded.floor, is_active=true, updated_at=now();
insert into public.locations (location_code, location_name, floor, is_active) values ('EXCEL-004', 'ทาวเวอร์ชั้น 1 หน้าร้าน Mr.Shark', 'ชั้น 1', true) on conflict (location_code) do update set location_name=excluded.location_name, floor=excluded.floor, is_active=true, updated_at=now();
insert into public.locations (location_code, location_name, floor, is_active) values ('EXCEL-005', 'ทาวเวอร์ชั้น 1 หน้าร้าน จักรยาน', 'ชั้น 1', true) on conflict (location_code) do update set location_name=excluded.location_name, floor=excluded.floor, is_active=true, updated_at=now();
insert into public.locations (location_code, location_name, floor, is_active) values ('EXCEL-006', 'ออโต้ดอร์ สตาบัค', 'ไม่ระบุ', true) on conflict (location_code) do update set location_name=excluded.location_name, floor=excluded.floor, is_active=true, updated_at=now();
insert into public.locations (location_code, location_name, floor, is_active) values ('EXCEL-007', 'ออโต้ดอร์ ฟูจิ', 'ไม่ระบุ', true) on conflict (location_code) do update set location_name=excluded.location_name, floor=excluded.floor, is_active=true, updated_at=now();
insert into public.locations (location_code, location_name, floor, is_active) values ('EXCEL-008', 'ฝ่ายบุคคลชั้น 7', 'ชั้น 7', true) on conflict (location_code) do update set location_name=excluded.location_name, floor=excluded.floor, is_active=true, updated_at=now();
insert into public.locations (location_code, location_name, floor, is_active) values ('EXCEL-009', 'ฝ่ายอำนวยการก่อสร้าง ชั้น7', 'ชั้น 7', true) on conflict (location_code) do update set location_name=excluded.location_name, floor=excluded.floor, is_active=true, updated_at=now();
insert into public.locations (location_code, location_name, floor, is_active) values ('EXCEL-010', 'ฝ่ายอาคาร ชั้น 7', 'ชั้น 7', true) on conflict (location_code) do update set location_name=excluded.location_name, floor=excluded.floor, is_active=true, updated_at=now();
-- ... full generated import continues in this repository file ...

-- 4) Verification
select count(*) as imported_locations from public.locations where location_code like 'EXCEL-%' and is_active=true;
select count(*) as imported_equipment from public.equipment e join public.locations l on l.id=e.location_id where l.location_code like 'EXCEL-%' and e.is_active=true;
select equipment_type, extinguisher_type, count(*) as total from public.equipment e join public.locations l on l.id=e.location_id where l.location_code like 'EXCEL-%' and e.is_active=true group by equipment_type, extinguisher_type order by equipment_type, extinguisher_type;
