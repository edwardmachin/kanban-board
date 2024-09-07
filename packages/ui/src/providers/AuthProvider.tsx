import { TokenPayload } from "@api/utils/jwt";
import { jwtDecode } from "jwt-decode";
import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from "react";

const TOKEN_STORAGE_KEY = "token";

interface AuthContextType {
	token: string | null;
	setToken: (token: string | null) => void;
	tokenData: TokenPayload | null;
	isAuthenticated: boolean;
	isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [token, setTokenState] = useState<string | null>(() => {
		return localStorage.getItem(TOKEN_STORAGE_KEY);
	});
	const [tokenData, setTokenData] = useState<TokenPayload | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const setToken = useCallback((newToken: string | null) => {
		setTokenState(newToken);
		if (newToken) {
			localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
		} else {
			localStorage.removeItem(TOKEN_STORAGE_KEY);
		}
	}, []);

	useEffect(() => {
		setIsLoading(false);
	}, []);

	useEffect(() => {
		if (token) {
			try {
				const decoded = jwtDecode(token) as TokenPayload;
				setTokenData(decoded);
			} catch {
				setTokenData(null);
				setToken(null);
			}
		} else {
			setTokenData(null);
		}
	}, [token, setToken]);

	const value = useMemo<AuthContextType>(
		() => ({
			token,
			setToken,
			tokenData,
			isAuthenticated: !!token,
			isLoading,
		}),
		[token, setToken, tokenData, isLoading],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export type { AuthContextType };
export default AuthProvider;
