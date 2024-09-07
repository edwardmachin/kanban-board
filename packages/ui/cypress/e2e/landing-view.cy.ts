// cypress/e2e/landing-view.cy.ts
/// <reference types="cypress" />

describe("Landing View", () => {
	beforeEach(() => {
		cy.visit("/");
	});

	context("UI Elements", () => {
		it("displays the Taskonauts logo", () => {
			cy.get('img[alt="Taskonauts Logo"]').should("be.visible");
		});

		it("displays the welcome title", () => {
			cy.contains("h1", "Welcome").should("be.visible");
		});

		it("displays the instruction text", () => {
			cy.contains("Please login or register to get started.").should("be.visible");
		});

		it("displays login and register buttons", () => {
			cy.contains("button", "Login").should("be.visible");
			cy.contains("button", "Register").should("be.visible");
		});
	});

	context("Login Modal", () => {
		beforeEach(() => {
			cy.contains("button", "Login").click();
		});

		it("opens login modal when login button is clicked", () => {
			cy.contains("Login").should("be.visible");
		});

		it("displays username and password fields in login modal", () => {
			cy.get('input[placeholder="Your username"]').should("be.visible");
			cy.get('input[placeholder="Your password"]').should("be.visible").and("have.attr", "type", "password");
		});

		it("displays login button in modal", () => {
			cy.get(".mantine-Modal-content").contains("button", "Login").should("be.visible");
		});

		it("closes modal when clicking outside", () => {
			cy.get(".mantine-Modal-overlay").click({ force: true });
			cy.get(".mantine-Modal-content").should("not.exist");
		});
	});

	context("Register Modal", () => {
		beforeEach(() => {
			cy.contains("button", "Register").click();
		});

		it("opens register modal when register button is clicked", () => {
			cy.contains("Register").should("be.visible");
		});

		it("displays username and password fields in register modal", () => {
			cy.get('input[placeholder="Your username"]').should("be.visible");
			cy.get('input[placeholder="Your password"]').should("be.visible").and("have.attr", "type", "password");
		});

		it("displays register button in modal", () => {
			cy.get(".mantine-Modal-content").contains("button", "Register").should("be.visible");
		});

		it("closes modal when clicking outside", () => {
			cy.get(".mantine-Modal-overlay").click({ force: true });
			cy.get(".mantine-Modal-content").should("not.exist");
		});
	});

	context("Form Validation", () => {
		it("shows error for empty username in login", () => {
			cy.contains("button", "Login").click();
			cy.get(".mantine-Modal-content").contains("button", "Login").click();
			cy.contains("Username must be at least 3 characters long").should("be.visible");
		});

		it("shows error for empty password in login", () => {
			cy.contains("button", "Login").click();
			cy.get('input[placeholder="Your username"]').type("testuser");
			cy.get(".mantine-Modal-content").contains("button", "Login").click();
			cy.contains("Password must be at least 8 characters long").should("be.visible");
		});

		it("shows error for empty username in register", () => {
			cy.contains("button", "Register").click();
			cy.get(".mantine-Modal-content").contains("button", "Register").click();
			cy.contains("Username can only contain letters, numbers, underscores, and hyphens").should("be.visible");
		});

		it("shows error for empty password in register", () => {
			cy.contains("button", "Register").click();
			cy.get('input[placeholder="Your username"]').type("newuser");
			cy.get(".mantine-Modal-content").contains("button", "Register").click();
			cy.contains(
				"Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
			).should("be.visible");
		});
	});

	context("Responsiveness", () => {
		it("displays correctly on mobile viewport", () => {
			cy.viewport("iphone-x");
			cy.get('img[alt="Taskonauts Logo"]').should("be.visible");
			cy.contains("h1", "Welcome").should("be.visible");
			cy.contains("button", "Login").should("be.visible");
			cy.contains("button", "Register").should("be.visible");
		});

		it("displays correctly on tablet viewport", () => {
			cy.viewport("ipad-2");
			cy.get('img[alt="Taskonauts Logo"]').should("be.visible");
			cy.contains("h1", "Welcome").should("be.visible");
			cy.contains("button", "Login").should("be.visible");
			cy.contains("button", "Register").should("be.visible");
		});
	});
});
