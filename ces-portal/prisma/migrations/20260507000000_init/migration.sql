-- CreateTable
CREATE TABLE `Post` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `pillar` VARCHAR(191) NOT NULL,
    `platforms` JSON NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `scheduledDate` VARCHAR(191) NOT NULL,
    `weekNumber` INTEGER NOT NULL,
    `isCommercialPriority` BOOLEAN NOT NULL DEFAULT false,
    `service` VARCHAR(191) NULL,
    `format` VARCHAR(191) NOT NULL,
    `caption` TEXT NOT NULL,
    `cta` JSON NOT NULL,
    `asset` JSON NULL,
    `productionLocation` VARCHAR(191) NULL,
    `productionLead` VARCHAR(191) NULL,
    `clinicalReviewer` VARCHAR(191) NULL,
    `brandReviewer` VARCHAR(191) NULL,
    `approvedAt` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `tags` JSON NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Post_slug_key`(`slug`),
    INDEX `Post_slug_idx`(`slug`),
    INDEX `Post_scheduledDate_idx`(`scheduledDate`),
    INDEX `Post_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Comment` (
    `id` VARCHAR(191) NOT NULL,
    `postSlug` VARCHAR(191) NOT NULL,
    `authorName` VARCHAR(191) NOT NULL,
    `authorEmail` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Comment_postSlug_idx`(`postSlug`),
    INDEX `Comment_authorEmail_idx`(`authorEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_postSlug_fkey` FOREIGN KEY (`postSlug`) REFERENCES `Post`(`slug`) ON DELETE CASCADE ON UPDATE CASCADE;
