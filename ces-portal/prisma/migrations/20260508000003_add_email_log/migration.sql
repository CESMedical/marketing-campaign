CREATE TABLE `EmailLog` (
    `id`          VARCHAR(191) NOT NULL,
    `type`        VARCHAR(191) NOT NULL,
    `to`          VARCHAR(191) NOT NULL,
    `subject`     VARCHAR(191) NOT NULL,
    `postSlug`    VARCHAR(191) NULL,
    `triggeredBy` VARCHAR(191) NULL,
    `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EmailLog_postSlug_idx`(`postSlug`),
    INDEX `EmailLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
