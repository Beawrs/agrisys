-- ============================================================================
--  AP3 Midterm Project - Agriculture Information System
--  Seed data (taken from the project's sample data screenshots)
--
--  Run AFTER supabase/schema.sql.
--
--  RE-RUNNABLE: this script first EMPTIES the five main tables (farmer, farm,
--  crop, planting, harvest) and then reloads the sample data, so you always
--  end up with exactly the same records. Any records you added by hand in
--  those tables are removed. User accounts (profiles) are NOT touched.
--
--  Text values from the sample data (e.g. 'Loam', 'Rainfed', 'Grade A') are
--  stored in lookup tables, so the main tables hold their numeric IDs.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Clean reload: remove existing sample/test rows (children first is handled
-- by CASCADE) and restart the ID counters at 1.
-- ---------------------------------------------------------------------------
truncate table public.harvest, public.planting, public.crop, public.farm, public.farmer
  restart identity cascade;

-- ---------------------------------------------------------------------------
-- Lookup tables
-- ---------------------------------------------------------------------------
insert into public.irrigation_type (irrigation_id, irrigation_description) values
  (1, 'Rainfed'),
  (2, 'Irrigated'),
  (3, 'Drip Irrigation'),
  (4, 'Sprinkler')
on conflict (irrigation_id) do update set irrigation_description = excluded.irrigation_description;

insert into public.soil_type (soil_id, soil_description) values
  (1, 'Loam'),
  (2, 'Clay Loam'),
  (3, 'Sandy Loam'),
  (4, 'Clay')
on conflict (soil_id) do update set soil_description = excluded.soil_description;

insert into public.crop_category (category_id, category_description) values
  (1, 'Cereal'),
  (2, 'Vegetable'),
  (3, 'Fruit'),
  (4, 'Legume'),
  (5, 'Root Crop')
on conflict (category_id) do update set category_description = excluded.category_description;

insert into public.growing_season (season_id, season_description) values
  (1, 'Wet Season'),
  (2, 'Dry Season'),
  (3, 'Year Round')
on conflict (season_id) do update set season_description = excluded.season_description;

insert into public.planting_status (status_id, status_description) values
  (1, 'Planned'),
  (2, 'Growing'),
  (3, 'Harvested'),
  (4, 'Failed'),
  (5, 'Abandoned')
on conflict (status_id) do update set status_description = excluded.status_description;

insert into public.quality_grade (grade_id, grade_description) values
  (1, 'Grade A'),
  (2, 'Grade B'),
  (3, 'Grade C'),
  (4, 'Reject')
on conflict (grade_id) do update set grade_description = excluded.grade_description;

-- IDs 1-5 are the project's example list; 6 covers the sample data's
-- "High quality harvest".
insert into public.harvest_remark (remark_id, remark_description) values
  (1, 'Good Harvest'),
  (2, 'Acceptable Quality'),
  (3, 'Low Yield'),
  (4, 'Poor Quality'),
  (5, 'Damaged Harvest'),
  (6, 'High Quality Harvest')
on conflict (remark_id) do update set remark_description = excluded.remark_description;

-- ---------------------------------------------------------------------------
-- Crop
-- (id, name, variety, category_id, growing_period_days, season_id)
-- ---------------------------------------------------------------------------
insert into public.crop (crop_id, crop_name, variety, category_id, growing_period_days, season_id) values
  (1,  'Rice',         'NSIC Rc 222',   1, 115, 1),
  (2,  'Corn',         'Yellow Corn',   1, 100, 2),
  (3,  'Tomato',       'Diamante Max',  2,  90, 2),
  (4,  'Eggplant',     'Morena',        2, 100, 3),
  (5,  'Banana',       'Lakatan',       3, 300, 3),
  (6,  'Mango',        'Carabao',       3, 150, 2),
  (7,  'Peanut',       'BPI Pn 9',      4, 110, 2),
  (8,  'Cassava',      'Golden Yellow', 5, 240, 3),
  (9,  'Sweet Potato', 'NSIC Sp 30',    5, 120, 3),
  (10, 'Watermelon',   'Sweet 16',      3,  85, 2)
on conflict (crop_id) do nothing;

-- ---------------------------------------------------------------------------
-- Farmer
-- ---------------------------------------------------------------------------
insert into public.farmer (farmer_id, first_name, last_name, contact_number, address, date_registered) values
  (1,  'Juan',    'Dela Cruz',  '09171234567', 'Cebu City',           '2026-10-26'),
  (2,  'Maria',   'Santos',     '09181234567', 'Carcar City, Cebu',   '2026-10-26'),
  (3,  'Pedro',   'Reyes',      '09191234567', 'Danao City, Cebu',    '2026-10-26'),
  (4,  'Ana',     'Garcia',     '09201234567', 'Argao, Cebu',         '2026-10-26'),
  (5,  'Jose',    'Mendoza',    '09211234567', 'Bogo City, Cebu',     '2026-10-26'),
  (6,  'Ramon',   'Flores',     '09221234567', 'Toledo City, Cebu',   '2026-10-26'),
  (7,  'Elena',   'Cruz',       '09231234567', 'Naga City, Cebu',     '2026-10-26'),
  (8,  'Antonio', 'Lim',        '09241234567', 'Minglanilla, Cebu',   '2026-10-26'),
  (9,  'Rosa',    'Fernandez',  '09251234567', 'Liloan, Cebu',        '2026-10-26'),
  (10, 'Mario',   'Villanueva', '09261234567', 'Compostela, Cebu',    '2026-10-26'),
  (11, 'Teresa',  'Navarro',    '09271234567', 'Talisay City, Cebu',  '2026-10-26'),
  (12, 'Carlos',  'Ramos',      '09281234567', 'Consolacion, Cebu',   '2026-10-26'),
  (13, 'Liza',    'Torres',     '09291234567', 'Dalaguete, Cebu',     '2026-10-26'),
  (14, 'Roberto', 'Castillo',   '09301234567', 'Barili, Cebu',        '2026-10-26'),
  (15, 'Susan',   'Aquino',     '09311234567', 'Sibonga, Cebu',       '2026-10-26')
on conflict (farmer_id) do nothing;

-- ---------------------------------------------------------------------------
-- Farm
-- (id, farmer_id, name, location, hectares, soil_id, irrigation_id)
-- ---------------------------------------------------------------------------
insert into public.farm (farm_id, farmer_id, farm_name, location, area_hectares, soil_id, irrigation_id) values
  (1,  1,  'Dela Cruz Farm',              'Cebu City',          2.50, 1, 1),
  (2,  2,  'Santos Rice Farm',            'Carcar City, Cebu',  4.20, 2, 2),
  (3,  3,  'Reyes Agricultural Farm',     'Danao City, Cebu',   3.80, 3, 1),
  (4,  4,  'Garcia Vegetable Farm',       'Argao, Cebu',        1.75, 1, 3),
  (5,  5,  'Mendoza Farm',                'Bogo City, Cebu',    5.00, 4, 2),
  (6,  6,  'Flores Corn Farm',            'Toledo City, Cebu',  3.40, 3, 1),
  (7,  7,  'Cruz Family Farm',            'Naga City, Cebu',    2.80, 1, 2),
  (8,  8,  'Lim Agricultural Farm',       'Minglanilla, Cebu',  2.25, 2, 3),
  (9,  9,  'Fernandez Farm',              'Liloan, Cebu',       3.10, 3, 1),
  (10, 10, 'Villanueva Green Farm',       'Compostela, Cebu',   4.50, 1, 2),
  (11, 11, 'Navarro Rice Field',          'Talisay City, Cebu', 3.75, 4, 2),
  (12, 12, 'Ramos Farm',                  'Consolacion, Cebu',  2.60, 1, 1),
  (13, 13, 'Torres Vegetable Farm',       'Dalaguete, Cebu',    1.80, 3, 3),
  (14, 14, 'Castillo Agricultural Farm',  'Barili, Cebu',       5.50, 2, 2),
  (15, 15, 'Aquino Farm',                 'Sibonga, Cebu',      3.20, 1, 1)
on conflict (farm_id) do nothing;

-- ---------------------------------------------------------------------------
-- Planting (28 rows)
-- (id, farm_id, crop_id, planting_date, area_planted, seed_quantity,
--  expected_harvest_date, status_id)   status: 2 = Growing, 3 = Harvested
--
-- Rows 1-10: farm, crop, dates, area and status are copied from the sample
-- planting list. Their seed_quantity was NOT visible in any screenshot, so
-- the values marked "VERIFY" continue the repeating 10,15,...,45 pattern of
-- rows 11-28. Compare them with the real table and correct them if needed.
-- ---------------------------------------------------------------------------
insert into public.planting (planting_id, farm_id, crop_id, planting_date, area_planted, seed_quantity, expected_harvest_date, status_id) values
  (1,  1,  1,  '2026-01-15', 1.00, 10.00, '2026-05-10', 3),  -- VERIFY seed_quantity
  (2,  2,  2,  '2026-01-20', 1.20, 15.00, '2026-04-29', 3),  -- VERIFY seed_quantity
  (3,  3,  3,  '2026-01-25', 0.80, 20.00, '2026-04-24', 3),  -- VERIFY seed_quantity
  (4,  4,  4,  '2026-02-01', 0.90, 25.00, '2026-05-11', 3),  -- VERIFY seed_quantity
  (5,  5,  5,  '2026-02-05', 1.50, 30.00, '2026-12-01', 3),  -- VERIFY seed_quantity
  (6,  6,  1,  '2026-02-10', 0.60, 35.00, '2026-06-05', 3),  -- VERIFY seed_quantity
  (7,  7,  2,  '2026-02-15', 1.10, 40.00, '2026-05-25', 3),  -- VERIFY seed_quantity
  (8,  8,  3,  '2026-02-20', 0.70, 45.00, '2026-05-20', 3),  -- VERIFY seed_quantity
  (9,  9,  4,  '2026-02-25', 0.85, 10.00, '2026-06-04', 3),  -- VERIFY seed_quantity
  (10, 10, 6,  '2026-03-01', 1.30, 15.00, '2026-07-29', 3),  -- VERIFY seed_quantity
  (11, 11, 1,  '2026-02-09', 0.50, 20.00, '2026-06-04', 3),
  (12, 12, 2,  '2026-02-12', 0.60, 25.00, '2026-05-23', 3),
  (13, 13, 3,  '2026-02-15', 0.70, 30.00, '2026-05-16', 3),
  (14, 14, 4,  '2026-02-18', 0.80, 35.00, '2026-05-29', 3),
  (15, 15, 5,  '2026-02-21', 0.90, 40.00, '2026-12-18', 3),
  (16, 1,  6,  '2026-02-24', 1.00, 45.00, '2026-07-24', 3),
  (17, 2,  7,  '2026-02-27', 1.10, 10.00, '2026-06-17', 3),
  (18, 3,  8,  '2026-03-02', 1.20, 15.00, '2026-10-28', 3),
  (19, 4,  9,  '2026-03-05', 1.30, 20.00, '2026-07-03', 3),
  (20, 5,  10, '2026-03-08', 1.40, 25.00, '2026-06-01', 3),
  (21, 6,  1,  '2026-03-11', 0.50, 30.00, '2026-07-04', 2),
  (22, 7,  2,  '2026-03-14', 0.60, 35.00, '2026-06-22', 2),
  (23, 8,  3,  '2026-03-17', 0.70, 40.00, '2026-06-15', 2),
  (24, 9,  4,  '2026-03-20', 0.80, 45.00, '2026-06-28', 2),
  (25, 10, 5,  '2026-03-23', 0.90, 10.00, '2027-01-17', 2),
  (26, 11, 6,  '2026-03-26', 1.00, 15.00, '2026-08-23', 2),
  (27, 12, 7,  '2026-03-29', 1.10, 20.00, '2026-07-17', 2),
  (28, 13, 8,  '2026-04-01', 1.20, 25.00, '2026-11-27', 2)
on conflict (planting_id) do nothing;

-- ---------------------------------------------------------------------------
-- Harvest (20 rows, one per planting 1-20)
-- grade: 1 = A, 2 = B, 3 = C
-- remark: 6 = High quality harvest, 1 = Good harvest, 2 = Acceptable quality
-- ---------------------------------------------------------------------------
insert into public.harvest (harvest_id, planting_id, harvest_date, quantity_kg, selling_price_per_kg, grade_id, remark_id) values
  (1,  1,  '2026-05-07',  900.00, 22.00, 1, 6),
  (2,  2,  '2026-04-25', 1025.00, 25.50, 2, 1),
  (3,  3,  '2026-04-18', 1150.00, 29.00, 3, 2),
  (4,  4,  '2026-05-01', 1275.00, 32.50, 1, 6),
  (5,  5,  '2026-11-20', 1400.00, 36.00, 2, 1),
  (6,  6,  '2026-06-26', 1525.00, 39.50, 3, 2),
  (7,  7,  '2026-05-20', 1650.00, 43.00, 1, 6),
  (8,  8,  '2026-09-30', 1775.00, 46.50, 2, 1),
  (9,  9,  '2026-06-05', 1900.00, 22.00, 3, 2),
  (10, 10, '2026-05-04', 2025.00, 25.50, 1, 6),
  (11, 11, '2026-06-06', 2150.00, 29.00, 2, 1),
  (12, 12, '2026-05-25', 2275.00, 32.50, 3, 2),
  (13, 13, '2026-05-18', 2400.00, 36.00, 1, 6),
  (14, 14, '2026-05-31', 2525.00, 39.50, 2, 1),
  (15, 15, '2026-12-20', 2650.00, 43.00, 3, 2),
  (16, 16, '2026-07-26', 2775.00, 46.50, 1, 6),
  (17, 17, '2026-06-19', 2900.00, 22.00, 2, 1),
  (18, 18, '2026-10-30', 3025.00, 25.50, 3, 2),
  (19, 19, '2026-07-05', 3150.00, 29.00, 1, 6),
  (20, 20, '2026-06-03', 3275.00, 32.50, 2, 1)
on conflict (harvest_id) do nothing;

-- ---------------------------------------------------------------------------
-- Keep identity counters ahead of the IDs inserted above.
-- ---------------------------------------------------------------------------
select setval(pg_get_serial_sequence('public.farmer',   'farmer_id'),   (select max(farmer_id)   from public.farmer));
select setval(pg_get_serial_sequence('public.farm',     'farm_id'),     (select max(farm_id)     from public.farm));
select setval(pg_get_serial_sequence('public.crop',     'crop_id'),     (select max(crop_id)     from public.crop));
select setval(pg_get_serial_sequence('public.planting', 'planting_id'), (select max(planting_id) from public.planting));
select setval(pg_get_serial_sequence('public.harvest',  'harvest_id'),  (select max(harvest_id)  from public.harvest));

notify pgrst, 'reload schema';

commit;
