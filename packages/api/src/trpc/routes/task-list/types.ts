import type { Prisma } from "@prisma/client";

export type getTaskListSub = Prisma.TaskListGetPayload<{
	include: { tasks: { select: { id: true } } };
}> | null;
