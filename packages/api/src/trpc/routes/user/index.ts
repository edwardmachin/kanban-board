import { protectedProcedure, publicProcedure, router } from "@api/trpc";
import { Messages, REGEX } from "@api/utils/constants";
import { genToken, verifyToken } from "@api/utils/jwt";
import logger from "@api/utils/logger";
import { prisma } from "@api/utils/prisma";
import type { User } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcrypt";
import { z } from "zod";

const schema = {
	register: z.object({
		username: z
			.string()
			.min(3, "Username must be at least 3 characters long")
			.max(30, "Username must not exceed 30 characters")
			.regex(REGEX.USERNAME, "Username can only contain letters, numbers, underscores, and hyphens"),
		password: z
			.string()
			.min(8, "Password must be at least 8 characters long")
			.max(100, "Password must not exceed 100 characters")
			.regex(
				REGEX.PASSWORD,
				"Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
			),
	}),
	login: z.object({
		username: z
			.string()
			.min(3, "Username must be at least 3 characters long")
			.max(30, "Username must not exceed 30 characters"),
		password: z
			.string()
			.min(8, "Password must be at least 8 characters long")
			.max(100, "Password must not exceed 100 characters"),
	}),
	validateToken: z.object({
		token: z.string().min(1, "Token is required").regex(REGEX.TOKEN, "Invalid token format"),
	}),
	fuzzySearch: z.object({
		query: z
			.string()
			.min(1, "Search query must not be empty")
			.max(50, "Search query must not exceed 50 characters")
			.regex(REGEX.FUZZY_SEARCH, "Search query can only contain letters, numbers, and spaces"),
		limit: z
			.number()
			.int("Limit must be an integer")
			.min(1, "Limit must be at least 1")
			.max(50, "Limit must not exceed 50")
			.default(10),
		excludeOwnUser: z.boolean().default(true),
	}),
	getUser: z.object({
		userId: z.number().int("User ID must be an integer").positive("User ID must be a positive number"),
	}),
	getUsers: z.object({
		userIds: z
			.array(z.number().int("User ID must be an integer").positive("User ID must be a positive number"))
			.nonempty("At least one user ID must be provided"),
	}),
	changePassword: z.object({
		currentPassword: z
			.string()
			.min(8, "Password must be at least 8 characters long")
			.max(100, "Password must not exceed 100 characters")
			.regex(
				REGEX.PASSWORD,
				"Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
			),
		newPassword: z
			.string()
			.min(8, "Password must be at least 8 characters long")
			.max(100, "Password must not exceed 100 characters")
			.regex(
				REGEX.PASSWORD,
				"Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
			),
		confirmPassword: z
			.string()
			.min(8, "Password must be at least 8 characters long")
			.max(100, "Password must not exceed 100 characters")
			.regex(
				REGEX.PASSWORD,
				"Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
			),
	}),
};

const findUserByUsername = async (username: string): Promise<User | null> => {
	return prisma.user.findUnique({
		where: { username },
	});
};

export default router({
	register: publicProcedure.input(schema.register).mutation(async ({ input }) => {
		const { username, password } = input;
		const userExists = await findUserByUsername(username);
		if (userExists) throw new TRPCError({ message: `User ${username} already exists`, code: "CONFLICT" });
		const hashedPassword = await bcrypt.hash(password, 10);
		const user = await prisma.user.create({
			data: {
				username,
				password: hashedPassword,
			},
		});
		const token = genToken(user);
		return { token };
	}),

	login: publicProcedure.input(schema.login).mutation(async ({ input }) => {
		const { username, password } = input;
		const user = await findUserByUsername(username);
		if (!user) throw new TRPCError({ message: `User ${username} does not exist`, code: "UNAUTHORIZED" });
		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) throw new TRPCError({ message: `Incorrect username or password`, code: "UNAUTHORIZED" });
		const token = genToken(user);
		return { token };
	}),
	validateToken: protectedProcedure.input(schema.validateToken).mutation(async ({ input }) => {
		const { token } = input;
		const payload = verifyToken(token);
		return { valid: true, payload };
	}),
	requestNewToken: protectedProcedure.mutation(async (opts) => {
		if (!opts.ctx.user)
			throw new TRPCError({ code: "NOT_FOUND", message: "Unable to find user when refreshing token" });
		const token = genToken(opts.ctx.user);
		return { token };
	}),
	fuzzySearch: protectedProcedure.input(schema.fuzzySearch).query(async ({ input, ctx }) => {
		const { query, limit, excludeOwnUser } = input;
		const userId = ctx?.user?.id;
		if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: Messages.UNAUTHORIZED });
		try {
			let users;
			if (excludeOwnUser) {
				users = await prisma.$queryRaw<{ id: number; username: string; similarity: number }[]>`
          SELECT id, username, similarity(username, ${query}) AS similarity
          FROM "User"
          WHERE similarity(username, ${query}) > 0.3
            AND id != ${userId}
          ORDER BY similarity DESC
          LIMIT ${limit}
        `;
			} else {
				users = await prisma.$queryRaw<{ id: number; username: string; similarity: number }[]>`
          SELECT id, username, similarity(username, ${query}) AS similarity
          FROM "User"
          WHERE similarity(username, ${query}) > 0.3
          ORDER BY similarity DESC
          LIMIT ${limit}
        `;
			}
			return users.map(({ id, username, similarity }) => ({
				id,
				username,
				similarity: Number(similarity),
			}));
		} catch (error) {
			console.log(error);
			logger.error("Error in fuzzy search:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "An error occurred while performing the fuzzy search. Please try again later.",
			});
		}
	}),
	getUser: protectedProcedure.input(schema.getUser).query(async ({ input }) => {
		const user = await prisma.user.findUnique({
			where: { id: input.userId },
			select: {
				id: true,
				username: true,
				createdAt: true,
				updatedAt: true,
			},
		});
		if (!user) throw new TRPCError({ message: `User not found`, code: "NOT_FOUND" });
		return user;
	}),
	getUsers: protectedProcedure.input(schema.getUsers).query(async ({ input }) => {
		const users = await prisma.user.findMany({
			where: { id: { in: input.userIds } },
			select: {
				id: true,
				username: true,
				createdAt: true,
				updatedAt: true,
			},
		});
		return users;
	}),
	changePassword: protectedProcedure.input(schema.changePassword).mutation(async ({ input, ctx }) => {
		const { currentPassword, newPassword, confirmPassword } = input;
		const userId = ctx.user?.id;

		if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: Messages.UNAUTHORIZED });
		if (newPassword !== confirmPassword)
			throw new TRPCError({ message: "Passwords do not match", code: "BAD_REQUEST" });

		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) throw new TRPCError({ message: "User not found", code: "NOT_FOUND" });

		const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
		if (!isPasswordValid) throw new TRPCError({ message: "Incorrect password", code: "UNAUTHORIZED" });

		const hashedPassword = await bcrypt.hash(newPassword, 10);
		await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
		return { success: true };
	}),
});
