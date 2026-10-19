-- GRETCHEN: Reports (award_categories, awards)
-- Run AFTER 00_init.sql and 01_montessa_core.sql.
-- Its foreign keys to events, participants and colleges are in 99_foreign_keys.sql.
USE norsu_tabulator;

CREATE TABLE IF NOT EXISTS award_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- One row = one winner placement for an event in an award category.
-- total_score is the final tabulated score copied in when the award is given.
CREATE TABLE IF NOT EXISTS awards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  participant_id INT NOT NULL,
  award_category_id INT NOT NULL,
  rank_no INT NOT NULL,
  total_score DECIMAL(8,2) NOT NULL DEFAULT 0,
  remarks VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,   -- soft-delete flag
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  active_rank_key TINYINT GENERATED ALWAYS AS (IF(is_active = 1, 1, NULL)) STORED,
  UNIQUE KEY uq_award_rank (event_id, award_category_id, rank_no, active_rank_key),
  CONSTRAINT fk_awards_category FOREIGN KEY (award_category_id) REFERENCES award_categories(id)
);

INSERT IGNORE INTO award_categories (id, name, description) VALUES
  (1, 'Champion',  'Overall highest score'),
  (2, 'Best in Talent', 'Highest talent segment score'),
  (3, 'Audience Choice', 'Voted by the audience');
