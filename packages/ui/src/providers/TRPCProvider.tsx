import { MantineProvider } from "@mantine/core";
import { Notifications, showNotification, updateNotification } from "@mantine/notifications";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createWSClient, httpBatchLink, splitLink, TRPCClientError, wsLink } from "@trpc/client";
import { useAuth } from "@ui/hooks/useAuth";
import env from "@ui/utils/env";
import { trpc } from "@ui/utils/trpc";
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

interface TRPCProps {
	children: ReactNode;
}

const TRPCProvider: React.FC<TRPCProps> = ({ children }) => {
	const navigate = useNavigate();
	const { token } = useAuth();
	const [connectionState, setConnectionState] = useState<"connected" | "disconnected" | "error">("connected");
	const wsClientRef = useRef<ReturnType<typeof createWSClient> | null>(null);
	const reconnectAttempts = useRef(0);
	const notificationId = "connection-status";

	const handleUnauthorizedError = useCallback(
		(error: unknown) => {
			if (
				error instanceof TRPCClientError &&
				error.data?.code === "UNAUTHORIZED" &&
				error.message === "Protected Middleware Rejection"
			) {
				navigate("/logout");
			}
		},
		[navigate],
	);

	const queryClient = useMemo(
		() =>
			new QueryClient({
				mutationCache: new MutationCache({ onError: handleUnauthorizedError }),
				queryCache: new QueryCache({ onError: handleUnauthorizedError }),
			}),
		[handleUnauthorizedError],
	);

	const trpcClient = useMemo(() => {
		const wsClient = createWSClient({
			url: env.api.ws,
			WebSocket: class extends WebSocket {
				constructor(url: string | URL, protocols?: string | string[]) {
					const urlWithToken = `${url}?token=${encodeURIComponent(token ?? "")}`;
					super(urlWithToken, protocols);

					this.addEventListener("error", (event) => {
						console.error("WebSocket connection error:", event);
						setConnectionState("error");
						showNotification({
							id: notificationId,
							color: "red",
							title: "Connection Error",
							message: "An error occurred with the WebSocket connection. Attempting to reconnect...",
							autoClose: false,
						});
					});
				}
			},
			onOpen: () => {
				console.log("WebSocket connection established");
				setConnectionState("connected");
				reconnectAttempts.current = 0;
				updateNotification({
					id: notificationId,
					color: "green",
					title: "Connection Established",
					message: "WebSocket connection has been successfully established.",
					autoClose: 3000,
				});
			},
			onClose: (cause) => {
				console.log(`WebSocket connection closed. ${cause?.code ? `Code: ${cause.code}` : ""}`);
				setConnectionState("disconnected");
				showNotification({
					id: notificationId,
					color: "yellow",
					title: "Connection Lost",
					message: "WebSocket connection has been lost. Attempting to reconnect...",
					autoClose: false,
				});
			},
		});

		wsClientRef.current = wsClient;

		return trpc.createClient({
			links: [
				splitLink({
					condition: (op) => op.type === "subscription",
					true: wsLink({ client: wsClient }),
					false: httpBatchLink({
						url: env.api.http,
						headers: () => ({
							authorization: token ? `Bearer ${token}` : "",
						}),
					}),
				}),
			],
		});
	}, [token]);

	useEffect(() => {
		const attemptReconnect = () => {
			if (connectionState !== "connected" && wsClientRef.current) {
				console.log(`Attempting to reconnect (Attempt ${reconnectAttempts.current + 1})`);
				wsClientRef.current.reconnect();
				reconnectAttempts.current += 1;

				if (reconnectAttempts.current > 5) {
					console.log("Max reconnection attempts reached. Please check your network or server status.");
					updateNotification({
						id: notificationId,
						color: "red",
						title: "Reconnection Failed",
						message: "Max reconnection attempts reached. Please check your network or server status.",
						autoClose: false,
					});
				}
			}
		};

		const intervalId = setInterval(attemptReconnect, 5000);

		return () => clearInterval(intervalId);
	}, [connectionState]);

	return (
		<MantineProvider>
			<Notifications />
			<trpc.Provider client={trpcClient} queryClient={queryClient}>
				<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
			</trpc.Provider>
		</MantineProvider>
	);
};

export default TRPCProvider;
