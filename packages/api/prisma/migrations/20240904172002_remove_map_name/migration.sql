/*
  Warnings:

  - You are about to drop the `board_users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `task_assignees` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "board_users" DROP CONSTRAINT "board_users_boardId_fkey";

-- DropForeignKey
ALTER TABLE "board_users" DROP CONSTRAINT "board_users_userId_fkey";

-- DropForeignKey
ALTER TABLE "task_assignees" DROP CONSTRAINT "task_assignees_taskId_fkey";

-- DropForeignKey
ALTER TABLE "task_assignees" DROP CONSTRAINT "task_assignees_userId_fkey";

-- DropTable
DROP TABLE "board_users";

-- DropTable
DROP TABLE "task_assignees";

-- CreateTable
CREATE TABLE "BoardUsers" (
    "userId" INTEGER NOT NULL,
    "boardId" INTEGER NOT NULL,

    CONSTRAINT "BoardUsers_pkey" PRIMARY KEY ("userId","boardId")
);

-- CreateTable
CREATE TABLE "TaskAssignee" (
    "userId" INTEGER NOT NULL,
    "taskId" INTEGER NOT NULL,

    CONSTRAINT "TaskAssignee_pkey" PRIMARY KEY ("userId","taskId")
);

-- AddForeignKey
ALTER TABLE "BoardUsers" ADD CONSTRAINT "BoardUsers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardUsers" ADD CONSTRAINT "BoardUsers_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
