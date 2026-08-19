-- FIRE SAFETY INSPECTION - IMPORT FROM uploaded workbook
-- Sheet: New Form
-- IMPORTANT: workbook row data yields 170 cabinet rows and 277 extinguisher rows (447 components).
-- Workbook summary states 169 cabinets / 287 extinguishers (456 components).
-- The 9-item discrepancy is NOT invented here; this script imports only identifiable rows/codes.

alter type public.extinguisher_type add value if not exists 'bf2000';

update public.locations set is_active=false, updated_at=now() where location_code in ('LOC-001','LOC-002','LOC-003');

-- The full generated import is stored in the downloadable SQL file supplied with this response.
-- Run the generated local file if you want the full 447-row import.

select 'Import script prepared from uploaded workbook' as result;