-- CreateTable
CREATE TABLE "board_users" (
    "userId" INTEGER NOT NULL,
    "boardId" INTEGER NOT NULL,

    CONSTRAINT "board_users_pkey" PRIMARY KEY ("userId","boardId")
);

-- AddForeignKey
ALTER TABLE "board_users" ADD CONSTRAINT "board_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_users" ADD CONSTRAINT "board_users_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
