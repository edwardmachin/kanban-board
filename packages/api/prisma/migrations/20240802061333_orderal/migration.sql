-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "TaskList" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;
