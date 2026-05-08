-- Direct messaging table
-- Run this once in phpMyAdmin against the cis database

CREATE TABLE IF NOT EXISTS messages (
  id           BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  sender_id    BIGINT(20) UNSIGNED NOT NULL,
  recipient_id BIGINT(20) UNSIGNED NULL     COMMENT 'NULL when is_broadcast = 1',
  subject      VARCHAR(200)        NOT NULL DEFAULT '(no subject)',
  body         TEXT                NOT NULL,
  parent_id    BIGINT(20) UNSIGNED NULL     COMMENT 'original message id for replies',
  is_broadcast TINYINT(1)          NOT NULL DEFAULT 0,
  sent_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at      DATETIME            NULL,
  PRIMARY KEY (id),
  INDEX idx_recipient (recipient_id, sent_at),
  INDEX idx_sender    (sender_id,    sent_at),
  INDEX idx_broadcast (is_broadcast),
  CONSTRAINT fk_msg_sender    FOREIGN KEY (sender_id)    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_msg_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_msg_parent    FOREIGN KEY (parent_id)    REFERENCES messages(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
