import type { AppRouter } from "@api/trpc/routes";
import { prisma } from "@api/utils/prisma";
import { createTRPCClient, splitLink, unstable_httpBatchStreamLink, unstable_httpSubscriptionLink } from "@trpc/client";
import bcrypt from "bcrypt";

export const createTestClient = (headers?: Record<string, string>) => {
	return createTRPCClient<AppRouter>({
		links: [
			splitLink({
				condition: (op) => op.type === "subscription",
				true: unstable_httpSubscriptionLink({
					url: "http://localhost:3000/trpc",
					connectionParams: headers,
				}),
				false: unstable_httpBatchStreamLink({
					url: "http://localhost:3000/trpc",
					headers,
				}),
			}),
		],
	});
};

export const createTestUser = async (username: string, password: string) => {
	const hashedPassword = await bcrypt.hash(password, 10);
	return prisma.user.create({
		data: {
			username,
			password: hashedPassword,
		},
	});
};

export const createTestBoard = async (userId: number, name: string) => {
	return prisma.board.create({
		data: {
			name,
			users: { create: { userId } },
		},
	});
};

export const createTestTaskList = async (boardId: number, name: string) => {
	return prisma.taskList.create({
		data: {
			name,
			boardId,
			order: await prisma.taskList.count({ where: { boardId } }),
		},
	});
};

export const createTestTask = async (listId: number, name: string) => {
	return prisma.task.create({
		data: {
			name,
			listId,
			order: await prisma.task.count({ where: { listId } }),
		},
	});
};
