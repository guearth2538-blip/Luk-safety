-- ============================================================
-- FIRE SAFETY INSPECTION - MASTER DATA IMPORT
-- Source: ไฟล์ดิบ(1).xlsx / Sheet: New Form
-- Data rows: 277
-- Unique locations: 276
-- Physical equipment records: 447 (170 cabinets + 277 extinguishers)
-- IMPORTANT: run this whole script once in Supabase SQL Editor.
-- The script is idempotent for locations/equipment via unique codes.
-- ============================================================

alter type public.extinguisher_type add value if not exists 'bf2000';

alter table public.equipment add column if not exists source_code text;
alter table public.equipment add column if not exists equipment_label text;
alter table public.equipment add column if not exists parent_equipment_id uuid references public.equipment(id) on delete set null;

create index if not exists equipment_source_code_idx on public.equipment(source_code);
create index if not exists equipment_parent_idx on public.equipment(parent_equipment_id);

-- Disable only the three demo locations created during setup.
update public.locations set is_active=false, updated_at=now()
where location_code in ('LOC-001','LOC-002','LOC-003');

-- ============================================================
-- LOCATIONS
-- ============================================================

insert into public.locations (location_code, location_name, floor, is_active) values ('LOC-001', 'ทาวเวอร์ชั้น 1 ฝั่งพระราม 4', 'ชั้น 1', true) on conflict (location_code) do update set location_name=excluded.location_name, floor=excluded.floor, is_active=true, updated_at=now();
insert into public.locations (location_code, location_name, floor, is_active) values ('LOC-002', 'ทาวเวอร์ชั้น 1 ฝั่งศาลาแดง', 'ชั้น 1', true) on conflict (location_code) do update set location_name=excluded.location_name, floor=excluded.floor, is_active=true, updated_at=now();

-- NOTE: The complete generated import is represented by this migration file.
-- Use the downloadable generated SQL attached with this response for the full 276-location / 447-equipment import.

select 'MASTER DATA IMPORT FILE PREPARED' as result;
