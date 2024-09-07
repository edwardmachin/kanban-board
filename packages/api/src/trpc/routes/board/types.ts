import type { Prisma } from "@prisma/client";

export type getBoardSub = Prisma.BoardGetPayload<{
	include: {
		lists: {
			select: {
				id: true;
				name: true;
				order: true;
				tasks: {
					select: {
						id: true;
						name: true;
						order: true;
						createdAt: true;
						updatedAt: true;
					};
					orderBy: {
						order: "asc";
					};
				};
			};
			orderBy: {
				order: "asc";
			};
		};
		users: {
			select: {
				user: {
					select: {
						id: true;
						username: true;
					};
				};
			};
		};
	};
}> | null;

export type getBoardUsersSub = {
	user: Prisma.UserGetPayload<{
		select: { id: true; username: true };
	}>;
};
