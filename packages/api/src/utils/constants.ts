export const Messages = {
	UNAUTHORIZED: "Unauthorized",
	TASK_LIST_NOT_FOUND: "Task List not found",
	TASK_NOT_FOUND: "Task not found",
	BOARD_NOT_FOUND: "Board not found",
	BOARD_NO_ACCESS: "You don't have access to this board",
	USER_NOT_FOUND: "User not found",
};

export const REGEX = {
	PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?£€~`])(?=.{8,100})/,
	USERNAME: /^[a-zA-Z0-9_-]+$/,
	TOKEN: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/,
	FUZZY_SEARCH: /^[a-zA-Z0-9\s]*$/,
};
