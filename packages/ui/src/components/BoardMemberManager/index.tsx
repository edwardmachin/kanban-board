import { ActionIcon, Group, Table, Text, Title } from "@mantine/core";
import { IconTrash, IconUserPlus } from "@tabler/icons-react";
import BoardMemberSelector, { User } from "@ui/components/BoardMemberSelector";
import CenteredLoader from "@ui/components/CenteredLoader";
import { trpc } from "@ui/utils/trpc";
import { useState } from "react";

interface BoardMemberManagerProps {
	activeBoardId: string | undefined;
}

const BoardMemberManager: React.FC<BoardMemberManagerProps> = ({ activeBoardId }) => {
	const [isAdding, setIsAdding] = useState(false);
	const [users, setUsers] = useState<User[]>([]);
	const [error, setError] = useState<string | null>(null);

	trpc.board.getUsersSub.useSubscription(
		{ boardId: Number(activeBoardId) },
		{
			onData: (data) => {
				setError(null);
				setUsers(data.users.map((user) => user.user));
			},
			onError: (err) => {
				setError(err.message);
			},
		},
	);

	const manageUserMutation = trpc.board.manageUser.useMutation();

	if (users.length === 0 && !users) {
		return <CenteredLoader />;
	}

	if (error) {
		return (
			<Text c="red" ta="center">
				Error loading board members: {error}
			</Text>
		);
	}

	const handleAddMember = (user: User) => {
		setIsAdding(false);
		manageUserMutation.mutate({ boardId: Number(activeBoardId), userId: user.id, action: "add" });
	};

	const handleRemoveMember = (user: User) => {
		manageUserMutation.mutate({ boardId: Number(activeBoardId), userId: user.id, action: "remove" });
	};

	return (
		<>
			<Title order={2} mb="md">
				Board Members
			</Title>
			<Table striped withTableBorder>
				<Table.Thead>
					<Table.Tr>
						<Table.Th>Username</Table.Th>
						<Table.Th ta="right">Actions</Table.Th>
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{users.map((user) => (
						<Table.Tr key={user.id}>
							<Table.Td>
								<Text size="sm">{user.username}</Text>
							</Table.Td>
							<Table.Td ta="right">
								<ActionIcon color="red" variant="subtle" onClick={() => handleRemoveMember(user)}>
									<IconTrash size={16} />
								</ActionIcon>
							</Table.Td>
						</Table.Tr>
					))}
					<Table.Tr>
						{users.length === 0 && <Table.Td colSpan={2}>No members found</Table.Td>}
						<Table.Td colSpan={2}>
							{isAdding ? (
								<BoardMemberSelector label="" onSubmit={handleAddMember} onCancel={() => setIsAdding(false)} />
							) : (
								<Group justify="center">
									<ActionIcon variant="subtle" onClick={() => setIsAdding(true)}>
										<IconUserPlus size={16} />
									</ActionIcon>
								</Group>
							)}
						</Table.Td>
					</Table.Tr>
				</Table.Tbody>
			</Table>
		</>
	);
};

export default BoardMemberManager;
