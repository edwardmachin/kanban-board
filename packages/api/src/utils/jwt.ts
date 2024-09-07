import env from "@api/utils/env";
import { TRPCError } from "@trpc/server";
import type { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";

const TOKEN_EXPIRY = env.jwt.expiry;
const JWT_SECRET = env.jwt.secret;
if (!JWT_SECRET) {
	throw new Error("JWT_SECRET is not defined in environment variables");
}

interface TokenPayload extends JwtPayload {
	userId: number;
	username: string;
}

const genToken = (user: { id: number; username: string }): string => {
	return jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

const verifyToken = (token: string): TokenPayload => {
	try {
		return jwt.verify(token, JWT_SECRET) as TokenPayload;
	} catch (error) {
		throw new TRPCError({ message: "Invalid token", code: "UNAUTHORIZED" });
	}
};

export { genToken, verifyToken };
export type { TokenPayload };
