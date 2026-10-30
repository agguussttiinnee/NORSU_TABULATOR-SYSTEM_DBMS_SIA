USE norsu_tabulator;

-- Montessa: event_judges -> events (Carl's table)
ALTER TABLE event_judges
  ADD CONSTRAINT fk_ej_event
  FOREIGN KEY (event_id) REFERENCES events(id);

-- Carl: Events -> Master Data
ALTER TABLE events
  ADD CONSTRAINT fk_events_event_type
  FOREIGN KEY (event_type_id) REFERENCES event_types(id);

ALTER TABLE events
  ADD CONSTRAINT fk_events_venue
  FOREIGN KEY (venue_id) REFERENCES venues(id);

-- Carl: Participants -> Master Data
ALTER TABLE participants
  ADD CONSTRAINT fk_participants_college
  FOREIGN KEY (college_id) REFERENCES colleges(id);
