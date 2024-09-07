import { REGEX } from "@api/utils/constants";
import { prisma } from "@api/utils/prisma";
import { createTestClient, createTestUser } from "@api/utils/tests";
import { describe, expect, test } from "@jest/globals";

describe("User Route", () => {
	const testPassword = "Password123!";
	let testUserId: number;

	beforeEach(async () => {
		await prisma.user.deleteMany();
		const createdUser = await createTestUser("testuser", testPassword);
		testUserId = createdUser.id;
	});

	afterEach(async () => {
		await prisma.user.deleteMany();
	});

	test("Register a new user", async () => {
		const client = createTestClient();
		const response = await client.user.register.mutate({
			username: "newuser",
			password: "NewPassword123!",
		});
		expect(response).toHaveProperty("token");
		expect(typeof response.token).toBe("string");
		expect(response.token.length).toBeGreaterThan(0);
		expect(response.token).toMatch(REGEX.TOKEN);
	});

	test("Register with existing username should fail", async () => {
		const client = createTestClient();
		await expect(
			client.user.register.mutate({
				username: "testuser",
				password: "AnotherPassword123!",
			}),
		).rejects.toThrow("User testuser already exists");
	});

	test("Login with correct credentials", async () => {
		const client = createTestClient();
		const response = await client.user.login.mutate({
			username: "testuser",
			password: testPassword,
		});
		expect(response).toHaveProperty("token");
		expect(typeof response.token).toBe("string");
		expect(response.token.length).toBeGreaterThan(0);
		expect(response.token).toMatch(REGEX.TOKEN);
	});

	test("Login with incorrect password", async () => {
		const client = createTestClient();
		await expect(
			client.user.login.mutate({
				username: "testuser",
				password: "wrongpassword",
			}),
		).rejects.toThrow("Incorrect username or password");
	});

	test("Login with non-existent user", async () => {
		const client = createTestClient();
		await expect(
			client.user.login.mutate({
				username: "nonexistentuser",
				password: "somepassword",
			}),
		).rejects.toThrow("User nonexistentuser does not exist");
	});

	test("Validate token", async () => {
		const client = createTestClient();
		const loginResponse = await client.user.login.mutate({
			username: "testuser",
			password: testPassword,
		});
		const authedClient = createTestClient({
			Authorization: `Bearer ${loginResponse.token}`,
		});
		const validationResponse = await authedClient.user.validateToken.mutate({ token: loginResponse.token });
		expect(validationResponse).toHaveProperty("valid", true);
		expect(validationResponse).toHaveProperty("payload");
	});

	test("Fuzzy search users", async () => {
		const client = createTestClient();
		await createTestUser("user1", "Password123!");
		await createTestUser("user2", "Password123!");
		await createTestUser("diffuser", "Password123!");

		const loginResponse = await client.user.login.mutate({
			username: "testuser",
			password: testPassword,
		});
		const authedClient = createTestClient({
			Authorization: `Bearer ${loginResponse.token}`,
		});
		const response = await authedClient.user.fuzzySearch.query({ query: "user", limit: 10, excludeOwnUser: false });
		expect(Array.isArray(response)).toBe(true);
		expect(response.length).toBe(2);
		expect(response[0]).toHaveProperty("id");
		expect(response[0]).toHaveProperty("username");
		expect(response[0]).toHaveProperty("similarity");
		expect(response.map((u) => u.username)).toContain("user1");
		expect(response.map((u) => u.username)).toContain("user2");
		expect(response.map((u) => u.username)).not.toContain("diffuser");
	});

	test("Get user by ID", async () => {
		const client = createTestClient();
		const loginResponse = await client.user.login.mutate({
			username: "testuser",
			password: testPassword,
		});
		const authedClient = createTestClient({
			Authorization: `Bearer ${loginResponse.token}`,
		});
		const response = await authedClient.user.getUser.query({ userId: testUserId });
		expect(response).toHaveProperty("id", testUserId);
		expect(response).toHaveProperty("username", "testuser");
		expect(response).toHaveProperty("createdAt");
		expect(response).toHaveProperty("updatedAt");
	});

	test("Get multiple users", async () => {
		const user1 = await createTestUser("user1", "Password123!");
		const user2 = await createTestUser("user2", "Password123!");

		const client = createTestClient();
		const loginResponse = await client.user.login.mutate({
			username: "testuser",
			password: testPassword,
		});
		const authedClient = createTestClient({
			Authorization: `Bearer ${loginResponse.token}`,
		});
		const response = await authedClient.user.getUsers.query({ userIds: [testUserId, user1.id, user2.id] });
		expect(Array.isArray(response)).toBe(true);
		expect(response.length).toBe(3);
		expect(response.map((u) => u.username)).toContain("testuser");
		expect(response.map((u) => u.username)).toContain("user1");
		expect(response.map((u) => u.username)).toContain("user2");
	});

	test("Change password", async () => {
		const client = createTestClient();
		const loginResponse = await client.user.login.mutate({
			username: "testuser",
			password: testPassword,
		});
		const authedClient = createTestClient({
			Authorization: `Bearer ${loginResponse.token}`,
		});
		const response = await authedClient.user.changePassword.mutate({
			currentPassword: testPassword,
			newPassword: "NewPassword123!",
			confirmPassword: "NewPassword123!",
		});
		expect(response).toHaveProperty("success", true);

		// Verify old password no longer works
		await expect(
			client.user.login.mutate({
				username: "testuser",
				password: testPassword,
			}),
		).rejects.toThrow("Incorrect username or password");

		// Verify new password works
		const newLoginResponse = await client.user.login.mutate({
			username: "testuser",
			password: "NewPassword123!",
		});
		expect(newLoginResponse).toHaveProperty("token");
	});

	test("Request new token", async () => {
		const client = createTestClient();
		const loginResponse = await client.user.login.mutate({
			username: "testuser",
			password: testPassword,
		});
		const authedClient = createTestClient({
			Authorization: `Bearer ${loginResponse.token}`,
		});
		const response = await authedClient.user.requestNewToken.mutate();
		expect(response).toHaveProperty("token");
		expect(typeof response.token).toBe("string");
		expect(response.token.length).toBeGreaterThan(0);
		expect(response.token).toMatch(REGEX.TOKEN);
	});
	test("Register with invalid username", async () => {
		const client = createTestClient();
		await expect(
			client.user.register.mutate({
				username: "u", // Too short
				password: "ValidPassword123!",
			}),
		).rejects.toThrow("Username must be at least 3 characters long");

		await expect(
			client.user.register.mutate({
				username: "invalid_username!", // Contains invalid character
				password: "ValidPassword123!",
			}),
		).rejects.toThrow("Username can only contain letters, numbers, underscores, and hyphens");
	});

	test("Register with invalid password", async () => {
		const client = createTestClient();
		await expect(
			client.user.register.mutate({
				username: "validuser",
				password: "short", // Too short
			}),
		).rejects.toThrow("Password must be at least 8 characters long");

		await expect(
			client.user.register.mutate({
				username: "validuser",
				password: "onlylowercase", // Doesn't meet complexity requirements
			}),
		).rejects.toThrow(
			"Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
		);
	});

	test("Fuzzy search with empty query", async () => {
		const client = createTestClient();
		const loginResponse = await client.user.login.mutate({
			username: "testuser",
			password: testPassword,
		});
		const authedClient = createTestClient({
			Authorization: `Bearer ${loginResponse.token}`,
		});
		await expect(authedClient.user.fuzzySearch.query({ query: "", limit: 10 })).rejects.toThrow(
			"Search query must not be empty",
		);
	});

	test("Get user by non-existent ID", async () => {
		const client = createTestClient();
		const loginResponse = await client.user.login.mutate({
			username: "testuser",
			password: testPassword,
		});
		const authedClient = createTestClient({
			Authorization: `Bearer ${loginResponse.token}`,
		});
		await expect(
			authedClient.user.getUser.query({ userId: 9999 }), // Assuming 9999 is a non-existent user ID
		).rejects.toThrow("User not found");
	});

	test("Change password with incorrect current password", async () => {
		const client = createTestClient();
		const loginResponse = await client.user.login.mutate({
			username: "testuser",
			password: testPassword,
		});
		const authedClient = createTestClient({
			Authorization: `Bearer ${loginResponse.token}`,
		});
		await expect(
			authedClient.user.changePassword.mutate({
				currentPassword: "WrongPassword123!",
				newPassword: "NewPassword123!",
				confirmPassword: "NewPassword123!",
			}),
		).rejects.toThrow("Incorrect password");
	});

	test("Change password with mismatched new passwords", async () => {
		const client = createTestClient();
		const loginResponse = await client.user.login.mutate({
			username: "testuser",
			password: testPassword,
		});
		const authedClient = createTestClient({
			Authorization: `Bearer ${loginResponse.token}`,
		});
		await expect(
			authedClient.user.changePassword.mutate({
				currentPassword: testPassword,
				newPassword: "NewPassword123!",
				confirmPassword: "DifferentPassword123!",
			}),
		).rejects.toThrow("Passwords do not match");
	});

	test("Validate token with invalid format", async () => {
		const client = createTestClient();
		const loginResponse = await client.user.login.mutate({
			username: "testuser",
			password: testPassword,
		});
		const authedClient = createTestClient({
			Authorization: `Bearer ${loginResponse.token}`,
		});
		await expect(authedClient.user.validateToken.mutate({ token: "invalid-token-format" })).rejects.toThrow(
			"Invalid token format",
		);
	});

	test("Fuzzy search with limit exceeding maximum", async () => {
		const client = createTestClient();
		const loginResponse = await client.user.login.mutate({
			username: "testuser",
			password: testPassword,
		});
		const authedClient = createTestClient({
			Authorization: `Bearer ${loginResponse.token}`,
		});
		await expect(authedClient.user.fuzzySearch.query({ query: "user", limit: 100 })).rejects.toThrow(
			"Limit must not exceed 50",
		);
	});

	test("Fuzzy search with special characters", async () => {
		const client = createTestClient();
		const loginResponse = await client.user.login.mutate({
			username: "testuser",
			password: testPassword,
		});
		const authedClient = createTestClient({
			Authorization: `Bearer ${loginResponse.token}`,
		});
		await expect(authedClient.user.fuzzySearch.query({ query: "user@123$", limit: 10 })).rejects.toThrow(
			"Search query can only contain letters, numbers, and spaces",
		);
	});
});
