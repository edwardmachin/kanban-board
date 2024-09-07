import { prisma } from "@api/utils/prisma";
import {
	createTestBoard,
	createTestClient,
	createTestTask,
	createTestTaskList,
	createTestUser,
} from "@api/utils/tests";
import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";

describe("Task Route", () => {
	let testUserId: number;
	let testBoardId: number;
	let testTaskListId: number;
	let testTaskId: number;
	let client: ReturnType<typeof createTestClient>;

	beforeEach(async () => {
		client = createTestClient();

		const user = await createTestUser("testuser", "testpassword");
		testUserId = user.id;

		const board = await createTestBoard(testUserId, "testboard");
		testBoardId = board.id;

		const taskList = await createTestTaskList(testBoardId, "Test Task List");
		testTaskListId = taskList.id;

		const task = await createTestTask(testTaskListId, "Test Task");
		testTaskId = task.id;

		const loginResponse = await client.user.login.mutate({ username: "testuser", password: "testpassword" });
		client = createTestClient({ Authorization: `Bearer ${loginResponse.token}` });
	});

	afterEach(async () => {
		await prisma.task.deleteMany();
		await prisma.taskList.deleteMany();
		await prisma.board.deleteMany();
		await prisma.user.deleteMany();
	});

	test("Create a task", async () => {
		const response = await client.task.create.mutate({ listId: testTaskListId, name: "New Task" });
		expect(response).toBeDefined();
		expect(response.name).toBe("New Task");
		expect(response.listId).toBe(testTaskListId);
	});

	test("Get a task", async () => {
		const response = await client.task.get.query({ id: testTaskId });
		expect(response.id).toBe(testTaskId);
		expect(response.name).toBe("Test Task");
		expect(response.list).toBeDefined();
		expect(response.list.id).toBe(testTaskListId);
	});

	test("Delete a task", async () => {
		const response = await client.task.delete.mutate({ id: testTaskId });
		expect(response).toBe(true);

		await expect(client.task.get.query({ id: testTaskId })).rejects.toThrow();
	});

	test("Set task name", async () => {
		const newName = "Updated Task";
		const response = await client.task.setName.mutate({ id: testTaskId, newName });
		expect(response.name).toBe(newName);

		const updatedTask = await client.task.get.query({ id: testTaskId });
		expect(updatedTask.name).toBe(newName);
	});

	test("Get task name", async () => {
		const response = await client.task.getName.query({ id: testTaskId });
		expect(response).toBe("Test Task");
	});

	test("Move task to another list", async () => {
		const newTaskList = await createTestTaskList(testBoardId, "Another Task List");
		const response = await client.task.moveToList.mutate({ id: testTaskId, listId: newTaskList.id, newOrder: 0 });
		expect(response.listId).toBe(newTaskList.id);
		expect(response.order).toBe(0);
	});

	test("Reorder task", async () => {
		const response = await client.task.reorder.mutate({ id: testTaskId, newOrder: 1 });
		expect(response.order).toBe(1);
	});

	test("Set assigned users", async () => {
		const newUser = await createTestUser("newuser", "newpassword");
		const response = await client.task.setAssignedUsers.mutate({ id: testTaskId, usernames: ["testuser", "newuser"] });
		expect(response.assignedUsers.length).toBe(2);
		expect(response.assignedUsers.some((u) => u.username === "testuser")).toBe(true);
		expect(response.assignedUsers.some((u) => u.username === "newuser")).toBe(true);
	});

	test("Set labels", async () => {
		const response = await client.task.setLabels.mutate({ id: testTaskId, labelNames: ["Important", "Urgent"] });
		expect(response.labels.length).toBe(2);
		expect(response.labels.some((l) => l.name === "Important")).toBe(true);
		expect(response.labels.some((l) => l.name === "Urgent")).toBe(true);
	});

	test("Create a task with invalid name (too long)", async () => {
		const longName = "a".repeat(201);
		await expect(client.task.create.mutate({ listId: testTaskListId, name: longName })).rejects.toThrow();
	});

	test("Get a non-existent task", async () => {
		await expect(client.task.get.query({ id: 9999 })).rejects.toThrow();
	});

	test("Delete a non-existent task", async () => {
		await expect(client.task.delete.mutate({ id: 9999 })).rejects.toThrow();
	});

	test("Set name of a non-existent task", async () => {
		await expect(client.task.setName.mutate({ id: 9999, newName: "New Name" })).rejects.toThrow();
	});

	test("Move a non-existent task", async () => {
		await expect(client.task.moveToList.mutate({ id: 9999, listId: testTaskListId, newOrder: 0 })).rejects.toThrow();
	});

	test("Reorder a non-existent task", async () => {
		await expect(client.task.reorder.mutate({ id: 9999, newOrder: 1 })).rejects.toThrow();
	});

	test("Set assigned users for a non-existent task", async () => {
		await expect(client.task.setAssignedUsers.mutate({ id: 9999, usernames: ["testuser"] })).rejects.toThrow();
	});

	test("Set labels for a non-existent task", async () => {
		await expect(client.task.setLabels.mutate({ id: 9999, labelNames: ["Important"] })).rejects.toThrow();
	});

	test("Move task to a non-existent list", async () => {
		await expect(client.task.moveToList.mutate({ id: testTaskId, listId: 9999, newOrder: 0 })).rejects.toThrow();
	});

	test("Set assigned users with non-existent usernames", async () => {
		const initialTask = await client.task.get.query({ id: testTaskId });
		expect(initialTask.assignedUsers.length).toBe(0);

		const updatedTask = await client.task.setAssignedUsers.mutate({
			id: testTaskId,
			usernames: ["nonexistentuser"],
		});

		expect(updatedTask.assignedUsers.length).toBe(0);

		const finalTask = await client.task.get.query({ id: testTaskId });
		expect(finalTask.assignedUsers.length).toBe(0);
	});

	test("Create multiple tasks and check order", async () => {
		const task1 = await client.task.create.mutate({ listId: testTaskListId, name: "Task 1" });
		const task2 = await client.task.create.mutate({ listId: testTaskListId, name: "Task 2" });
		const task3 = await client.task.create.mutate({ listId: testTaskListId, name: "Task 3" });

		expect(task1.order).toBe(1);
		expect(task2.order).toBe(2);
		expect(task3.order).toBe(3);
	});

	test("Reorder multiple tasks", async () => {
		const task1 = await client.task.create.mutate({ listId: testTaskListId, name: "Task 1" });
		const task2 = await client.task.create.mutate({ listId: testTaskListId, name: "Task 2" });

		await client.task.reorder.mutate({ id: task1.id, newOrder: 2 });

		const updatedTask1 = await client.task.get.query({ id: task1.id });
		const updatedTask2 = await client.task.get.query({ id: task2.id });

		expect(updatedTask1.order).toBe(2);
		expect(updatedTask2.order).toBe(1);
	});

	test("Move task between lists", async () => {
		const newTaskList = await createTestTaskList(testBoardId, "New Task List");

		const movedTask = await client.task.moveToList.mutate({
			id: testTaskId,
			listId: newTaskList.id,
			newOrder: 0,
		});

		expect(movedTask.listId).toBe(newTaskList.id);
		expect(movedTask.order).toBe(0);

		const tasksInOriginalList = await prisma.task.findMany({ where: { listId: testTaskListId } });
		expect(tasksInOriginalList.length).toBe(0);

		const tasksInNewList = await prisma.task.findMany({ where: { listId: newTaskList.id } });
		expect(tasksInNewList.length).toBe(1);
	});

	test("Set and update labels", async () => {
		await client.task.setLabels.mutate({ id: testTaskId, labelNames: ["Important", "Urgent"] });

		let updatedTask = await client.task.get.query({ id: testTaskId });
		expect(updatedTask.labels.length).toBe(2);
		expect(updatedTask.labels.some((l) => l.name === "Important")).toBe(true);
		expect(updatedTask.labels.some((l) => l.name === "Urgent")).toBe(true);

		await client.task.setLabels.mutate({ id: testTaskId, labelNames: ["Important", "Low Priority"] });

		updatedTask = await client.task.get.query({ id: testTaskId });
		expect(updatedTask.labels.length).toBe(2);
		expect(updatedTask.labels.some((l) => l.name === "Important")).toBe(true);
		expect(updatedTask.labels.some((l) => l.name === "Low Priority")).toBe(true);
		expect(updatedTask.labels.some((l) => l.name === "Urgent")).toBe(false);
	});

	test("Cleanup unused labels", async () => {
		await client.task.setLabels.mutate({ id: testTaskId, labelNames: ["Temp Label"] });
		await client.task.setLabels.mutate({ id: testTaskId, labelNames: [] });

		const labels = await prisma.label.findMany();
		expect(labels.length).toBe(0);
	});

	test("Set assigned users and update", async () => {
		await createTestUser("user1", "password1");
		await createTestUser("user2", "password2");

		await client.task.setAssignedUsers.mutate({ id: testTaskId, usernames: ["user1", "user2"] });

		let updatedTask = await client.task.get.query({ id: testTaskId });
		expect(updatedTask.assignedUsers.length).toBe(2);
		expect(updatedTask.assignedUsers.some((u) => u.username === "user1")).toBe(true);
		expect(updatedTask.assignedUsers.some((u) => u.username === "user2")).toBe(true);

		await client.task.setAssignedUsers.mutate({ id: testTaskId, usernames: ["user1"] });

		updatedTask = await client.task.get.query({ id: testTaskId });
		expect(updatedTask.assignedUsers.length).toBe(1);
		expect(updatedTask.assignedUsers.some((u) => u.username === "user1")).toBe(true);
		expect(updatedTask.assignedUsers.some((u) => u.username === "user2")).toBe(false);
	});
});
