import { Card, Center, Text } from "@mantine/core";
import Board from "@ui/components/Board";
import CenteredLoader from "@ui/components/CenteredLoader";
import { useApp } from "@ui/hooks/useApp";
import { trpc } from "@ui/utils/trpc";
import Sidebar from "@ui/views/Boards/sidebar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface BoardType {
	id: number;
	createdAt: string;
	updatedAt: string;
	name: string;
}

const Boards: React.FC = () => {
	const [activeBoardId, setActiveBoardId] = useState<string | undefined>(undefined);
	const [error, setError] = useState<string | undefined>(undefined);
	const [isLoading, setIsLoading] = useState(true);
	const [boards, setBoards] = useState<BoardType[]>([]);

	const { setSidebarContent } = useApp();
	const navigate = useNavigate();

	const handleError = (errorMessage: string) => {
		setError(errorMessage);
		setIsLoading(false);
		const errorMessageLower = errorMessage.toLowerCase();

		switch (errorMessageLower) {
			case "unauthorized":
			case "protected middleware rejection":
				navigate("/logout");
				break;
			default:
				console.error(errorMessage);
				setTimeout(() => navigate("/logout"), 2500);
		}
	};

	trpc.board.getAllSub.useSubscription(undefined, {
		onData: (newBoards) => {
			setBoards(newBoards);
			setIsLoading(false);
		},
		onStarted: () => setIsLoading(false),
		onError: (error) => handleError(error.message),
	});

	useEffect(() => {
		setSidebarContent(<Sidebar activeBoardId={activeBoardId} setActiveBoardId={setActiveBoardId} boards={boards} />);

		if (boards.length > 0 && (!activeBoardId || !boards.some((board) => board.id.toString() === activeBoardId))) {
			setActiveBoardId(boards[0].id.toString());
		}
	}, [boards, activeBoardId, setSidebarContent]);

	if (error) {
		return <Text c="red">{error}</Text>;
	}

	if (isLoading) {
		return <CenteredLoader />;
	}

	if (boards.length === 0 || !activeBoardId) {
		return (
			<Center w="100%" h="100%">
				<Card shadow="md" p="xl" radius="md" withBorder>
					<Text size="xl" fw={500}>
						No Boards
					</Text>
					<Text size="sm" c="dimmed" mt="xs">
						Click the "+" button to create your first board
					</Text>
				</Card>
			</Center>
		);
	}

	return <Board id={Number(activeBoardId)} />;
};

export default Boards;
