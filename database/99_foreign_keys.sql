-- SHARED: cross-member foreign keys.
-- Run this LAST, after every member's table file has been run.
-- Each member adds their own cross-table foreign keys below.
USE norsu_tabulator;

-- Montessa: event_judges -> events (Carl's table)
ALTER TABLE event_judges
  ADD CONSTRAINT fk_ej_event FOREIGN KEY (event_id) REFERENCES events(id);

-- Add yours below, for example:
-- ALTER TABLE participants ADD CONSTRAINT fk_participants_college
--   FOREIGN KEY (college_id) REFERENCES colleges(id);
