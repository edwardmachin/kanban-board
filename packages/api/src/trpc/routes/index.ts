import { router } from "@api/trpc";
import boardRouter from "@api/trpc/routes/board";
import taskRouter from "@api/trpc/routes/task";
import taskListRouter from "@api/trpc/routes/task-list";
import userRouter from "@api/trpc/routes/user";

export const appRouter = router({
	board: boardRouter,
	taskList: taskListRouter,
	task: taskRouter,
	user: userRouter,
});

export type AppRouter = typeof appRouter;
