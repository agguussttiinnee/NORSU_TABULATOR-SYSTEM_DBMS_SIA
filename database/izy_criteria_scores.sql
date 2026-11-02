
USE norsu_tabulator;

-- ==========================================
-- IZY: CRITERIA TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS criteria (
    id INT NOT NULL AUTO_INCREMENT,
    event_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    max_score DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_criteria_event_name (event_id, name),

    CONSTRAINT fk_criteria_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;


-- ==========================================
-- IZY: SCORES TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS scores (
    id INT NOT NULL AUTO_INCREMENT,
    judge_id INT NOT NULL,
    participant_id INT NOT NULL,
    criterion_id INT NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_score_judge_participant_criterion
        (judge_id, participant_id, criterion_id),

    KEY fk_scores_participant (participant_id),
    KEY fk_scores_criterion (criterion_id),

    CONSTRAINT fk_scores_criterion
        FOREIGN KEY (criterion_id)
        REFERENCES criteria(id),

    CONSTRAINT fk_scores_judge
        FOREIGN KEY (judge_id)
        REFERENCES users(id),

    CONSTRAINT fk_scores_participant
        FOREIGN KEY (participant_id)
        REFERENCES participants(id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;