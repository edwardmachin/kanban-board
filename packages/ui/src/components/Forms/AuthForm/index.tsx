import { Button, Group, PasswordInput, rem, Stack, TextInput } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { IconAt, IconKey } from "@tabler/icons-react";
import { memo } from "react";

export interface AuthFormValues {
	username: string;
	password: string;
}

export type AuthFormType = "login" | "register";

interface AuthFormProps {
	type: AuthFormType;
	onSubmit: (values: AuthFormValues) => void;
	form: UseFormReturnType<AuthFormValues>;
}

const iconStyle = { width: rem(16), height: rem(16) };

const AuthForm = memo(({ type, onSubmit, form }: AuthFormProps) => (
	<form onSubmit={form.onSubmit(onSubmit)}>
		<Stack gap="md">
			<TextInput
				leftSection={<IconAt style={iconStyle} />}
				label="Username"
				placeholder="Your username"
				autoFocus
				{...form.getInputProps("username")}
			/>
			<PasswordInput
				leftSection={<IconKey style={iconStyle} />}
				label="Password"
				placeholder="Your password"
				{...form.getInputProps("password")}
			/>
		</Stack>
		<Group justify="flex-end" mt="md">
			<Button type="submit">{type === "login" ? "Login" : "Register"}</Button>
		</Group>
	</form>
));

export default AuthForm;
