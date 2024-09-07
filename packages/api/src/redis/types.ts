import type { Board, Task, TaskList } from "@prisma/client";

export type RedisSubscriptionKey = "task" | "list" | "board";

export type RedisSubscriptionData<T extends RedisSubscriptionKey> = {
	data: T extends "task" ? Task : T extends "list" ? TaskList : T extends "board" ? Board : never;
};
