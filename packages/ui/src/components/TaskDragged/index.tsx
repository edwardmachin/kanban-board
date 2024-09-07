import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Avatar, Badge, Card, Flex, Group, Skeleton, Stack, Title } from "@mantine/core";
import { IconUser } from "@tabler/icons-react";
import { useApp } from "@ui/hooks/useApp";
import { useAuth } from "@ui/hooks/useAuth";
import { memo, useMemo } from "react";

interface TaskDraggedProps {
	id: number;
}

const TaskDragged: React.FC<TaskDraggedProps> = memo(({ id }) => {
	const { tasksCache } = useApp();
	const { tokenData } = useAuth();
	const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
	const taskData = useMemo(() => tasksCache.get(id), [tasksCache, id]);

	const visibleLabels = useMemo(() => taskData?.labels.slice(0, 3) || [], [taskData?.labels]);
	const hiddenLabelsCount = useMemo(() => Math.max(0, (taskData?.labels.length || 0) - 3), [taskData?.labels]);
	const visibleMembers = useMemo(() => taskData?.assignedUsers.slice(0, 5) || [], [taskData?.assignedUsers]);
	const hiddenMembersCount = useMemo(
		() => Math.max(0, (taskData?.assignedUsers.length || 0) - 5),
		[taskData?.assignedUsers],
	);
	const currentUsername = useMemo(() => tokenData?.username, [tokenData]);
	const isAssignedToCurrentUser = useMemo(
		() => taskData?.assignedUsers.includes(currentUsername ?? ""),
		[taskData?.assignedUsers, currentUsername],
	);

	if (!taskData) {
		return (
			<Card shadow="sm" padding="xs" radius="md" withBorder>
				<Stack gap="xs">
					<Skeleton height={24} width="80%" />
					<Flex wrap="nowrap" gap={4} justify="flex-end" align="center">
						<Skeleton height={20} width={40} radius="xl" />
						<Skeleton height={20} width={40} radius="xl" />
						<Skeleton height={20} width={40} radius="xl" />
					</Flex>
					<Flex justify="flex-end">
						<Group gap={4}>
							<Skeleton height={24} width={24} radius="xl" />
							<Skeleton height={24} width={24} radius="xl" />
							<Skeleton height={24} width={24} radius="xl" />
						</Group>
					</Flex>
				</Stack>
			</Card>
		);
	}

	const { name } = taskData;

	return (
		<Card
			ref={setNodeRef}
			{...attributes}
			{...listeners}
			shadow="sm"
			padding="xs"
			radius="md"
			withBorder
			style={{
				transform: CSS.Transform.toString(transform),
				opacity: 0.5,
			}}
		>
			<Stack gap="xs">
				<Title order={4} lineClamp={2}>
					{name}
				</Title>
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
	);
});

export default TaskDragged;
