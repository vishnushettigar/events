/*
  Warnings:

  - Made the column `temple_id` on table `Profile` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Champion` DROP FOREIGN KEY `Champion_host_temple_id_fkey`;

-- DropForeignKey
ALTER TABLE `Champion` DROP FOREIGN KEY `Champion_temple_id_fkey`;

-- DropForeignKey
ALTER TABLE `Ind_event_registration` DROP FOREIGN KEY `Ind_event_registration_event_id_fkey`;

-- DropForeignKey
ALTER TABLE `Ind_event_registration` DROP FOREIGN KEY `Ind_event_registration_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `Mst_event` DROP FOREIGN KEY `Mst_event_age_category_id_fkey`;

-- DropForeignKey
ALTER TABLE `Mst_event` DROP FOREIGN KEY `Mst_event_event_type_id_fkey`;

-- DropForeignKey
ALTER TABLE `Mst_event_result` DROP FOREIGN KEY `Mst_event_result_event_type_id_fkey`;

-- DropForeignKey
ALTER TABLE `Profile` DROP FOREIGN KEY `Profile_role_id_fkey`;

-- DropForeignKey
ALTER TABLE `Profile` DROP FOREIGN KEY `Profile_temple_id_fkey`;

-- DropForeignKey
ALTER TABLE `Profile` DROP FOREIGN KEY `Profile_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `Team_event_registration` DROP FOREIGN KEY `Team_event_registration_event_id_fkey`;

-- DropForeignKey
ALTER TABLE `Team_event_registration` DROP FOREIGN KEY `Team_event_registration_temple_id_fkey`;

-- DropForeignKey
ALTER TABLE `User_role` DROP FOREIGN KEY `User_role_role_id_fkey`;

-- DropForeignKey
ALTER TABLE `User_role` DROP FOREIGN KEY `User_role_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `event_schedule` DROP FOREIGN KEY `event_schedule_event_id_fkey`;

-- AlterTable
ALTER TABLE `Profile` MODIFY `temple_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Champion` ADD CONSTRAINT `Champion_temple_id_fkey` FOREIGN KEY (`temple_id`) REFERENCES `Mst_temple`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Champion` ADD CONSTRAINT `Champion_host_temple_id_fkey` FOREIGN KEY (`host_temple_id`) REFERENCES `Mst_temple`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ind_event_registration` ADD CONSTRAINT `Ind_event_registration_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `Mst_event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ind_event_registration` ADD CONSTRAINT `Ind_event_registration_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `Profile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Mst_event` ADD CONSTRAINT `Mst_event_event_type_id_fkey` FOREIGN KEY (`event_type_id`) REFERENCES `Mst_event_type`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Mst_event` ADD CONSTRAINT `Mst_event_age_category_id_fkey` FOREIGN KEY (`age_category_id`) REFERENCES `Mst_age_category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Mst_event_result` ADD CONSTRAINT `Mst_event_result_event_type_id_fkey` FOREIGN KEY (`event_type_id`) REFERENCES `Mst_event_type`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Profile` ADD CONSTRAINT `Profile_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Profile` ADD CONSTRAINT `Profile_temple_id_fkey` FOREIGN KEY (`temple_id`) REFERENCES `Mst_temple`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Profile` ADD CONSTRAINT `Profile_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `Mst_role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Team_event_registration` ADD CONSTRAINT `Team_event_registration_temple_id_fkey` FOREIGN KEY (`temple_id`) REFERENCES `Mst_temple`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Team_event_registration` ADD CONSTRAINT `Team_event_registration_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `Mst_event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User_role` ADD CONSTRAINT `User_role_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User_role` ADD CONSTRAINT `User_role_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `Mst_role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_schedule` ADD CONSTRAINT `event_schedule_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `Mst_event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
