import { AppContext, AppContextType } from "@ui/providers/AppProvider";
import { useContext } from "react";

export const useApp = (): AppContextType => {
	const context = useContext(AppContext);
	if (!context) {
		throw new Error("useApp must be used within an AppProvider");
	}
	return context;
};
