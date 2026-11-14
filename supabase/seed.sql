-- ============================================================================
--  AP3 Midterm Project - Agriculture Information System
--  Demo / seed data for Supabase PostgreSQL
--
--  Run this AFTER supabase/schema.sql.
--  It is safe to run more than once: existing rows are left untouched.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- Lookup / reference values
-- ----------------------------------------------------------------------------
insert into public.sex (sex_id, sex_description) values
  (1, 'Male'),
  (2, 'Female')
on conflict (sex_id) do nothing;

insert into public.irrigation_type (irrigation_id, irrigation_description) values
  (1, 'Rainfed'),
  (2, 'Irrigated (NIA)'),
  (3, 'Drip Irrigation'),
  (4, 'Sprinkler'),
  (5, 'Shallow Tube Well')
on conflict (irrigation_id) do nothing;

insert into public.crop_category (category_id, category_description) values
  (1, 'Cereal'),
  (2, 'Vegetable'),
  (3, 'Fruit'),
  (4, 'Root Crop'),
  (5, 'Legume'),
  (6, 'Industrial Crop')
on conflict (category_id) do nothing;

insert into public.crop_unit (unit_id, unit_description, unit_symbol) values
  (1, 'Kilogram', 'kg'),
  (2, 'Metric Ton', 't'),
  (3, 'Sack (50 kg)', 'sack'),
  (4, 'Piece', 'pc'),
  (5, 'Bunch', 'bunch')
on conflict (unit_id) do nothing;

insert into public.planting_status (status_id, status_description) values
  (1, 'Planned'),
  (2, 'Growing'),
  (3, 'Harvested'),
  (4, 'Failed'),
  (5, 'Abandoned')
on conflict (status_id) do nothing;

insert into public.quality_grade (grade_id, grade_description) values
  (1, 'Grade A'),
  (2, 'Grade B'),
  (3, 'Grade C'),
  (4, 'Reject')
on conflict (grade_id) do nothing;

insert into public.harvest_remark (remark_id, remark_description) values
  (1, 'Good Harvest'),
  (2, 'Acceptable Quality'),
  (3, 'Low Yield'),
  (4, 'Poor Quality'),
  (5, 'Damaged Harvest')
on conflict (remark_id) do nothing;

-- ----------------------------------------------------------------------------
-- Farmers
-- ----------------------------------------------------------------------------
insert into public.farmer (farmer_id, first_name, last_name, sex_id, birth_date, contact_no, address) values
  (1,  'Juan',    'Dela Cruz',   1, '1975-04-12', '09171234567', 'Brgy. Talamban, Cebu City'),
  (2,  'Maria',   'Santos',      2, '1982-09-03', '09181234567', 'Brgy. Pit-os, Cebu City'),
  (3,  'Pedro',   'Reyes',       1, '1968-01-25', '09201234567', 'Brgy. Poblacion, Minglanilla'),
  (4,  'Ana',     'Villanueva',  2, '1990-06-18', '09211234567', 'Brgy. San Roque, Talisay City'),
  (5,  'Jose',    'Bacalso',     1, '1972-11-30', '09221234567', 'Brgy. Basak, Lapu-Lapu City'),
  (6,  'Rosa',    'Abellana',    2, '1985-03-08', '09231234567', 'Brgy. Labangon, Cebu City'),
  (7,  'Carlos',  'Gantuangco',  1, '1979-07-22', '09241234567', 'Brgy. Guadalupe, Cebu City'),
  (8,  'Elena',   'Tabasa',      2, '1993-12-05', '09251234567', 'Brgy. Tunghaan, Minglanilla'),
  (9,  'Ramon',   'Alcantara',   1, '1965-05-14', '09261234567', 'Brgy. Mactan, Lapu-Lapu City'),
  (10, 'Fe',      'Gerona',      2, '1988-08-27', '09271234567', 'Brgy. Dumlog, Talisay City')
on conflict (farmer_id) do nothing;

-- ----------------------------------------------------------------------------
-- Farms
-- ----------------------------------------------------------------------------
insert into public.farm (farm_id, farmer_id, farm_name, location, area_hectares, irrigation_id) values
  (1,  1,  'Dela Cruz Rice Field',      'Brgy. Talamban, Cebu City',        1.50, 2),
  (2,  2,  'Santos Vegetable Plot',     'Brgy. Pit-os, Cebu City',          0.80, 3),
  (3,  3,  'Reyes Corn Land',           'Brgy. Poblacion, Minglanilla',     2.00, 1),
  (4,  4,  'Villanueva Garden',         'Brgy. San Roque, Talisay City',    0.60, 4),
  (5,  5,  'Bacalso Mango Orchard',     'Brgy. Basak, Lapu-Lapu City',      3.00, 1),
  (6,  6,  'Abellana Upland Farm',      'Brgy. Labangon, Cebu City',        1.20, 5),
  (7,  7,  'Gantuangco Legume Farm',    'Brgy. Guadalupe, Cebu City',       0.90, 1),
  (8,  8,  'Tabasa Rice Farm',          'Brgy. Tunghaan, Minglanilla',      2.50, 2),
  (9,  9,  'Alcantara Sugarcane Farm',  'Brgy. Mactan, Lapu-Lapu City',     4.00, 2),
  (10, 10, 'Gerona Corn Field',         'Brgy. Dumlog, Talisay City',       1.80, 5),
  (11, 1,  'Dela Cruz Second Field',    'Brgy. Talamban, Cebu City',        2.00, 2),
  (12, 8,  'Tabasa Hillside Plot',      'Brgy. Tunghaan, Minglanilla',      0.80, 1)
on conflict (farm_id) do nothing;

-- ----------------------------------------------------------------------------
-- Crops
-- ----------------------------------------------------------------------------
insert into public.crop (crop_id, crop_name, variety, category_id, unit_id, selling_price) values
  (1, 'Rice',           'NSIC Rc 222',  1, 1,   22.50),
  (2, 'Corn',           'Pioneer 30T80',1, 1,   18.00),
  (3, 'Eggplant',       'Morena',       2, 1,   45.00),
  (4, 'Tomato',         'Diamante',     2, 1,   55.00),
  (5, 'Mango',          'Carabao',      3, 1,   90.00),
  (6, 'Sweet Potato',   'Tinipay',      4, 1,   35.00),
  (7, 'Mongo',          'Pagasa 7',     5, 1,   75.00),
  (8, 'Sugarcane',      'VMC 86-550',   6, 2, 2500.00)
on conflict (crop_id) do nothing;

-- ----------------------------------------------------------------------------
-- Planting records
-- ----------------------------------------------------------------------------
insert into public.planting (planting_id, farm_id, crop_id, planting_date, expected_harvest_date, area_planted, status_id, remarks) values
  (1,  1,  1, '2025-06-15', '2025-10-15', 1.50, 3, 'First cropping season; sufficient rainfall.'),
  (2,  2,  4, '2025-07-01', '2025-10-01', 0.80, 3, 'Trellised tomato with drip irrigation.'),
  (3,  3,  2, '2025-08-10', '2025-11-10', 2.00, 3, 'Rainfed corn, hybrid seeds.'),
  (4,  4,  3, '2025-09-05', '2025-12-05', 0.60, 3, 'Backyard vegetable garden.'),
  (5,  5,  5, '2025-05-20', '2025-09-20', 3.00, 3, 'Mature mango orchard, seasonal fruiting.'),
  (6,  6,  6, '2025-10-01', '2026-01-01', 1.20, 3, 'Upland root crop, rainfed.'),
  (7,  7,  7, '2025-11-15', '2026-02-15', 0.90, 3, 'Legume rotation after corn.'),
  (8,  8,  1, '2026-01-10', '2026-05-10', 2.50, 3, 'Irrigated lowland rice.'),
  (9,  9,  8, '2026-02-01', '2026-11-01', 4.00, 3, 'Sugarcane plant crop.'),
  (10, 10, 2, '2026-05-15', '2026-08-15', 1.80, 3, 'Second corn cropping.'),
  (11, 1,  1, '2026-06-20', '2026-10-20', 1.50, 3, 'Wet season rice.'),
  (12, 2,  4, '2026-07-05', '2026-10-05', 0.70, 3, 'Drip irrigated tomato.'),
  (13, 3,  3, '2026-08-15', '2026-11-15', 0.90, 2, 'Vegetable intercropping with corn.'),
  (14, 4,  2, '2026-09-01', '2026-12-01', 1.10, 2, 'Sprinkler irrigated corn.'),
  (15, 11, 1, '2026-10-10', '2027-02-10', 2.00, 2, 'Newly transplanted rice.'),
  (16, 12, 6, '2026-11-05', '2027-02-05', 0.80, 1, 'Land preparation ongoing.'),
  (17, 5,  7, '2026-09-20', '2026-12-20', 0.50, 2, 'Mongo planted between mango trees.'),
  (18, 6,  1, '2026-04-10', '2026-08-10', 1.30, 4, 'Damaged by typhoon; minimal harvest.')
on conflict (planting_id) do nothing;

-- ----------------------------------------------------------------------------
-- Harvest records (with multiple harvests for some plantings)
-- ----------------------------------------------------------------------------
insert into public.harvest (harvest_id, planting_id, harvest_date, quantity_harvested, grade_id, remark_id) values
  (1,  1,  '2025-10-12', 1800.00, 1, 1),
  (2,  1,  '2025-10-14',  650.00, 2, 2),
  (3,  2,  '2025-09-28',  900.00, 1, 1),
  (4,  3,  '2025-11-05', 2400.00, 1, 1),
  (5,  3,  '2025-11-07',  600.00, 3, 3),
  (6,  4,  '2025-12-01',  750.00, 2, 1),
  (7,  4,  '2025-12-10',  300.00, 3, 3),
  (8,  5,  '2025-09-18', 3200.00, 1, 1),
  (9,  5,  '2025-09-25', 1200.00, 2, 3),
  (10, 6,  '2026-01-03', 1500.00, 1, 1),
  (11, 7,  '2026-02-12',  700.00, 2, 2),
  (12, 8,  '2026-05-05', 3100.00, 1, 1),
  (13, 8,  '2026-05-08',  800.00, 3, 3),
  (14, 9,  '2026-10-25',   45.00, 1, 1),
  (15, 10, '2026-08-12', 1900.00, 1, 1),
  (16, 11, '2026-10-18', 2100.00, 1, 1),
  (17, 12, '2026-10-02',  640.00, 2, 1),
  (18, 18, '2026-08-05',  150.00, 4, 5)
on conflict (harvest_id) do nothing;

-- ----------------------------------------------------------------------------
-- Keep the identity sequences ahead of the manually inserted IDs.
-- ----------------------------------------------------------------------------
select setval(pg_get_serial_sequence('public.farmer',   'farmer_id'),   coalesce((select max(farmer_id)   from public.farmer),   1));
select setval(pg_get_serial_sequence('public.farm',     'farm_id'),     coalesce((select max(farm_id)     from public.farm),     1));
select setval(pg_get_serial_sequence('public.crop',     'crop_id'),     coalesce((select max(crop_id)     from public.crop),     1));
select setval(pg_get_serial_sequence('public.planting', 'planting_id'), coalesce((select max(planting_id) from public.planting), 1));
select setval(pg_get_serial_sequence('public.harvest',  'harvest_id'),  coalesce((select max(harvest_id)  from public.harvest),  1));

notify pgrst, 'reload schema';

commit;
