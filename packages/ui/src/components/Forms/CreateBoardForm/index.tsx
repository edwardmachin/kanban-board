import { Button, Group, rem, Stack, TextInput } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { IconAt } from "@tabler/icons-react";
import { memo } from "react";

export interface CreateBoardFormValues {
	name: string;
}

interface CreateBoardFormProps {
	onSubmit: (values: CreateBoardFormValues) => void;
	form: UseFormReturnType<CreateBoardFormValues>;
}

const iconStyle = { width: rem(16), height: rem(16) };

const CreateBoardForm = memo(({ onSubmit, form }: CreateBoardFormProps) => (
	<form onSubmit={form.onSubmit(onSubmit)}>
		<Stack gap="md">
			<TextInput
				leftSection={<IconAt style={iconStyle} />}
				label="Name"
				placeholder="Board name"
				autoFocus
				{...form.getInputProps("name")}
			/>
		</Stack>
		<Group justify="flex-end" mt="md">
			<Button type="submit">Create</Button>
		</Group>
	</form>
));

export default CreateBoardForm;
