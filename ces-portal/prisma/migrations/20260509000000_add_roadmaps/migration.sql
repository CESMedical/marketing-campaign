-- CreateTable: Roadmap
CREATE TABLE `Roadmap` (
    `id`        VARCHAR(191) NOT NULL,
    `title`     VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3)  NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Insert default roadmap (assigns all existing posts to it)
INSERT INTO `Roadmap` (`id`, `title`, `createdAt`, `updatedAt`)
VALUES ('00000000-ces1-0000-0000-000000000001', 'CES Medical Campaign', NOW(), NOW());

-- Add roadmapId to Post
ALTER TABLE `Post` ADD COLUMN `roadmapId` VARCHAR(191) NULL;

-- Assign all existing posts to the default roadmap
UPDATE `Post` SET `roadmapId` = '00000000-ces1-0000-0000-000000000001';

-- Add foreign key and index
ALTER TABLE `Post` ADD CONSTRAINT `Post_roadmapId_fkey`
    FOREIGN KEY (`roadmapId`) REFERENCES `Roadmap`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX `Post_roadmapId_idx` ON `Post`(`roadmapId`);
