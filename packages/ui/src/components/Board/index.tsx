import { getBoardSub } from "@api/trpc/routes/board/types";
import {
	DndContext,
	DragEndEvent,
	DragMoveEvent,
	DragOverlay,
	DragStartEvent,
	PointerSensor,
	rectIntersection,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { ActionIcon, Box, Card, Center, Flex, LoadingOverlay, Modal, Text, Tooltip } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";
import { TRPCClientError } from "@trpc/client";
import CenteredLoader from "@ui/components/CenteredLoader";
import CreateListForm, { CreateListFormValues } from "@ui/components/Forms/CreateListForm";
import { CreateListFormValidation } from "@ui/components/Forms/validations";
import TaskDragged from "@ui/components/TaskDragged";
import TaskList from "@ui/components/TaskList";
import useSmoothAutoScroll from "@ui/hooks/useSmoothAutoScroll";
import { trpc } from "@ui/utils/trpc";
import { memo, useCallback, useMemo, useState } from "react";

const EmptyBoardMessage = memo(() => (
	<Center w="100%" h="100%">
		<Card shadow="md" p="xl" radius="md" withBorder>
			<Text size="xl" fw={500}>
				No Lists
			</Text>
			<Text size="sm" c="dimmed" mt="xs">
				Click the "+" button to create your first list
			</Text>
		</Card>
	</Center>
));

const AddListButton = memo(({ onClick, loading }: { onClick: () => void; loading: boolean }) => (
	<Box style={{ position: "fixed", bottom: 25, right: 25, zIndex: 50 }}>
		<ActionIcon.Group>
			<Tooltip label="Add List">
				<ActionIcon
					aria-label="Add List"
					variant="filled"
					size="xl"
					radius="xl"
					onClick={onClick}
					loading={loading}
					style={{ border: "2px solid rgba(0, 0, 0, 0.075)" }}
				>
					<IconPlus />
				</ActionIcon>
			</Tooltip>
		</ActionIcon.Group>
	</Box>
));

const CreateListModal = memo(
	({
		opened,
		onClose,
		onSubmit,
		form,
		loading,
	}: {
		opened: boolean;
		onClose: () => void;
		onSubmit: (values: CreateListFormValues) => Promise<void>;
		form: ReturnType<typeof useForm<CreateListFormValues>>;
		loading: boolean;
	}) => (
		<Modal
			opened={opened}
			onClose={onClose}
			title="Create List"
			shadow="md"
			keepMounted={false}
			overlayProps={{
				backgroundOpacity: 0.5,
			}}
		>
			<LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm" }} />
			<CreateListForm onSubmit={onSubmit} form={form} />
		</Modal>
	),
);

interface BoardProps {
	id: number;
}

const Board: React.FC<BoardProps> = ({ id }) => {
	const [activeId, setActiveId] = useState<number | null>(null);
	const [board, setBoard] = useState<getBoardSub | null>(null);
	const [createListModelOpened, createListModel] = useDisclosure(false);
	const [formLoaderVisible, formLoader] = useDisclosure(false);

	const { containerRef, startScrolling, stopScrolling } = useSmoothAutoScroll(15);

	const { mutateAsync: moveTaskMutation } = trpc.task.moveToList.useMutation();
	const { mutateAsync: reorderTaskMutation } = trpc.task.reorder.useMutation();
	const { mutateAsync: createListMutation } = trpc.taskList.create.useMutation();

	const createListForm = useForm<CreateListFormValues>({
		initialValues: { name: "" },
		validate: CreateListFormValidation,
	});

	trpc.board.getSub.useSubscription(
		{ boardId: id },
		{
			onData: useCallback((boardData) => {
				if (boardData) {
					const transformedBoard: getBoardSub = {
						...boardData,
						createdAt: new Date(boardData.createdAt),
						updatedAt: new Date(boardData.updatedAt),
						lists: boardData.lists.map(({ tasks, ...list }) => ({
							...list,
							tasks: tasks.map(({ createdAt, updatedAt, ...task }) => ({
								...task,
								createdAt: new Date(createdAt),
								updatedAt: new Date(updatedAt),
							})),
						})),
					};
					setBoard(transformedBoard);
				} else {
					setBoard(null);
				}
			}, []),
		},
	);

	const handleFormCreation = useCallback(
		async (values: CreateListFormValues) => {
			formLoader.open();
			try {
				const listId = await createListMutation({ name: values.name, boardId: id });
				if (!listId) throw new Error("Did not receive value from server");
				createListModel.close();
				createListForm.reset();
			} catch (error: unknown) {
				if (error instanceof TRPCClientError || error instanceof Error) {
					createListForm.setFieldError("name", error.message);
				} else {
					console.log(error);
				}
			} finally {
				formLoader.close();
			}
		},
		[createListMutation, id, createListModel, createListForm, formLoader],
	);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 10,
			},
		}),
	);

	const handleDragStart = useCallback((event: DragStartEvent) => {
		setActiveId(Number(event.active.id));
	}, []);

	const handleDragMove = useCallback(
		(event: DragMoveEvent) => {
			const container = containerRef.current;
			if (!container) return;

			const { active } = event;
			const clientRect = active.rect.current;
			if (!clientRect?.initial) return;

			const { left: containerLeft, right: containerRight } = container.getBoundingClientRect();
			const scrollThreshold = 100;
			const currentX = clientRect.translated?.left ?? clientRect.initial.left;
			const itemRight = currentX + clientRect.initial.width;

			if (currentX < containerLeft + scrollThreshold) {
				startScrolling("left");
			} else if (itemRight > containerRight - scrollThreshold) {
				startScrolling("right");
			} else {
				stopScrolling();
			}
		},
		[containerRef, startScrolling, stopScrolling],
	);

	const handleDragEnd = (event: DragEndEvent) => {
		stopScrolling();
		const { active, over } = event;

		if (!over || active.id === over.id) {
			setActiveId(null);
			return;
		}

		setBoard((prevBoard) => {
			if (!prevBoard) return null;

			const newLists = [...prevBoard.lists];

			const findListIndex = (taskId: string | number) =>
				newLists.findIndex((list) => list.tasks.some((task) => task.id === taskId));

			const findTaskIndex = (listIndex: number, taskId: string | number) =>
				newLists[listIndex].tasks.findIndex((task) => task.id === taskId);

			const moveTask = (fromListIndex: number, toListIndex: number, fromTaskIndex: number, toTaskIndex: number) => {
				const [movedTask] = newLists[fromListIndex].tasks.splice(fromTaskIndex, 1);
				newLists[toListIndex].tasks.splice(toTaskIndex, 0, movedTask);
			};

			const handleMutationError = (errorMessage: string) => (error: Error) => {
				console.error(errorMessage, error);
				setBoard(prevBoard);
			};

			const moveToEmptyList = () => {
				const listId = Number(over.id.toString().split("list-")[1]);

				const overListIndex = newLists.findIndex((list) => list.id === listId);
				if (overListIndex === -1) return false;

				const activeListIndex = findListIndex(active.id);
				if (activeListIndex === -1) return false;

				const activeTaskIndex = findTaskIndex(activeListIndex, active.id);
				moveTask(activeListIndex, overListIndex, activeTaskIndex, newLists[overListIndex].tasks.length);

				moveTaskMutation({
					id: Number(active.id),
					listId,
					newOrder: newLists[overListIndex].tasks.length - 1,
				}).catch(handleMutationError("Failed to move task to empty list:"));

				return true;
			};

			const moveBetweenLists = (activeListIndex: number, overListIndex: number) => {
				const activeTaskIndex = findTaskIndex(activeListIndex, active.id);
				const overTaskIndex = findTaskIndex(overListIndex, over.id);

				moveTask(activeListIndex, overListIndex, activeTaskIndex, overTaskIndex);

				moveTaskMutation({
					id: Number(active.id),
					listId: newLists[overListIndex].id,
					newOrder: overTaskIndex,
				}).catch(handleMutationError("Failed to move task:"));
			};

			const reorderWithinList = (listIndex: number) => {
				const activeTaskIndex = findTaskIndex(listIndex, active.id);
				const overTaskIndex = findTaskIndex(listIndex, over.id);

				newLists[listIndex].tasks = arrayMove(newLists[listIndex].tasks, activeTaskIndex, overTaskIndex);

				reorderTaskMutation({
					id: Number(active.id),
					newOrder: overTaskIndex,
				}).catch(handleMutationError("Failed to reorder task:"));
			};

			const isMovingToEmptyList = over.id.toString().startsWith("list-");

			if (isMovingToEmptyList) {
				if (!moveToEmptyList()) return prevBoard;
			} else {
				const activeListIndex = findListIndex(active.id);
				const overListIndex = findListIndex(over.id);

				if (activeListIndex === -1 || overListIndex === -1) return prevBoard;

				if (activeListIndex !== overListIndex) {
					moveBetweenLists(activeListIndex, overListIndex);
				} else {
					reorderWithinList(activeListIndex);
				}
			}

			return { ...prevBoard, lists: newLists };
		});

		setActiveId(null);
	};

	const dragOverlay = useMemo(
		() => <DragOverlay>{activeId ? <TaskDragged id={activeId} /> : null}</DragOverlay>,
		[activeId],
	);

	if (!board) return <CenteredLoader />;

	return (
		<Flex w="100%" h="100%">
			<CreateListModal
				opened={createListModelOpened}
				onClose={createListModel.close}
				onSubmit={handleFormCreation}
				form={createListForm}
				loading={formLoaderVisible}
			/>
			<AddListButton onClick={createListModel.open} loading={createListModelOpened} />
			<DndContext
				sensors={sensors}
				collisionDetection={rectIntersection}
				onDragStart={handleDragStart}
				onDragMove={handleDragMove}
				onDragEnd={handleDragEnd}
				autoScroll={{ enabled: false }}
			>
				<Flex ref={containerRef} dir="row" style={{ overflowX: "scroll", width: "100%" }}>
					{board.lists.length === 0 ? (
						<EmptyBoardMessage />
					) : (
						board.lists.map((list) => <TaskList key={list.id} id={list.id} />)
					)}
				</Flex>
				{dragOverlay}
			</DndContext>
		</Flex>
	);
};

const MemoizedBoard = memo(Board, (prevProps, nextProps) => prevProps.id === nextProps.id);
export default MemoizedBoard;
