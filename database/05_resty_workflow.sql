USE norsu_tabulator;

CREATE TABLE IF NOT EXISTS score_submissions (
    id INT NOT NULL AUTO_INCREMENT,
    event_judge_id INT NOT NULL,
    round_id INT NOT NULL,

    status ENUM('draft','submitted','locked') NOT NULL DEFAULT 'draft',
    submitted_at TIMESTAMP NULL,
    locked_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_submission_judge_round (event_judge_id,round_id),
    KEY idx_submission_status (status)
)ENGINE=InnoDB;