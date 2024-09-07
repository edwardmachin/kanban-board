import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	ActionIcon,
	Avatar,
	Badge,
	Card,
	Flex,
	Group,
	Menu,
	Modal,
	MultiSelect,
	Stack,
	TagsInput,
	TextInput,
	Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCheck, IconEdit, IconTrash, IconUser } from "@tabler/icons-react";
import CenteredLoader from "@ui/components/CenteredLoader";
import TaskTextEditor from "@ui/components/TaskTextEditor";
import { useApp } from "@ui/hooks/useApp";
import { useAuth } from "@ui/hooks/useAuth";
import { HocuspocusTaskProviderComponent } from "@ui/providers/HocuspocusProviderContext";
import { trpc } from "@ui/utils/trpc";
import { memo, useCallback, useMemo, useState } from "react";

interface TaskProps {
	id: number;
	boardId: number;
}

interface TaskData {
	id: number;
	name: string;
	createdAt: string;
	updatedAt: string;
	listId: number;
	assignedUsers: string[];
	labels: string[];
}

const Task: React.FC<TaskProps> = ({ id, boardId }) => {
	const [task, setTask] = useState<TaskData | null>(null);
	const [richTextModal, setRichTextModal] = useDisclosure(false);
	const [contextMenuOpen, setContextMenuOpen] = useState(false);
	const [isRenaming, setIsRenaming] = useState(false);
	const [newName, setNewName] = useState("");
	const [boardMembers, setBoardMembers] = useState<string[]>([]);

	const { setTaskCacheEntry } = useApp();
	const { tokenData } = useAuth();

	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id,
		disabled: isRenaming,
	});

	const deleteMutation = trpc.task.delete.useMutation();
	const renameMutation = trpc.task.setName.useMutation();
	const setAssignedUsersMutation = trpc.task.setAssignedUsers.useMutation();
	const setLabelsMutation = trpc.task.setLabels.useMutation();

	const visibleLabels = useMemo(() => task?.labels.slice(0, 3) || [], [task?.labels]);
	const hiddenLabelsCount = useMemo(() => Math.max(0, (task?.labels.length || 0) - 3), [task?.labels]);
	const visibleMembers = useMemo(() => task?.assignedUsers.slice(0, 5) || [], [task?.assignedUsers]);
	const hiddenMembersCount = useMemo(() => Math.max(0, (task?.assignedUsers.length || 0) - 5), [task?.assignedUsers]);
	const currentUsername = useMemo(() => tokenData?.username, [tokenData]);
	const isAssignedToCurrentUser = useMemo(
		() => task?.assignedUsers.includes(currentUsername ?? ""),
		[task?.assignedUsers, currentUsername],
	);

	trpc.task.getSub.useSubscription(
		{ id },
		{
			onData(taskData) {
				if (taskData) {
					const updatedTask = {
						...taskData,
						assignedUsers: taskData.assignedUsers.map((user) => user.username),
						labels: taskData.labels.map((label) => label.name),
					};
					setTask(updatedTask);
					setTaskCacheEntry({
						id: updatedTask.id,
						name: updatedTask.name,
						assignedUsers: updatedTask.assignedUsers,
						labels: updatedTask.labels,
					});
				} else {
					setTask(null);
				}
			},
		},
	);

	trpc.board.getUsersSub.useSubscription(
		{ boardId: boardId },
		{
			onData(data) {
				setBoardMembers(data.users.map((value) => value.user.username) || []);
			},
		},
	);

	const handleContextMenu = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			if (!isRenaming) setContextMenuOpen(true);
		},
		[isRenaming],
	);

	const handleCardClick = useCallback(() => {
		if (!isRenaming) setRichTextModal.open();
	}, [isRenaming, setRichTextModal]);

	const handleDeleteTask = useCallback(() => {
		deleteMutation.mutate({ id });
	}, [deleteMutation, id]);

	const handleRenameTask = useCallback(() => {
		setIsRenaming(true);
		setNewName(task?.name || "");
	}, [task]);

	const handleRenameSubmit = useCallback(() => {
		if (task) {
			renameMutation.mutate({ id: task.id, newName });
			setIsRenaming(false);
		}
	}, [newName, task, renameMutation]);

	const handleAssignMembers = useCallback(
		(members: string[]) => {
			setTask((prevTask) => (prevTask ? { ...prevTask, assignedUsers: members } : null));
			setAssignedUsersMutation.mutateAsync({ id: id, usernames: members });
		},
		[id, setAssignedUsersMutation],
	);

	const handleAddLabels = useCallback(
		(labels: string[]) => {
			setTask((prevTask) => (prevTask ? { ...prevTask, labels } : null));
			setLabelsMutation.mutateAsync({ id: id, labelNames: labels });
		},
		[id, setLabelsMutation],
	);

	if (!task) {
		return (
			<Card ref={setNodeRef} shadow="sm" padding="xs" radius="md" withBorder>
				<CenteredLoader />
			</Card>
		);
	}

	return (
		<>
			<Menu
				shadow="md"
				position="right"
				offset={5}
				withArrow
				opened={contextMenuOpen}
				onClose={() => setContextMenuOpen(false)}
			>
				<Menu.Target>
					<Card
						ref={setNodeRef}
						style={{
							transform: CSS.Transform.toString(transform),
							transition,
							opacity: isDragging ? 0.5 : 1,
						}}
						{...(isRenaming ? {} : { ...attributes, ...listeners })}
						shadow="sm"
						padding="xs"
						radius="md"
						withBorder
						onClick={handleCardClick}
						onContextMenu={handleContextMenu}
					>
						<Stack gap="xs">
							{isRenaming ? (
								<TextInput
									value={newName}
									onChange={(event) => setNewName(event.currentTarget.value)}
									rightSection={
										<ActionIcon variant="subtle" onClick={handleRenameSubmit}>
											<IconCheck size="1rem" />
										</ActionIcon>
									}
									onKeyUp={(event) => {
										if (event.key === "Enter") handleRenameSubmit();
										if (event.key === "Escape") setIsRenaming(false);
									}}
									onClick={(e) => e.stopPropagation()}
								/>
							) : (
								<Title order={4} lineClamp={2}>
									{task.name}
								</Title>
							)}
							<Flex wrap="wrap" gap={4} justify="flex-end" align="center">
								{visibleLabels.map((label, index) => (
									<Badge key={`${label}-${index}`} size="sm" variant="light" color="grape">
										{label}
									</Badge>
								))}
								{hiddenLabelsCount > 0 && (
									<Badge size="sm" variant="light" color="gray">
										+{hiddenLabelsCount}
									</Badge>
								)}
							</Flex>
							<Flex justify="flex-end">
								<Group gap={4}>
									{isAssignedToCurrentUser && (
										<Badge variant="transparent" rightSection={<IconUser size={14} />}>
											Assigned to you
										</Badge>
									)}
									{visibleMembers.map((member, index) => (
										<Avatar key={`${member}-${index}`} size="sm" radius="xl" color="lavender">
											{member.slice(0, 2).toUpperCase()}
										</Avatar>
									))}
									{hiddenMembersCount > 0 && (
										<Avatar size="sm" radius="xl" color="gray">
											+{hiddenMembersCount}
										</Avatar>
									)}
								</Group>
							</Flex>
						</Stack>
					</Card>
				</Menu.Target>
				<Menu.Dropdown>
					<Menu.Item onClick={() => setRichTextModal.open()} rightSection={<IconEdit size={14} />}>
						View
					</Menu.Item>
					<Menu.Item onClick={handleRenameTask} rightSection={<IconEdit size={14} />}>
						Rename
					</Menu.Item>
					<Menu.Item color="red" onClick={handleDeleteTask} rightSection={<IconTrash size={14} />}>
						Delete
					</Menu.Item>
				</Menu.Dropdown>
			</Menu>

			<Modal opened={richTextModal} onClose={setRichTextModal.close} title={task.name} size="xl" padding="md">
				<Stack gap="md">
					<MultiSelect
						label="Assign Members"
						data={boardMembers}
						value={task.assignedUsers}
						onChange={handleAssignMembers}
						placeholder="Select members"
						searchable
						clearable
					/>
					<TagsInput
						label="Labels"
						value={task.labels}
						onChange={handleAddLabels}
						placeholder="Type and press enter to add labels"
						clearable
					/>
					<HocuspocusTaskProviderComponent>
						<TaskTextEditor taskId={id} />
					</HocuspocusTaskProviderComponent>
				</Stack>
			</Modal>
		</>
	);
};

const MemoizedTask = memo(Task);
export default MemoizedTask;
