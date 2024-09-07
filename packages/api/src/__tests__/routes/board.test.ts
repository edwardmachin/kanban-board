import { prisma } from "@api/utils/prisma";
import { createTestBoard, createTestClient, createTestUser } from "@api/utils/tests";
import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";

describe("Board Route", () => {
	let testUserId: number;
	let testBoardId: number;
	let client: ReturnType<typeof createTestClient>;

	beforeEach(async () => {
		client = createTestClient();

		const user = await createTestUser("testuser", "testpassword");
		testUserId = user.id;

		const board = await createTestBoard(testUserId, "testboard");
		testBoardId = board.id;

		const loginResponse = await client.user.login.mutate({ username: "testuser", password: "testpassword" });
		client = createTestClient({ Authorization: `Bearer ${loginResponse.token}` });
	});

	afterEach(async () => {
		await prisma.board.deleteMany();
		await prisma.user.deleteMany();
	});

	test("Create a board", async () => {
		const response = await client.board.create.mutate({ name: "newboard" });
		expect(response).toBeDefined();
		expect(typeof response).toBe("number");
	});

	test("Get a board", async () => {
		const response = await client.board.get.query({ boardId: testBoardId });
		expect(response.id).toBe(testBoardId);
		expect(response.name).toBe("testboard");
	});

	test("Get all boards", async () => {
		const response = await client.board.getAll.query();
		expect(Array.isArray(response)).toBe(true);
		expect(response.length).toBeGreaterThan(0);
		expect(response[0].id).toBe(testBoardId);
	});

	test("Delete a board", async () => {
		const response = await client.board.delete.mutate({ boardId: testBoardId });
		expect(response).toBe(true);

		await expect(client.board.get.query({ boardId: testBoardId })).rejects.toThrow();
	});

	test("Set board name", async () => {
		const newName = "updatedboard";
		const response = await client.board.setName.mutate({ boardId: testBoardId, newName });
		expect(response).toBe(true);

		const updatedBoard = await client.board.get.query({ boardId: testBoardId });
		expect(updatedBoard.name).toBe(newName);
	});

	test("Get board users", async () => {
		const response = await client.board.getUsers.query({ boardId: testBoardId });
		expect(Array.isArray(response)).toBe(true);
		expect(response.length).toBe(1);
		expect(response[0].user.id).toBe(testUserId);
	});

	test("Set board users", async () => {
		const newUser = await createTestUser("newuser", "newpassword");
		const response = await client.board.setUsers.mutate({ boardId: testBoardId, userIds: [testUserId, newUser.id] });
		expect(response.success).toBe(true);

		const updatedUsers = await client.board.getUsers.query({ boardId: testBoardId });
		expect(updatedUsers.length).toBe(2);
		expect(updatedUsers.some((u) => u.user.id === newUser.id)).toBe(true);
	});

	test("Add a user to the board", async () => {
		const newUser = await createTestUser("newuser", "newpassword");
		const response = await client.board.manageUser.mutate({ boardId: testBoardId, userId: newUser.id, action: "add" });
		expect(response.success).toBe(true);

		const updatedUsers = await client.board.getUsers.query({ boardId: testBoardId });
		expect(updatedUsers.length).toBe(2);
		expect(updatedUsers.some((u) => u.user.id === newUser.id)).toBe(true);
	});

	test("Remove a user from the board", async () => {
		const newUser = await createTestUser("newuser", "newpassword");
		await client.board.manageUser.mutate({ boardId: testBoardId, userId: newUser.id, action: "add" });

		const response = await client.board.manageUser.mutate({
			boardId: testBoardId,
			userId: newUser.id,
			action: "remove",
		});
		expect(response.success).toBe(true);

		const updatedUsers = await client.board.getUsers.query({ boardId: testBoardId });
		expect(updatedUsers.length).toBe(1);
		expect(updatedUsers.some((u) => u.user.id === newUser.id)).toBe(false);
	});

	test("Create a board with invalid name (too short)", async () => {
		await expect(client.board.create.mutate({ name: "" })).rejects.toThrow();
	});

	test("Create a board with invalid name (too long)", async () => {
		const longName = "a".repeat(101);
		await expect(client.board.create.mutate({ name: longName })).rejects.toThrow();
	});

	test("Get a non-existent board", async () => {
		await expect(client.board.get.query({ boardId: 9999 })).rejects.toThrow();
	});

	test("Delete a non-existent board", async () => {
		await expect(client.board.delete.mutate({ boardId: 9999 })).rejects.toThrow();
	});

	test("Set name of a non-existent board", async () => {
		await expect(client.board.setName.mutate({ boardId: 9999, newName: "newname" })).rejects.toThrow();
	});

	test("Get users of a non-existent board", async () => {
		const users = await client.board.getUsers.query({ boardId: 9999 });
		expect(users).toEqual([]);
	});

	test("Set users for a non-existent board", async () => {
		await expect(client.board.setUsers.mutate({ boardId: 9999, userIds: [testUserId] })).rejects.toThrow();
	});

	test("Add a non-existent user to the board", async () => {
		await expect(
			client.board.manageUser.mutate({ boardId: testBoardId, userId: 9999, action: "add" }),
		).rejects.toThrow();
	});

	test("Remove a non-existent user from the board", async () => {
		await expect(
			client.board.manageUser.mutate({ boardId: testBoardId, userId: 9999, action: "remove" }),
		).rejects.toThrow();
	});

	test("Get all boards when user has no boards", async () => {
		await prisma.boardUsers.deleteMany({ where: { userId: testUserId } });
		await prisma.board.deleteMany();

		const response = await client.board.getAll.query();
		expect(Array.isArray(response)).toBe(true);
		expect(response.length).toBe(0);
	});

	test("Set board name with invalid name (too short)", async () => {
		await expect(client.board.setName.mutate({ boardId: testBoardId, newName: "" })).rejects.toThrow();
	});

	test("Set board name with invalid name (too long)", async () => {
		const longName = "a".repeat(101);
		await expect(client.board.setName.mutate({ boardId: testBoardId, newName: longName })).rejects.toThrow();
	});

	test("Set users with empty user list", async () => {
		await expect(client.board.setUsers.mutate({ boardId: testBoardId, userIds: [] })).rejects.toThrow();
	});

	test("Attempt to remove the last user from a board", async () => {
		const response = await client.board.manageUser.mutate({
			boardId: testBoardId,
			userId: testUserId,
			action: "remove",
		});
		expect(response.success).toBe(true);

		const updatedUsers = await client.board.getUsers.query({ boardId: testBoardId });
		expect(updatedUsers.length).toBe(0);
	});
});
