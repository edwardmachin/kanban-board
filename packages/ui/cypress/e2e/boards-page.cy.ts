// cypress/e2e/boards-view.cy.ts
/// <reference types="cypress" />

const username = `testuser`;
const password = "TestPassword123$";

describe("Boards View", () => {
	before(() => {
		//register
		cy.clearAllLocalStorage();
		cy.visit("/");
		cy.contains("button", "Register").click();
		cy.get('input[placeholder="Your username"]').type(username);
		cy.get('input[placeholder="Your password"]').type(password);
		cy.get(".mantine-Modal-content").contains("button", "Register").click();
		cy.contains("Boards", { timeout: 10000 }).should("be.visible");
	});

	beforeEach(() => {
		//login
		cy.clearAllLocalStorage();
		cy.visit("/");
		cy.contains("button", "Login").click();
		cy.get('input[placeholder="Your username"]').type(username);
		cy.get('input[placeholder="Your password"]').type(password);
		cy.get(".mantine-Modal-content").contains("button", "Login").click();
		cy.contains("Boards", { timeout: 10000 }).should("be.visible");
	});

	afterEach(() => {
		cy.clearAllLocalStorage();
	});

	it("displays the header with logo and user menu", () => {
		cy.get('img[alt="Taskonauts Logo Small"]').should("be.visible");
		cy.contains("Taskonauts").should("be.visible");
		cy.get(".mantine-Avatar-root").should("be.visible");
	});

	it("shows empty state when no boards exist", () => {
		cy.contains("No Boards").should("be.visible");
		cy.contains('Click the "+" button to create your first board').should("be.visible");
	});

	it("creates a new board", () => {
		const boardName = `Test Board ${Date.now()}`;
		cy.get('button[aria-label="Create Board"]').click();
		cy.get('input[placeholder="Board name"]').type(boardName);
		cy.contains("button", "Create").click();
		cy.contains(boardName).should("be.visible");
	});

	it("creates a new list in a board", () => {
		const listName = `Test List ${Date.now()}`;
		cy.get('button[aria-label="Add List"]').click();
		cy.get('input[placeholder="List name"]').type(listName);
		cy.contains("button", "Create").click();
		cy.contains(listName).should("be.visible");
	});

	it("creates a new task in a list", () => {
		const listName = `Test List ${Date.now()}`;
		const taskName = `Test Task ${Date.now()}`;
		cy.get('button[aria-label="Add List"]').click();
		cy.get('input[placeholder="List name"]').type(listName);
		cy.contains("button", "Create").click();
		cy.contains(listName).parent().find('button[aria-label="Add Task"]').click();
		cy.get('input[placeholder="Task Name"]').type(taskName);
		cy.contains("button", "Submit").click();
		cy.contains(taskName).should("be.visible");
	});

	it("opens task details modal", () => {
		const listName = `Test List ${Date.now()}`;
		const taskName = `Test Task ${Date.now()}`;
		cy.get('button[aria-label="Add List"]').click();
		cy.get('input[placeholder="List name"]').type(listName);
		cy.contains("button", "Create").click();
		cy.contains(listName).parent().find('button[aria-label="Add Task"]').click();
		cy.get('input[placeholder="Task Name"]').type(taskName);
		cy.contains("button", "Submit").click();
		cy.contains(taskName).click();
		cy.get(".mantine-Modal-title").should("contain", taskName);
	});

	it("assigns a member to a task", () => {
		const listName = `Test List ${Date.now()}`;
		const taskName = `Test Task ${Date.now()}`;
		cy.get('button[aria-label="Add List"]').click();
		cy.get('input[placeholder="List name"]').type(listName);
		cy.contains("button", "Create").click();
		cy.contains(listName).parent().find('button[aria-label="Add Task"]').click();
		cy.get('input[placeholder="Task Name"]').type(taskName);
		cy.contains("button", "Submit").click();
		cy.contains(taskName).click();
		cy.get(".mantine-MultiSelect-input").type(username);
		cy.get(".mantine-MultiSelect-dropdown").contains(username).click();
		cy.get(".mantine-Avatar-root").should("be.visible");
	});

	it("adds a label to a task", () => {
		const listName = `Test List ${Date.now()}`;
		const taskName = `Test Task ${Date.now()}`;
		const labelName = `Test Label ${Date.now()}`;
		cy.get('button[aria-label="Add List"]').click();
		cy.get('input[placeholder="List name"]').type(listName);
		cy.contains("button", "Create").click();
		cy.contains(listName).parent().find('button[aria-label="Add Task"]').click();
		cy.get('input[placeholder="Task Name"]').type(taskName);
		cy.contains("button", "Submit").click();
		cy.contains(taskName).click();
		cy.get(".mantine-TagsInput-input").type(`${labelName}{enter}`);
		cy.get(".mantine-Badge-root").contains(labelName).should("be.visible");
	});

	it("deletes a task", () => {
		const listName = `Test List ${Date.now()}`;
		const taskName = `Test Task ${Date.now()}`;
		cy.get('button[aria-label="Add List"]').click();
		cy.get('input[placeholder="List name"]').type(listName);
		cy.contains("button", "Create").click();
		cy.contains(listName).parent().find('button[aria-label="Add Task"]').click();
		cy.get('input[placeholder="Task Name"]').type(taskName);
		cy.contains("button", "Submit").click();
		cy.contains(taskName).rightclick();
		cy.contains("Delete").click();
		cy.contains(taskName).should("not.exist");
	});

	it("deletes a list", () => {
		const listName = `Test List ${Date.now()}`;
		cy.get('button[aria-label="Add List"]').click();
		cy.get('input[placeholder="List name"]').type(listName);
		cy.contains("button", "Create").click();
		cy.contains(listName).parent().find('button[aria-label="More Task Options"]').click();
		cy.contains("Delete List").click();
		cy.contains(listName).should("not.exist");
	});
});
