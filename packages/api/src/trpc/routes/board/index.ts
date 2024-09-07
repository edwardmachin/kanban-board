import { publish, subscribe } from "@api/redis";
import { protectedProcedure, router } from "@api/trpc";
import type { getBoardSub, getBoardUsersSub } from "@api/trpc/routes/board/types";
import { Messages } from "@api/utils/constants";
import logger from "@api/utils/logger";
import { deepEqual } from "@api/utils/objects";
import { prisma } from "@api/utils/prisma";
import type { Board } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { z } from "zod";

const schema = {
	create: z.object({
		name: z.string().min(1, "Board name cannot be empty").max(100, "Board name must not exceed 100 characters").trim(),
	}),

	get: z.object({
		boardId: z.number().int("Board ID must be an integer").positive("Board ID must be a positive number"),
	}),

	delete: z.object({
		boardId: z.number().int("Board ID must be an integer").positive("Board ID must be a positive number"),
	}),

	setName: z.object({
		boardId: z.number().int("Board ID must be an integer").positive("Board ID must be a positive number"),
		newName: z
			.string()
			.min(1, "New board name cannot be empty")
			.max(100, "New board name must not exceed 100 characters")
			.trim(),
	}),

	getUsers: z.object({
		boardId: z.number().int("Board ID must be an integer").positive("Board ID must be a positive number"),
	}),

	setUsers: z.object({
		boardId: z.number().int("Board ID must be an integer").positive("Board ID must be a positive number"),
		userIds: z
			.array(z.number().int("User ID must be an integer").positive("User ID must be a positive number"))
			.min(1, "At least one user ID must be provided"),
	}),

	manageUser: z.object({
		boardId: z.number().int("Board ID must be an integer").positive("Board ID must be a positive number"),
		userId: z.number().int("User ID must be an integer").positive("User ID must be a positive number"),
		action: z.enum(["add", "remove"]),
	}),
};
const checkBoardAccess = async (userId: number, boardId: number) => {
	const hasAccess = await prisma.boardUsers.findUnique({
		where: {
			userId_boardId: { userId, boardId },
		},
	});
	if (!hasAccess) throw new TRPCError({ message: Messages.BOARD_NO_ACCESS, code: "FORBIDDEN" });
};

const getBoardWithDetails = async (boardId: number) => {
	return prisma.board.findUnique({
		where: { id: boardId },
		include: {
			lists: {
				select: {
					id: true,
					name: true,
					order: true,
					tasks: {
						select: {
							id: true,
							name: true,
							order: true,
							createdAt: true,
							updatedAt: true,
						},
						orderBy: { order: "asc" },
					},
				},
				orderBy: { order: "asc" },
			},
			users: {
				select: {
					user: {
						select: {
							id: true,
							username: true,
						},
					},
				},
			},
		},
	});
};

export default router({
	get: protectedProcedure.input(schema.get).query(async ({ input }) => {
		const board = await getBoardWithDetails(input.boardId);
		if (!board) throw new TRPCError({ message: Messages.BOARD_NOT_FOUND, code: "NOT_FOUND" });
		return board;
	}),

	getSub: protectedProcedure.input(schema.get).subscription(({ input, ctx }) => {
		return observable<getBoardSub>((emit) => {
			const sendBoard = async () => {
				try {
					if (!ctx.user) throw new TRPCError({ message: Messages.UNAUTHORIZED, code: "UNAUTHORIZED" });

					const board = await getBoardWithDetails(input.boardId);

					if (!board) throw new TRPCError({ message: Messages.BOARD_NOT_FOUND, code: "NOT_FOUND" });

					const hasAccess = board.users.some((u) => u.user.id === ctx.user?.id);
					if (!hasAccess) throw new TRPCError({ message: Messages.BOARD_NO_ACCESS, code: "FORBIDDEN" });

					emit.next(board);
				} catch (error: unknown) {
					logger.error(error);
				}
			};

			sendBoard();

			return subscribe("board", (value) => {
				if (value.data.id === input.boardId) sendBoard();
			});
		});
	}),

	getAll: protectedProcedure.query(async ({ ctx }) => {
		if (!ctx.user) throw new TRPCError({ message: Messages.UNAUTHORIZED, code: "UNAUTHORIZED" });

		return prisma.board.findMany({
			where: { users: { some: { userId: ctx.user.id } } },
			include: { users: { select: { userId: true } } },
		});
	}),

	getAllSub: protectedProcedure.subscription(({ ctx }) => {
		return observable<Board[]>((emit) => {
			if (!ctx.user) throw new TRPCError({ message: Messages.UNAUTHORIZED, code: "UNAUTHORIZED" });

			const userId = ctx.user.id;
			let lastSentBoards: Board[] = [];

			const sendBoards = async () => {
				try {
					const boards = await prisma.board.findMany({
						where: { users: { some: { userId } } },
						include: { users: { select: { userId: true } } },
					});

					const boardsChanged = !deepEqual(boards, lastSentBoards);

					if (boardsChanged) {
						lastSentBoards = boards;
						emit.next(boards);
					}
				} catch (error: unknown) {
					logger.error(error);
				}
			};

			sendBoards();

			return subscribe("board", async (value) => {
				const updatedBoardId = value.data.id;
				const userHasAccess = await prisma.boardUsers.findUnique({
					where: { userId_boardId: { userId, boardId: updatedBoardId } },
				});

				const boardInLastSent = lastSentBoards.some((board) => board.id === updatedBoardId);

				if (userHasAccess || boardInLastSent) {
					await sendBoards();
				}
			});
		});
	}),

	create: protectedProcedure.input(schema.create).mutation(async ({ input, ctx }) => {
		if (!ctx.user) throw new TRPCError({ message: Messages.UNAUTHORIZED, code: "UNAUTHORIZED" });
		const board = await prisma.board.create({
			data: {
				name: input.name,
				users: { create: { userId: ctx.user.id } },
			},
			include: { users: true },
		});
		publish("board", { data: board });
		return board.id;
	}),

	delete: protectedProcedure.input(schema.delete).mutation(async ({ input }) => {
		const board = await prisma.board.delete({ where: { id: input.boardId } });
		if (!board) throw new TRPCError({ message: "Board not found or already deleted", code: "NOT_FOUND" });
		publish("board", { data: board });
		return true;
	}),

	setName: protectedProcedure.input(schema.setName).mutation(async ({ input }) => {
		const updatedBoard = await prisma.board.update({
			where: { id: input.boardId },
			data: { name: input.newName },
		});
		if (!updatedBoard) throw new TRPCError({ message: Messages.BOARD_NOT_FOUND, code: "NOT_FOUND" });
		publish("board", { data: updatedBoard });
		return true;
	}),

	getUsers: protectedProcedure.input(schema.getUsers).query(async ({ input }) => {
		const { boardId } = input;
		return prisma.boardUsers.findMany({
			where: { boardId },
			select: { userId: false, user: { select: { id: true, username: true } } },
		});
	}),

	getUsersSub: protectedProcedure.input(schema.getUsers).subscription(({ input }) => {
		return observable<{ users: getBoardUsersSub[] }>((emit) => {
			const sendUsers = async () => {
				const users = await prisma.boardUsers.findMany({
					where: { boardId: input.boardId },
					select: { userId: false, user: { select: { id: true, username: true } } },
				});
				emit.next({ users });
			};

			sendUsers();

			return subscribe("board", async (value) => {
				if (value.data.id === input.boardId) await sendUsers();
			});
		});
	}),

	setUsers: protectedProcedure.input(schema.setUsers).mutation(async ({ input, ctx }) => {
		if (!ctx.user) throw new TRPCError({ message: Messages.UNAUTHORIZED, code: "UNAUTHORIZED" });
		await checkBoardAccess(ctx.user.id, input.boardId);

		await prisma.boardUsers.deleteMany({
			where: {
				boardId: input.boardId,
				userId: { not: ctx.user.id },
			},
		});

		const newUserIds = input.userIds.filter((id) => id !== ctx?.user?.id);
		await prisma.boardUsers.createMany({
			data: newUserIds.map((userId) => ({ userId, boardId: input.boardId })),
			skipDuplicates: true,
		});

		const updatedBoard = await prisma.board.findUnique({
			where: { id: input.boardId },
			include: { users: true },
		});

		if (updatedBoard) {
			publish("board", { data: updatedBoard });
		}

		return { success: true, message: "Board users have been updated" };
	}),

	manageUser: protectedProcedure.input(schema.manageUser).mutation(async ({ input }) => {
		const { boardId, userId, action } = input;

		const board = await prisma.board.findUnique({ where: { id: boardId } });
		if (!board) throw new TRPCError({ message: Messages.BOARD_NOT_FOUND, code: "NOT_FOUND" });

		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) throw new TRPCError({ message: Messages.USER_NOT_FOUND, code: "NOT_FOUND" });

		switch (action) {
			case "add": {
				await prisma.boardUsers.create({ data: { userId, boardId } });
				break;
			}
			case "remove": {
				await prisma.boardUsers.delete({ where: { userId_boardId: { userId, boardId } } });
				break;
			}
		}

		const updatedBoard = await prisma.board.findUnique({
			where: { id: boardId },
			include: { users: true },
		});

		if (updatedBoard) {
			publish("board", { data: updatedBoard });
		}

		return { success: true, message: "Board users have been updated" };
	}),
});
