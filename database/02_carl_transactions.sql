-- Carl Agustine Noblesala: Transactions module
USE norsu_tabulator;

CREATE TABLE IF NOT EXISTS events (
    id INT NOT NULL AUTO_INCREMENT,
    event_name VARCHAR(100) NOT NULL,
    event_type_id INT NOT NULL,
    venue_id INT NOT NULL,
    event_date DATETIME NOT NULL,
    status ENUM(
        'scheduled',
        'ongoing',
        'completed',
        'cancelled'
    ) NOT NULL DEFAULT 'scheduled',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_events_event_date (event_date),
    KEY idx_events_event_type (event_type_id),
    KEY idx_events_venue (venue_id),
    KEY idx_events_is_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS participants (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    participant_type ENUM(
        'candidate',
        'college_team'
    ) NOT NULL,
    college_id INT NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_participants_college (college_id),
    KEY idx_participants_is_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS event_participants (
    id INT NOT NULL AUTO_INCREMENT,
    event_id INT NOT NULL,
    participant_id INT NOT NULL,
    entry_number VARCHAR(30) NOT NULL,
    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_event_entry_number (event_id, entry_number),
    UNIQUE KEY uq_event_participant (event_id, participant_id),
    KEY idx_event_participants_participant (participant_id),

    CONSTRAINT fk_event_participants_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_event_participants_participant
        FOREIGN KEY (participant_id)
        REFERENCES participants(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;