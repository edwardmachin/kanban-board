import { HocuspocusContext } from "@ui/providers/HocuspocusProviderContext";
import { useContext } from "react";

export const useHocuspocusTaskProvider = () => {
	const context = useContext(HocuspocusContext);
	if (!context) {
		throw new Error("useHocuspocusTaskProvider must be used within a HocuspocusTaskProvider");
	}
	const { provider } = context;
	return provider;
};
