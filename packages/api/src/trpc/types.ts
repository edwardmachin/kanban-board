import type { User } from "@prisma/client";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { CreateWSSContextFnOptions } from "@trpc/server/adapters/ws";

type CreateContextOptions = CreateExpressContextOptions | CreateWSSContextFnOptions;

interface ContextType {
	req: CreateContextOptions["req"];
	res: CreateContextOptions["res"];
	token: string | null;
	user?: User | null;
}

type ProtectedContextType = ContextType & { user: NonNullable<ContextType["user"]> };

export type { ContextType, CreateContextOptions, ProtectedContextType };
