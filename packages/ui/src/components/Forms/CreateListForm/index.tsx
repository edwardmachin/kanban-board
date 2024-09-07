import { Button, Group, rem, Stack, TextInput } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { IconAt } from "@tabler/icons-react";
import { memo } from "react";

export interface CreateListFormValues {
	name: string;
}

interface CreateListFormProps {
	onSubmit: (values: CreateListFormValues) => void;
	form: UseFormReturnType<CreateListFormValues>;
}

const iconStyle = { width: rem(16), height: rem(16) };

const CreateListForm = memo(({ onSubmit, form }: CreateListFormProps) => (
	<form onSubmit={form.onSubmit(onSubmit)}>
		<Stack gap="md">
			<TextInput
				leftSection={<IconAt style={iconStyle} />}
				label="Name"
				placeholder="List name"
				autoFocus
				{...form.getInputProps("name")}
			/>
		</Stack>
		<Group justify="flex-end" mt="md">
			<Button type="submit">Create</Button>
		</Group>
	</form>
));

export default CreateListForm;
