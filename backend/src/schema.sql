CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  full_name VARCHAR(150) NOT NULL,
  company_name VARCHAR(150) NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,

  role ENUM(
    'client',
    'admin',
    'staff'
  ) NOT NULL DEFAULT 'client',

  status ENUM(
    'active',
    'blocked'
  ) NOT NULL DEFAULT 'active',

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP NOT NULL
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


/* =====================================================
   Applications
===================================================== */

CREATE TABLE IF NOT EXISTS applications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  user_id INT UNSIGNED NOT NULL,

  service_type ENUM(
    'us_llc',
    'ein_assistance',
    'banking_payment_setup',
    'compliance_support'
  ) NOT NULL,

  status ENUM(
    'draft',
    'submitted',
    'in_review',
    'waiting_documents',
    'processing',
    'completed',
    'rejected'
  ) NOT NULL DEFAULT 'submitted',

  current_step VARCHAR(100) NOT NULL DEFAULT 'intake_submitted',

  progress TINYINT UNSIGNED NOT NULL DEFAULT 0,

  notes TEXT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP NOT NULL
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_applications_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  INDEX idx_applications_user_id (user_id),
  INDEX idx_applications_status (status),
  INDEX idx_applications_service_type (service_type),
  INDEX idx_applications_created_at (created_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


/* =====================================================
   Application intake information
===================================================== */

CREATE TABLE IF NOT EXISTS application_intake (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  application_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,

  phone VARCHAR(50) NOT NULL,
  country VARCHAR(150) NOT NULL,

  business_activity TEXT NOT NULL,

  desired_company_name VARCHAR(255) NULL,

  needs_ein TINYINT(1) NOT NULL DEFAULT 0,
  needs_stripe TINYINT(1) NOT NULL DEFAULT 0,
  needs_paypal TINYINT(1) NOT NULL DEFAULT 0,
  needs_wise TINYINT(1) NOT NULL DEFAULT 0,
  needs_mercury TINYINT(1) NOT NULL DEFAULT 0,

  needs_relay TINYINT(1) NOT NULL DEFAULT 0,
  needs_payoneer TINYINT(1) NOT NULL DEFAULT 0,
  needs_shopify TINYINT(1) NOT NULL DEFAULT 0,

  extra_notes TEXT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP NOT NULL
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_application_intake_application
    FOREIGN KEY (application_id)
    REFERENCES applications(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_application_intake_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  UNIQUE KEY unique_application_intake_application (
    application_id
  ),

  INDEX idx_application_intake_user_id (user_id),
  INDEX idx_application_intake_created_at (created_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;