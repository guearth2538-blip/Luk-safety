-- Fire Safety Inspection demo/master data
-- Run once in Supabase SQL Editor.

insert into public.locations
  (location_code, location_name, floor, building, zone, description)
values
  ('LOC-001', 'โถงทางเดินทิศเหนือ', 'ชั้น 1', 'อาคารหลัก', 'โถงเหนือ', 'จุดตรวจตัวอย่าง 1'),
  ('LOC-002', 'หน้าห้องช่าง', 'ชั้น 2', 'อาคารหลัก', 'ห้องช่าง', 'จุดตรวจตัวอย่าง 2'),
  ('LOC-003', 'ทางออกฉุกเฉิน', 'ชั้น 3', 'อาคารหลัก', 'ทางหนีไฟ', 'จุดตรวจตัวอย่าง 3')
on conflict (location_code) do update set
  location_name = excluded.location_name,
  floor = excluded.floor,
  building = excluded.building,
  zone = excluded.zone,
  description = excluded.description,
  is_active = true,
  updated_at = now();

select id, location_code, location_name, floor
from public.locations
where is_active = true
order by location_code;
