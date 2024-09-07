import { HocuspocusProviderWebsocket } from "@hocuspocus/provider";
import env from "@ui/utils/env";
import { createContext, ReactNode, useEffect, useMemo, useRef } from "react";

interface HocuspocusContextProps {
	provider: HocuspocusProviderWebsocket;
}

export const HocuspocusContext = createContext<HocuspocusContextProps | null>(null);

interface HocuspocusTaskProviderProps {
	children: ReactNode;
}

export const HocuspocusTaskProviderComponent: React.FC<HocuspocusTaskProviderProps> = ({ children }) => {
	const providerRef = useRef<HocuspocusProviderWebsocket | null>(null);

	const provider = useMemo(() => {
		if (!providerRef.current) {
			providerRef.current = new HocuspocusProviderWebsocket({
				url: env.hocuspocus.ws,
			});
		}
		return providerRef.current;
	}, []);

	useEffect(() => {
		return () => {
			if (providerRef.current?.status === "connected") {
				providerRef.current.disconnect();
			}
		};
	}, []);

	const contextValue = useMemo(() => ({ provider }), [provider]);

	return <HocuspocusContext.Provider value={contextValue}>{children}</HocuspocusContext.Provider>;
};
