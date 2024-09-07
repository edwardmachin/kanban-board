import { prisma } from "@api/utils/prisma";
import { createTestBoard, createTestClient, createTestUser } from "@api/utils/tests";
import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";

describe("Task List Route", () => {
	let testUserId: number;
	let testBoardId: number;
	let testTaskListId: number;
	let client: ReturnType<typeof createTestClient>;

	beforeEach(async () => {
		client = createTestClient();

		const user = await createTestUser("testuser", "testpassword");
		testUserId = user.id;

		const board = await createTestBoard(testUserId, "testboard");
		testBoardId = board.id;

		const taskList = await prisma.taskList.create({
			data: {
				name: "Test Task List",
				board: { connect: { id: testBoardId } },
				order: 0,
			},
		});
		testTaskListId = taskList.id;

		const loginResponse = await client.user.login.mutate({ username: "testuser", password: "testpassword" });
		client = createTestClient({ Authorization: `Bearer ${loginResponse.token}` });
	});

	afterEach(async () => {
		await prisma.taskList.deleteMany();
		await prisma.board.deleteMany();
		await prisma.user.deleteMany();
	});

	test("Create a task list", async () => {
		const response = await client.taskList.create.mutate({ boardId: testBoardId, name: "New Task List" });
		expect(response).toBeDefined();
		expect(typeof response).toBe("number");
	});

	test("Get a task list", async () => {
		const response = await client.taskList.get.query({ id: testTaskListId });
		expect(response.id).toBe(testTaskListId);
		expect(response.name).toBe("Test Task List");
		expect(response.board).toBeDefined();
		expect(response.board.id).toBe(testBoardId);
	});

	test("Delete a task list", async () => {
		const response = await client.taskList.delete.mutate({ id: testTaskListId });
		expect(response).toBe(true);

		await expect(client.taskList.get.query({ id: testTaskListId })).rejects.toThrow();
	});

	test("Set task list name", async () => {
		const newName = "Updated Task List";
		const response = await client.taskList.setName.mutate({ id: testTaskListId, newName });
		expect(response).toBe(true);

		const updatedTaskList = await client.taskList.get.query({ id: testTaskListId });
		expect(updatedTaskList.name).toBe(newName);
	});

	test("Reorder task list", async () => {
		const newTaskList = await client.taskList.create.mutate({ boardId: testBoardId, name: "Another Task List" });

		const response = await client.taskList.reorder.mutate({ id: testTaskListId, newOrder: 2 });
		expect(response).toBeDefined();
		expect(response?.order).toBe(2);

		const otherTaskList = await client.taskList.get.query({ id: newTaskList });
		expect(otherTaskList.order).toBe(1);
	});

	test("Create task list with invalid name (too long)", async () => {
		const longName = "a".repeat(101);
		await expect(client.taskList.create.mutate({ boardId: testBoardId, name: longName })).rejects.toThrow();
	});

	test("Get a non-existent task list", async () => {
		await expect(client.taskList.get.query({ id: 9999 })).rejects.toThrow();
	});

	test("Delete a non-existent task list", async () => {
		await expect(client.taskList.delete.mutate({ id: 9999 })).rejects.toThrow();
	});

	test("Set name of a non-existent task list", async () => {
		await expect(client.taskList.setName.mutate({ id: 9999, newName: "New Name" })).rejects.toThrow();
	});

	test("Reorder a non-existent task list", async () => {
		await expect(client.taskList.reorder.mutate({ id: 9999, newOrder: 1 })).rejects.toThrow();
	});

	test("Create task list with invalid board ID", async () => {
		const invalidBoardId = 9999;
		await expect(client.taskList.create.mutate({ boardId: invalidBoardId, name: "Invalid List" })).rejects.toThrow();
	});
});
