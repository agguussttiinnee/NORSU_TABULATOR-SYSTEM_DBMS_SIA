USE norsu_tabulator;

INSERT IGNORE INTO event_types (name) VALUES
 ('Pageant'), ('Hugyawan');

UPDATE colleges
SET name = 'College of Engineering and Architecture', code = 'CEA'
WHERE code = 'COE';

UPDATE colleges SET is_active = 0 WHERE code = 'COED';

INSERT INTO colleges (name, code) VALUES
  ('College of Arts and Sciences', 'CAS'),
  ('College of Business Administration', 'CBA'),
  ('College of Criminal Justice Education', 'CCJE'),
  ('College of Engineering and Architecture', 'CEA'),
  ('College of Industrial Technology', 'CIT'),
  ('College of Nursing, Pharmacy and Allied Health Sciences', 'CNPAHS'),
  ('College of Teacher Education', 'CTE'),
  ('College of Tourism and Hospitality Management', 'CTHM'),
  ('College of Agriculture, Forestry and Fishery', 'CAFF')
AS new
ON DUPLICATE KEY UPDATE name = new.name, is_active = 1;

INSERT IGNORE INTO venues (name, location) VALUES
 ('University Gym', 'Main Campus'),
 ('Covered Court', 'Main Campus'),
 ('Open Grounds', 'Main Campus');