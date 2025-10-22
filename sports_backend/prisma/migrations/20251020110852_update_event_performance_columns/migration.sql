-- AlterTable
ALTER TABLE "event_performance" DROP COLUMN "heat_time";

-- AlterTable
ALTER TABLE "event_performance" ADD COLUMN "performance_1" REAL;

-- AlterTable
ALTER TABLE "event_performance" ADD COLUMN "performance_2" REAL;

-- AlterTable
ALTER TABLE "event_performance" ADD COLUMN "performance_3" REAL;
