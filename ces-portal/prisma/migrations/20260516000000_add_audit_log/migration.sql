CREATE TABLE `AuditLog` (
  `id`        VARCHAR(191) NOT NULL,
  `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `userEmail` VARCHAR(191) NOT NULL,
  `userName`  VARCHAR(191) NULL,
  `action`    VARCHAR(191) NOT NULL,
  `resource`  VARCHAR(191) NULL,
  `detail`    JSON NULL,
  `ipAddress` VARCHAR(191) NULL,
  PRIMARY KEY (`id`),
  INDEX `AuditLog_userEmail_idx` (`userEmail`),
  INDEX `AuditLog_timestamp_idx` (`timestamp`),
  INDEX `AuditLog_action_idx` (`action`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
