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

CREATE TABLE IF NOT EXISTS score_revisions (
    id INT NOT NULL AUTO_INCREMENT,
    score_submission_id INT NOT NULL,           
    requested_by INT NOT NULL,       
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
    decided_by INT NULL,  
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_revision_submission (score_submission_id),
    KEY idx_revision_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS alerts (
    id INT NOT NULL AUTO_INCREMENT,
    requested_by INT NOT NULL,          
    message VARCHAR(255) NOT NULL,
    status ENUM('new', 'reviewed', 'dismissed') NOT NULL DEFAULT 'new',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_alert_submission (requested_by),
    KEY idx_alert_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,              
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,        
    record_id INT NOT NULL,                 
    old_value TEXT NULL,
    new_value TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_audit_user (user_id),
    KEY idx_audit_table_record (table_name,record_id)
) ENGINE=InnoDB;

