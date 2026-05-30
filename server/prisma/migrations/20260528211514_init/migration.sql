-- CreateTable
CREATE TABLE `players` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hive_username` VARCHAR(191) NOT NULL,
    `gender` VARCHAR(191) NOT NULL,
    `trait1` VARCHAR(191) NOT NULL,
    `trait2` VARCHAR(191) NOT NULL,
    `region` VARCHAR(191) NOT NULL,
    `energy` INTEGER NOT NULL DEFAULT 100,
    `strength` INTEGER NOT NULL DEFAULT 10,
    `magic` INTEGER NOT NULL DEFAULT 10,
    `ingenuity` INTEGER NOT NULL DEFAULT 10,
    `stealth` INTEGER NOT NULL DEFAULT 10,
    `influence` INTEGER NOT NULL DEFAULT 10,
    `level` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `players_hive_username_key`(`hive_username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
