import { publish, subscribe } from "@api/redis";
import { protectedProcedure, router } from "@api/trpc";
import type { FormattedTaskWithDetails } from "@api/trpc/routes/task/types";
import { Messages } from "@api/utils/constants";
import logger from "@api/utils/logger";
import { prisma } from "@api/utils/prisma";
import { TRPCError } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { z } from "zod";

const schema = {
	create: z.object({
		listId: z.number().int("List ID must be an integer").positive("List ID must be a positive number"),
		name: z.string().min(1, "Task name cannot be empty").max(200, "Task name must not exceed 200 characters").trim(),
	}),

	get: z.object({
		id: z.number().int("Task ID must be an integer").positive("Task ID must be a positive number"),
	}),

	delete: z.object({
		id: z.number().int("Task ID must be an integer").positive("Task ID must be a positive number"),
	}),

	setName: z.object({
		id: z.number().int("Task ID must be an integer").positive("Task ID must be a positive number"),
		newName: z
			.string()
			.min(1, "New task name cannot be empty")
			.max(200, "New task name must not exceed 200 characters")
			.trim(),
	}),

	getName: z.object({
		id: z.number().int("Task ID must be an integer").positive("Task ID must be a positive number"),
	}),

	moveToList: z.object({
		id: z.number().int("Task ID must be an integer").positive("Task ID must be a positive number"),
		listId: z.number().int("List ID must be an integer").positive("List ID must be a positive number"),
		newOrder: z.number().int("New order must be an integer").nonnegative("New order must be a non-negative number"),
	}),

	reorder: z.object({
		id: z.number().int("Task ID must be an integer").positive("Task ID must be a positive number"),
		newOrder: z.number().int("New order must be an integer").nonnegative("New order must be a non-negative number"),
	}),

	setAssignedUsers: z.object({
		id: z.number().int("Task ID must be an integer").positive("Task ID must be a positive number"),
		usernames: z.array(z.string().min(1, "Username cannot be empty")),
	}),

	setLabels: z.object({
		id: z.number().int("Task ID must be an integer").positive("Task ID must be a positive number"),
		labelNames: z.array(
			z.string().min(1, "Label name cannot be empty").max(50, "Label name must not exceed 50 characters"),
		),
	}),
};
const getTaskWithList = async (id: number): Promise<FormattedTaskWithDetails> => {
	const task = await prisma.task.findUnique({
		where: { id },
		include: {
			list: true,
			assignedUsers: {
				include: {
					user: {
						select: {
							id: true,
							username: true,
						},
					},
				},
			},
			labels: true,
		},
	});

	if (!task) throw new TRPCError({ code: "NOT_FOUND", message: Messages.TASK_NOT_FOUND });

	return {
		...task,
		assignedUsers: task.assignedUsers.map(({ user }) => ({
			userId: user.id,
			username: user.username,
		})),
	};
};

const publishTaskAndList = (task: FormattedTaskWithDetails) => {
	publish("task", { data: task });
	publish("list", { data: task.list });
};

const publishTaskListAndBoard = (task: FormattedTaskWithDetails) => {
	publishTaskAndList(task);
	prisma.board.findUnique({ where: { id: task.list.boardId } }).then((board) => {
		if (board) publish("board", { data: board });
	});
};

const capitalizeWords = (str: string): string => {
	return str
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(" ");
};

const cleanupUnusedLabels = async () => {
	try {
		const unusedLabels = await prisma.label.findMany({
			where: {
				tasks: {
					none: {},
				},
			},
		});

		if (unusedLabels.length > 0) {
			await prisma.label.deleteMany({
				where: {
					id: {
						in: unusedLabels.map((label) => label.id),
					},
				},
			});
			logger.info(`Cleaned up ${unusedLabels.length} unused labels`);
		}
	} catch (error) {
		logger.error("Error cleaning up unused labels:", error);
	}
};

export default router({
	get: protectedProcedure.input(schema.get).query(async ({ input }) => {
		return getTaskWithList(input.id);
	}),

	getSub: protectedProcedure.input(schema.get).subscription(({ input }) => {
		return observable<FormattedTaskWithDetails>((emit) => {
			const sendTask = async () => {
				try {
					const task = await getTaskWithList(input.id);
					emit.next(task);
				} catch (error: unknown) {
					logger.error(error);
				}
			};

			sendTask();

			return subscribe("task", (value) => {
				if (value.data.id === input.id) sendTask();
			});
		});
	}),

	create: protectedProcedure.input(schema.create).mutation(async ({ input }) => {
		const task = await prisma.task.create({
			data: {
				name: input.name,
				listId: input.listId,
				order: await prisma.task.count({ where: { listId: input.listId } }),
			},
			include: {
				list: true,
				assignedUsers: {
					include: {
						user: {
							select: {
								id: true,
								username: true,
							},
						},
					},
				},
				labels: true,
			},
		});

		const formattedTask: FormattedTaskWithDetails = {
			...task,
			assignedUsers: task.assignedUsers.map(({ user }) => ({
				userId: user.id,
				username: user.username,
			})),
		};

		publishTaskListAndBoard(formattedTask);
		return formattedTask;
	}),

	delete: protectedProcedure.input(schema.delete).mutation(async ({ input }) => {
		const task = await getTaskWithList(input.id);
		await prisma.task.delete({ where: { id: input.id } });
		publishTaskListAndBoard(task);
		return true;
	}),

	getName: protectedProcedure.input(schema.getName).query(async ({ input }) => {
		const task = await getTaskWithList(input.id);
		return task.name;
	}),

	setName: protectedProcedure.input(schema.setName).mutation(async ({ input }) => {
		const updatedTask = await prisma.task.update({
			where: { id: input.id },
			data: { name: input.newName },
			include: {
				list: true,
				assignedUsers: {
					include: {
						user: {
							select: {
								id: true,
								username: true,
							},
						},
					},
				},
				labels: true,
			},
		});

		const formattedTask: FormattedTaskWithDetails = {
			...updatedTask,
			assignedUsers: updatedTask.assignedUsers.map(({ user }) => ({
				userId: user.id,
				username: user.username,
			})),
		};

		publishTaskAndList(formattedTask);
		return formattedTask;
	}),

	moveToList: protectedProcedure.input(schema.moveToList).mutation(async ({ input }) => {
		const { id, listId, newOrder } = input;
		const currentTask = await getTaskWithList(id);

		if (currentTask.list.id === listId && currentTask.order === newOrder) return currentTask;

		const updatedTask = await prisma.$transaction(async (prisma) => {
			await prisma.task.updateMany({
				where: { listId: currentTask.listId, order: { gt: currentTask.order } },
				data: { order: { decrement: 1 } },
			});

			await prisma.task.updateMany({
				where: { listId, order: { gte: newOrder } },
				data: { order: { increment: 1 } },
			});

			return prisma.task.update({
				where: { id },
				data: { listId, order: newOrder },
				include: {
					list: true,
					assignedUsers: {
						include: {
							user: {
								select: {
									id: true,
									username: true,
								},
							},
						},
					},
					labels: true,
				},
			});
		});

		const formattedTask: FormattedTaskWithDetails = {
			...updatedTask,
			assignedUsers: updatedTask.assignedUsers.map(({ user }) => ({
				userId: user.id,
				username: user.username,
			})),
		};

		const updatedOriginalList = await prisma.taskList.findUniqueOrThrow({
			where: { id: currentTask.listId },
		});

		publishTaskAndList(formattedTask);
		publish("list", { data: updatedOriginalList });
		return formattedTask;
	}),

	reorder: protectedProcedure.input(schema.reorder).mutation(async ({ input }) => {
		const { id, newOrder } = input;
		const task = await getTaskWithList(id);

		const updatedTask = await prisma.$transaction(async (prisma) => {
			if (newOrder > task.order) {
				await prisma.task.updateMany({
					where: {
						listId: task.listId,
						order: { gt: task.order, lte: newOrder },
					},
					data: { order: { decrement: 1 } },
				});
			} else {
				await prisma.task.updateMany({
					where: {
						listId: task.listId,
						order: { gte: newOrder, lt: task.order },
					},
					data: { order: { increment: 1 } },
				});
			}

			return prisma.task.update({
				where: { id },
				data: { order: newOrder },
				include: {
					list: true,
					assignedUsers: {
						include: {
							user: {
								select: {
									id: true,
									username: true,
								},
							},
						},
					},
					labels: true,
				},
			});
		});

		const formattedTask: FormattedTaskWithDetails = {
			...updatedTask,
			assignedUsers: updatedTask.assignedUsers.map(({ user }) => ({
				userId: user.id,
				username: user.username,
			})),
		};

		publishTaskAndList(formattedTask);

		return formattedTask;
	}),

	setAssignedUsers: protectedProcedure.input(schema.setAssignedUsers).mutation(async ({ input }) => {
		const { id, usernames } = input;

		const updatedTask = await prisma.$transaction(async (prisma) => {
			const users = await prisma.user.findMany({
				where: { username: { in: usernames } },
				select: { id: true, username: true },
			});

			await prisma.taskAssignee.deleteMany({
				where: { taskId: id },
			});

			await prisma.taskAssignee.createMany({
				data: users.map((user) => ({ taskId: id, userId: user.id })),
			});

			return prisma.task.findUnique({
				where: { id },
				include: {
					list: true,
					assignedUsers: {
						include: {
							user: {
								select: {
									id: true,
									username: true,
								},
							},
						},
					},
					labels: true,
				},
			});
		});

		if (!updatedTask) throw new TRPCError({ code: "NOT_FOUND", message: Messages.TASK_NOT_FOUND });

		const formattedTask: FormattedTaskWithDetails = {
			...updatedTask,
			assignedUsers: updatedTask.assignedUsers.map(({ user }) => ({
				userId: user.id,
				username: user.username,
			})),
		};

		publishTaskAndList(formattedTask);

		return formattedTask;
	}),

	setLabels: protectedProcedure.input(schema.setLabels).mutation(async ({ input }) => {
		const { id, labelNames } = input;

		const updatedTask = await prisma.$transaction(async (prisma) => {
			const task = await prisma.task.findUnique({
				where: { id },
				include: { labels: true },
			});

			if (!task) {
				throw new TRPCError({ code: "NOT_FOUND", message: Messages.TASK_NOT_FOUND });
			}

			const labels = await Promise.all(
				labelNames.map(async (name) => {
					const capitalizedName = capitalizeWords(name);
					let label = await prisma.label.findFirst({ where: { name: capitalizedName } });
					if (!label) {
						label = await prisma.label.create({ data: { name: capitalizedName } });
					}
					return label;
				}),
			);

			return prisma.task.update({
				where: { id },
				data: {
					labels: {
						set: labels.map((label) => ({ id: label.id })),
					},
				},
				include: {
					list: true,
					assignedUsers: {
						include: {
							user: {
								select: {
									id: true,
									username: true,
								},
							},
						},
					},
					labels: true,
				},
			});
		});

		cleanupUnusedLabels();

		const formattedTask: FormattedTaskWithDetails = {
			...updatedTask,
			assignedUsers: updatedTask.assignedUsers.map(({ user }) => ({
				userId: user.id,
				username: user.username,
			})),
		};

		publishTaskAndList(formattedTask);

		return formattedTask;
	}),
});
