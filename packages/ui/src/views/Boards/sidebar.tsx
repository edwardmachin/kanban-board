import {
	ActionIcon,
	Button,
	Center,
	Flex,
	LoadingOverlay,
	Modal,
	Paper,
	Stack,
	TextInput,
	Title,
	Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure, useElementSize } from "@mantine/hooks";
import { IconPlus, IconSearch, IconTrash, IconUsersGroup, IconX } from "@tabler/icons-react";
import { TRPCClientError } from "@trpc/client";
import BoardMemberManager from "@ui/components/BoardMemberManager";
import BrandTitle from "@ui/components/BrandTitle";
import CenteredLoader from "@ui/components/CenteredLoader";
import type { CreateBoardFormValues } from "@ui/components/Forms/CreateBoardForm";
import CreateBoardForm from "@ui/components/Forms/CreateBoardForm";
import { CreateBoardFormValidation } from "@ui/components/Forms/validations";
import { trpc } from "@ui/utils/trpc";
import { useMemo, useState } from "react";

interface BoardType {
	id: number;
	name: string;
	createdAt: string;
	updatedAt: string;
}

interface SidebarProps {
	activeBoardId: string | undefined;
	setActiveBoardId: React.Dispatch<React.SetStateAction<string | undefined>>;
	boards: BoardType[] | undefined;
}

const Sidebar: React.FC<SidebarProps> = ({ activeBoardId, setActiveBoardId, boards }) => {
	const [createBoardModelOpened, createBoardModel] = useDisclosure(false);
	const [manageBoardUsersModelOpened, manageBoardUsersModel] = useDisclosure(false);
	const [formLoaderVisible, formLoader] = useDisclosure(false);
	const [searchQuery, setSearchQuery] = useState("");

	const { ref: flexRef, width: flexWidth } = useElementSize();

	const createBoardMutation = trpc.board.create.useMutation();
	const deleteBoardMutation = trpc.board.delete.useMutation();

	const createBoardForm = useForm<CreateBoardFormValues>({
		initialValues: { name: "" },
		validate: CreateBoardFormValidation,
	});

	const handleFormCreation = async (values: CreateBoardFormValues) => {
		formLoader.open();
		try {
			const id = await createBoardMutation.mutateAsync({ name: values.name });
			if (!id) throw new Error("Did not receive value from server");
			createBoardModel.close();
			createBoardForm.reset();
		} catch (error: unknown) {
			if (error instanceof TRPCClientError || error instanceof Error) {
				createBoardForm.setFieldError("name", error.message);
			} else {
				console.log(error);
			}
		} finally {
			formLoader.close();
		}
	};

	const sortedAndFilteredBoards = useMemo(() => {
		if (!boards) return [];

		if (searchQuery === "") {
			return boards;
		} else {
			const activeBoard = boards.find((board) => board.id.toString() === activeBoardId);
			const filteredBoards = boards.filter((board) => board.name.toLowerCase().includes(searchQuery.toLowerCase()));

			if (activeBoard) {
				const activeBoardMatchesSearch = activeBoard.name.toLowerCase().includes(searchQuery.toLowerCase());
				if (activeBoardMatchesSearch) {
					return [activeBoard, ...filteredBoards.filter((board) => board.id !== activeBoard.id)];
				} else {
					return [activeBoard, ...filteredBoards];
				}
			} else {
				return filteredBoards;
			}
		}
	}, [boards, activeBoardId, searchQuery]);

	const handleClearSearch = () => {
		setSearchQuery("");
	};

	const handleDeleteBoard = () => {
		if (!activeBoardId) return;
		if (isNaN(Number(activeBoardId))) return;
		deleteBoardMutation.mutate({ boardId: Number(activeBoardId) });
	};

	if (!boards) return <CenteredLoader />;

	return (
		<Stack gap={"xs"}>
			<Modal
				opened={createBoardModelOpened}
				onClose={createBoardModel.close}
				title="Create Board"
				shadow="md"
				keepMounted={false}
				overlayProps={{
					backgroundOpacity: 0.5,
				}}
			>
				<LoadingOverlay visible={formLoaderVisible} zIndex={1000} overlayProps={{ radius: "sm" }} />
				<CreateBoardForm onSubmit={handleFormCreation} form={createBoardForm} />
			</Modal>

			<Modal
				opened={manageBoardUsersModelOpened}
				onClose={manageBoardUsersModel.close}
				title={`Manage ${boards.find((board) => activeBoardId === board.id.toString())?.name ?? ""} Board Users`}
				size={"lg"}
				shadow="md"
				keepMounted={false}
				overlayProps={{
					backgroundOpacity: 0.5,
				}}
			>
				<BoardMemberManager activeBoardId={activeBoardId} />
			</Modal>

			<Paper style={{ position: "sticky", top: 0, zIndex: 1 }}>
				<Center>
					<BrandTitle order={3} style={{ fontSize: "2.5rem" }}>
						Boards
					</BrandTitle>
				</Center>
				<Stack gap={"xs"}>
					<Flex ref={flexRef} justify={"center"}>
						<TextInput
							w={"100%"}
							placeholder="Search boards..."
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.currentTarget.value)}
							rightSection={
								searchQuery ? (
									<ActionIcon onClick={handleClearSearch} variant="subtle">
										<IconX size="1rem" />
									</ActionIcon>
								) : (
									<IconSearch size="1rem" />
								)
							}
						/>
					</Flex>
					<Flex ref={flexRef} justify={"flex-end"}>
						<ActionIcon.Group>
							<Tooltip label="Create Board">
								<ActionIcon
									aria-label="Create Board"
									variant="light"
									size="lg"
									onClick={createBoardModel.open}
									loading={createBoardModelOpened}
								>
									<IconPlus size="1.125rem" />
								</ActionIcon>
							</Tooltip>
							<Tooltip label="Manage Users">
								<ActionIcon
									variant="light"
									size="lg"
									disabled={!activeBoardId || boards.length === 0}
									onClick={manageBoardUsersModel.open}
									loading={manageBoardUsersModelOpened}
								>
									<IconUsersGroup size="1.125rem" />
								</ActionIcon>
							</Tooltip>
							<Tooltip label="Delete">
								<ActionIcon
									variant="light"
									size="lg"
									onClick={handleDeleteBoard}
									disabled={!activeBoardId || boards.length === 0}
								>
									<IconTrash size="1.125rem" />
								</ActionIcon>
							</Tooltip>
						</ActionIcon.Group>
					</Flex>
				</Stack>
			</Paper>

			{sortedAndFilteredBoards.map((board) => (
				<Tooltip.Floating key={`${board.name}-${board.id}-tooltip`} label={board.name} position="top" offset={10}>
					<Button
						key={`${board.name}-${board.id}-button`}
						variant={activeBoardId === board.id.toString() ? "filled" : "subtle"}
						onClick={() => setActiveBoardId(board.id.toString())}
						style={{ maxWidth: `${flexWidth}px`, height: "3rem" }}
						justify="flex-start"
						radius="xl"
					>
						<Title order={3}>{board.name}</Title>
					</Button>
				</Tooltip.Floating>
			))}
		</Stack>
	);
};

export default Sidebar;
