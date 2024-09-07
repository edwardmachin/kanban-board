import type { Prisma, Task } from "@prisma/client";

export type getTaskSub = Task | null;

export type TaskWithDetails = Prisma.TaskGetPayload<{
	include: {
		list: true;
		assignedUsers: {
			include: {
				user: {
					select: {
						id: true;
						username: true;
					};
				};
			};
		};
		labels: true;
	};
}>;

export type FormattedTaskWithDetails = Omit<TaskWithDetails, "assignedUsers"> & {
	assignedUsers: {
		userId: number;
		username: string;
	}[];
};
