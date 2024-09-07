-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_listId_fkey";

-- DropForeignKey
ALTER TABLE "TaskList" DROP CONSTRAINT "TaskList_boardId_fkey";

-- DropForeignKey
ALTER TABLE "board_users" DROP CONSTRAINT "board_users_boardId_fkey";

-- DropForeignKey
ALTER TABLE "board_users" DROP CONSTRAINT "board_users_userId_fkey";

-- AddForeignKey
ALTER TABLE "board_users" ADD CONSTRAINT "board_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_users" ADD CONSTRAINT "board_users_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskList" ADD CONSTRAINT "TaskList_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_listId_fkey" FOREIGN KEY ("listId") REFERENCES "TaskList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
