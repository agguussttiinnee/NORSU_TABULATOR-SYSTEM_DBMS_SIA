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

  -- Gretchen: awards -> events, participants
  ALTER TABLE awards
  ADD CONSTRAINT fk_awards_event
  FOREIGN KEY (event_id) REFERENCES events(id);

  ALTER TABLE awards
  ADD CONSTRAINT fk_awards_participant
  FOREIGN KEY (participant_id) REFERENCES participants(id);

-- Resty: workflow tables -> event_judges, users
ALTER TABLE score_submissions
  ADD CONSTRAINT fk_ss_event_judge
  FOREIGN KEY (event_judge_id) REFERENCES event_judges(id);

ALTER TABLE score_revisions
  ADD CONSTRAINT fk_sr_submission
  FOREIGN KEY (score_submission_id) REFERENCES score_submissions(id);

ALTER TABLE score_revisions
  ADD CONSTRAINT fk_sr_requested_by
  FOREIGN KEY (requested_by) REFERENCES users(id);

ALTER TABLE score_revisions
  ADD CONSTRAINT fk_sr_decided_by
  FOREIGN KEY (decided_by) REFERENCES users(id);

ALTER TABLE audit_logs
  ADD CONSTRAINT fk_al_user
  FOREIGN KEY (user_id) REFERENCES users(id);
