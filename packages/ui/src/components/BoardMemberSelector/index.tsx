import { ActionIcon, Autocomplete, Box, Group, Tooltip } from "@mantine/core";
import { useDebouncedCallback, useDebouncedValue } from "@mantine/hooks";
import { IconUsersPlus, IconX } from "@tabler/icons-react";
import { trpc } from "@ui/utils/trpc";
import { KeyboardEvent, useState } from "react";

export interface User {
	id: number;
	username: string;
}

interface BoardMemberSelectorProps {
	onSubmit: (selectedUser: User) => void;
	onCancel: () => void;
	label?: string;
	placeholder?: string;
	tooltip?: string;
}

const DEBOUNCE_DELAY = 400;

const BoardMemberSelector = ({
	onSubmit,
	onCancel,
	label = "Select member",
	placeholder = "Search for a member",
	tooltip = "Add Member",
}: BoardMemberSelectorProps) => {
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [debouncedSearchQuery] = useDebouncedValue(searchQuery, DEBOUNCE_DELAY);
	const [error, setError] = useState<string | null>(null);

	const fuzzySearch = trpc.user.fuzzySearch.useQuery(
		{ query: debouncedSearchQuery },
		{ enabled: debouncedSearchQuery.length > 0 },
	);

	const handleChange = (value: string) => {
		setSearchQuery(value);
		setError(null);
	};

	const debouncedHandleSubmit = useDebouncedCallback(() => {
		const selectedUser = fuzzySearch.data?.find((user) => user.username === searchQuery);
		if (selectedUser) {
			onSubmit(selectedUser);
			setSearchQuery("");
			setError(null);
		} else {
			setError("Please select a valid user from the list.");
		}
	}, DEBOUNCE_DELAY);

	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			event.preventDefault();
			debouncedHandleSubmit();
		} else if (event.key === "Tab") {
			event.preventDefault();
			const firstResult = fuzzySearch.data?.[0];
			if (firstResult) {
				setSearchQuery(firstResult.username);
			}
		} else if (event.key === "Escape") {
			event.preventDefault();
			onCancel();
		}
	};

	return (
		<Box>
			<Autocomplete
				data={fuzzySearch.data?.map((user) => user.username) ?? []}
				value={searchQuery}
				onChange={handleChange}
				onKeyDown={handleKeyDown}
				label={label}
				placeholder={placeholder}
				error={error}
				rightSection={
					<Group gap={5}>
						<Tooltip label="Cancel">
							<ActionIcon onClick={onCancel} variant="subtle">
								<IconX size={18} />
							</ActionIcon>
						</Tooltip>
						<Tooltip label={tooltip}>
							<ActionIcon onClick={debouncedHandleSubmit} disabled={!searchQuery} variant="subtle">
								<IconUsersPlus size={18} />
							</ActionIcon>
						</Tooltip>
					</Group>
				}
				rightSectionWidth={80}
			/>
		</Box>
	);
};

export default BoardMemberSelector;
