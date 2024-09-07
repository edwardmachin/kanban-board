import { publish, subscribe } from "@api/redis";
import { protectedProcedure, router } from "@api/trpc";
import type { getTaskListSub } from "@api/trpc/routes/task-list/types";
import { Messages } from "@api/utils/constants";
import logger from "@api/utils/logger";
import { prisma } from "@api/utils/prisma";
import type { Board, TaskList } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { z } from "zod";

const schema = {
	create: z.object({
		boardId: z.number().int("Board ID must be an integer").positive("Board ID must be a positive number"),
		name: z
			.string()
			.min(1, "Task list name cannot be empty")
			.max(100, "Task list name must not exceed 100 characters")
			.trim(),
	}),

	get: z.object({
		id: z.number().int("Task list ID must be an integer").positive("Task list ID must be a positive number"),
	}),

	delete: z.object({
		id: z.number().int("Task list ID must be an integer").positive("Task list ID must be a positive number"),
	}),

	setName: z.object({
		id: z.number().int("Task list ID must be an integer").positive("Task list ID must be a positive number"),
		newName: z
			.string()
			.min(1, "New task list name cannot be empty")
			.max(100, "New task list name must not exceed 100 characters")
			.trim(),
	}),

	reorder: z.object({
		id: z.number().int("Task list ID must be an integer").positive("Task list ID must be a positive number"),
		newOrder: z.number().int("New order must be an integer").nonnegative("New order must be a non-negative number"),
	}),
};

const getTaskListWithBoard = async (id: number): Promise<TaskList & { board: Board }> => {
	const taskList = await prisma.taskList.findUnique({
		where: { id },
		include: { board: true },
	});
	if (!taskList) throw new TRPCError({ code: "NOT_FOUND", message: Messages.TASK_LIST_NOT_FOUND });
	return taskList;
};

const publishTaskListAndBoard = (taskList: TaskList & { board: Board }) => {
	publish("list", { data: taskList });
	publish("board", { data: taskList.board });
};

export default router({
	get: protectedProcedure.input(schema.get).query(async ({ input }) => {
		return getTaskListWithBoard(input.id);
	}),

	getSub: protectedProcedure.input(schema.get).subscription(({ input }) => {
		return observable<getTaskListSub>((emit) => {
			const sendTaskList = async () => {
				try {
					const taskList = await prisma.taskList.findUnique({
						where: { id: input.id },
						include: {
							tasks: {
								select: { id: true, name: true, order: true },
								orderBy: { order: "asc" },
							},
						},
					});
					emit.next(taskList);
				} catch (error: unknown) {
					logger.error(error);
				}
			};

			sendTaskList();

			return subscribe("list", (value) => {
				if (value.data.id === input.id) sendTaskList();
			});
		});
	}),

	create: protectedProcedure.input(schema.create).mutation(async ({ input }) => {
		const taskList = await prisma.taskList.create({
			data: {
				name: input.name,
				board: { connect: { id: input.boardId } },
				order: await prisma.taskList.count({ where: { boardId: input.boardId } }),
			},
			include: { board: true },
		});
		publishTaskListAndBoard(taskList);
		return taskList.id;
	}),

	delete: protectedProcedure.input(schema.delete).mutation(async ({ input }) => {
		const taskList = await getTaskListWithBoard(input.id);
		await prisma.taskList.delete({ where: { id: input.id } });
		publishTaskListAndBoard(taskList);
		return true;
	}),

	setName: protectedProcedure.input(schema.setName).mutation(async ({ input }) => {
		const taskList = await prisma.taskList.update({
			where: { id: input.id },
			data: { name: input.newName },
			include: { board: true },
		});
		publishTaskListAndBoard(taskList);
		return true;
	}),

	reorder: protectedProcedure.input(schema.reorder).mutation(async ({ input }) => {
		const { id, newOrder } = input;

		const updatedList = await prisma.$transaction(async (tx) => {
			// Get the current list and its board
			const currentList = await tx.taskList.findUnique({
				where: { id },
				include: { board: true },
			});

			if (!currentList) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "TaskList not found",
				});
			}

			// Get all lists for the board
			const allLists = await tx.taskList.findMany({
				where: { boardId: currentList.boardId },
				orderBy: { order: "asc" },
			});

			// Remove the current list and add it at the new position
			const otherLists = allLists.filter((list) => list.id !== id);
			otherLists.splice(newOrder - 1, 0, { ...currentList, order: newOrder });

			// Update orders for all lists
			for (let i = 0; i < otherLists.length; i++) {
				await tx.taskList.update({
					where: { id: otherLists[i].id },
					data: { order: i + 1 },
				});
			}

			// Fetch and return the updated list
			return tx.taskList.findUnique({
				where: { id },
				include: { board: true },
			});
		});

		if (updatedList) {
			publishTaskListAndBoard(updatedList);
		}

		return updatedList;
	}),
});
