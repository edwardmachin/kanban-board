import { useAuth } from "@ui/hooks/useAuth";
import { trpc } from "@ui/utils/trpc";
import { useEffect, useCallback } from "react";

const REFRESH_THRESHOLD_MINUTES = 10;
const CHECK_INTERVAL = 60 * 1000;

const RefreshTokenTask = () => {
	const { mutateAsync: requestNewToken } = trpc.user.requestNewToken.useMutation();
	const { token, tokenData, setToken } = useAuth();

	const checkTokenExpiry = useCallback(async () => {
		if (!tokenData?.exp || typeof tokenData.exp !== "number") return;

		const expiresIn = tokenData.exp * 1000 - Date.now();
		if (expiresIn < REFRESH_THRESHOLD_MINUTES * 60 * 1000) {
			try {
				const { token: newToken } = await requestNewToken();
				setToken(newToken);
			} catch {
				setToken(null);
			}
		}
	}, [tokenData, requestNewToken, setToken]);

	useEffect(() => {
		if (!token || !tokenData?.exp) return;

		checkTokenExpiry();
		const intervalId = setInterval(checkTokenExpiry, CHECK_INTERVAL);
		return () => clearInterval(intervalId);
	}, [token, tokenData, checkTokenExpiry]);

	return null;
};

export default RefreshTokenTask;
