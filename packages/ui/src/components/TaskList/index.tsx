import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import {
	ActionIcon,
	Button,
	Card,
	Flex,
	Group,
	Menu,
	Modal,
	rem,
	ScrollArea,
	TextInput,
	Title,
	Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconCheck, IconDots, IconEdit, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import CenteredLoader from "@ui/components/CenteredLoader";
import Task from "@ui/components/Task";
import { trpc } from "@ui/utils/trpc";
import { memo, useCallback, useMemo, useState } from "react";

interface TaskListProps {
	id: number;
}

interface TaskListData {
	id: number;
	tasks: { id: number }[];
	name: string;
	createdAt: string;
	updatedAt: string;
	boardId: number;
}

const TaskList: React.FC<TaskListProps> = ({ id }) => {
	const [createTaskModelOpened, { open: openTaskModel, close: closeTaskModel }] = useDisclosure(false);
	const [taskList, setTaskList] = useState<TaskListData | null>(null);
	const [contextMenuOpen, setContextMenuOpen] = useState(false);
	const [isRenaming, setIsRenaming] = useState(false);
	const [newListName, setNewListName] = useState("");

	const createTaskMutation = trpc.task.create.useMutation();
	const deleteListMutation = trpc.taskList.delete.useMutation();
	const renameListMutation = trpc.taskList.setName.useMutation();

	const createTaskForm = useForm({
		initialValues: { name: "" },
		validate: {
			name: (value) => (value.trim().length < 2 ? "Task Name must be at least 2 characters" : null),
		},
	});

	trpc.taskList.getSub.useSubscription(
		{ id },
		{
			onData: useCallback((newTaskList) => {
				setTaskList(newTaskList);
			}, []),
		},
	);
	const { setNodeRef } = useDroppable({ id: `list-${id}` });

	const handleSubmit = useCallback(
		(event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			createTaskForm.onSubmit((values) => {
				closeTaskModel();
				createTaskForm.reset();
				createTaskMutation.mutateAsync({ name: values.name, listId: id });
			})();
		},
		[createTaskForm, closeTaskModel, createTaskMutation, id],
	);

	const handleDeleteList = useCallback(() => {
		deleteListMutation.mutateAsync({ id });
	}, [deleteListMutation, id]);

	const handleRenameClick = useCallback(() => {
		setIsRenaming(true);
		setNewListName(taskList?.name || "");
		setContextMenuOpen(false);
	}, [taskList]);

	const handleRenameSubmit = useCallback(() => {
		renameListMutation.mutateAsync({ id: id, newName: newListName });
		setIsRenaming(false);
	}, [id, newListName, renameListMutation]);

	const handleCancelRename = useCallback(() => {
		setIsRenaming(false);
		setNewListName("");
	}, []);

	const sortableItems = useMemo(() => taskList?.tasks.map((task) => task.id) || [], [taskList]);

	if (!taskList) {
		return (
			<Card
				shadow="sm"
				padding="lg"
				radius="md"
				withBorder
				style={{
					margin: "10px 25px",
					minWidth: "350px",
					height: "200px",
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				<CenteredLoader />
			</Card>
		);
	}

	return (
		<>
			<Modal
				opened={createTaskModelOpened}
				onClose={closeTaskModel}
				title="Add Task"
				shadow="md"
				keepMounted={false}
				overlayProps={{
					backgroundOpacity: 0.5,
				}}
			>
				<form onSubmit={handleSubmit}>
					<TextInput {...createTaskForm.getInputProps("name")} placeholder="Task Name" />
					<Group justify="flex-end" mt="md">
						<Button type="submit">Submit</Button>
					</Group>
				</form>
			</Modal>

			<Card
				withBorder
				ref={setNodeRef}
				shadow="sm"
				padding="lg"
				radius="md"
				style={{
					margin: "10px 25px",
					minWidth: "400px",
					maxWidth: "400px",
					userSelect: "none",
				}}
			>
				<Flex justify="space-between" align="center" mb="md">
					{isRenaming ? (
						<TextInput
							value={newListName}
							onChange={(event) => setNewListName(event.currentTarget.value)}
							style={{ flex: 1, paddingRight: "5px" }}
							rightSection={
								<ActionIcon variant="subtle" onClick={handleRenameSubmit}>
									<IconCheck size="1.125rem" />
								</ActionIcon>
							}
							onKeyUp={(event) => {
								switch (event.key) {
									case "Enter":
										handleRenameSubmit();
										break;
									case "Escape":
										handleCancelRename();
										break;
								}
							}}
						/>
					) : (
						<Title order={3}>{taskList.name}</Title>
					)}
					<ActionIcon.Group>
						<Tooltip label="Add Task">
							<ActionIcon aria-label="Add Task" variant="light" onClick={openTaskModel} loading={createTaskModelOpened}>
								<IconPlus size="1.125rem" />
							</ActionIcon>
						</Tooltip>

						<Menu
							shadow="md"
							position="bottom"
							offset={7}
							withArrow
							opened={contextMenuOpen}
							onClose={() => setContextMenuOpen(false)}
						>
							<Menu.Target>
								<Tooltip label="More">
									<ActionIcon
										aria-label="More Task Options"
										variant="light"
										onClick={() => setContextMenuOpen((current) => !current)}
									>
										<IconDots size="1.125rem" />
									</ActionIcon>
								</Tooltip>
							</Menu.Target>
							<Menu.Dropdown>
								{isRenaming ? (
									<Menu.Item
										onClick={handleCancelRename}
										leftSection={<IconX style={{ width: rem(14), height: rem(14) }} />}
										color="yellow"
									>
										Cancel Rename
									</Menu.Item>
								) : (
									<Menu.Item
										onClick={handleRenameClick}
										leftSection={<IconEdit style={{ width: rem(14), height: rem(14) }} />}
									>
										Rename List
									</Menu.Item>
								)}
								<Menu.Item
									color="red"
									onClick={handleDeleteList}
									leftSection={<IconTrash style={{ width: rem(14), height: rem(14) }} />}
								>
									Delete List
								</Menu.Item>
							</Menu.Dropdown>
						</Menu>
					</ActionIcon.Group>
				</Flex>
				<ScrollArea.Autosize type="scroll">
					<SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
						{taskList.tasks.map((task) => (
							<Task key={task.id} id={task.id} boardId={taskList.boardId} />
						))}
					</SortableContext>
				</ScrollArea.Autosize>
			</Card>
		</>
	);
};

const MemoizedTaskList = memo(TaskList, (prevProps, nextProps) => prevProps.id === nextProps.id);
export default MemoizedTaskList;
