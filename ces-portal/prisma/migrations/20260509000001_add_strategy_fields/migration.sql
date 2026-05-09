ALTER TABLE `Roadmap` ADD COLUMN `strategyTitle`      VARCHAR(191) NULL;
ALTER TABLE `Roadmap` ADD COLUMN `strategyFileUrl`    VARCHAR(1000) NULL;
ALTER TABLE `Roadmap` ADD COLUMN `strategyFileName`   VARCHAR(191) NULL;
ALTER TABLE `Roadmap` ADD COLUMN `strategyUploadedBy` VARCHAR(191) NULL;
ALTER TABLE `Roadmap` ADD COLUMN `strategyUploadedAt` DATETIME(3)  NULL;
