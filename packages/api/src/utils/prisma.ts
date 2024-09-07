import { PrismaClient } from "@prisma/client";

class PrismaSingleton {
	private static instance: PrismaClient;

	static getInstance(): PrismaClient {
		if (!this.instance) {
			this.instance = new PrismaClient();
			this.instance.$connect();
		}
		return this.instance;
	}
}

export const prisma = PrismaSingleton.getInstance();
