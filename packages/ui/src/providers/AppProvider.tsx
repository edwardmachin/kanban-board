import { createContext, ReactNode, useCallback, useMemo, useState } from "react";

interface TaskData {
	id: number;
	name: string;
	assignedUsers: string[];
	labels: string[];
}

interface AppContextType {
	sidebarContent: ReactNode;
	setSidebarContent: React.Dispatch<React.SetStateAction<ReactNode>>;
	tasksCache: Map<number, TaskData>;
	setTaskCacheEntry: (taskData: TaskData) => void;
	removeTaskCacheEntry: (id: number) => void;
	clearTaskCache: () => void;
}

export const AppContext = createContext<AppContextType | null>(null);

interface AppProviderProps {
	children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
	const [sidebarContent, setSidebarContent] = useState<ReactNode | null>(null);
	const [tasksCache, setTasksCache] = useState<Map<number, TaskData>>(() => new Map());

	const setTaskCacheEntry = useCallback((taskData: TaskData) => {
		setTasksCache((currentCache) => new Map(currentCache).set(taskData.id, taskData));
	}, []);

	const removeTaskCacheEntry = useCallback((id: number) => {
		setTasksCache((currentCache) => {
			const newCache = new Map(currentCache);
			newCache.delete(id);
			return newCache;
		});
	}, []);

	const clearTaskCache = useCallback(() => {
		setTasksCache(new Map());
	}, []);

	const value = useMemo<AppContextType>(
		() => ({
			sidebarContent,
			setSidebarContent,
			tasksCache,
			setTaskCacheEntry,
			removeTaskCacheEntry,
			clearTaskCache,
		}),
		[sidebarContent, tasksCache, setTaskCacheEntry, removeTaskCacheEntry, clearTaskCache],
	);

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export type { AppContextType, TaskData };
export default AppProvider;
