import type { AppRouter } from "@api/trpc/routes";
import { createTRPCReact } from "@trpc/react-query";

export const trpc = createTRPCReact<AppRouter>();
