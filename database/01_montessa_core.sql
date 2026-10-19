-- MONTESSA: Core (roles, users, event_judges)
-- Run AFTER 00_init.sql
USE norsu_tabulator;

CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- event_id points to events(id) (Carl's table).
-- Its foreign key is added later in 99_foreign_keys.sql.
CREATE TABLE IF NOT EXISTS event_judges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_event_judge (event_id, user_id),
  CONSTRAINT fk_ej_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Seed roles (admin user is created with: npm run seed:admin)
INSERT IGNORE INTO roles (id, name) VALUES (1, 'admin'), (2, 'judge');
