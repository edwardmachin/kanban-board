import { Button, Card, Container, Group, Image, LoadingOverlay, Modal, Stack, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconLogin, IconUserPlus } from "@tabler/icons-react";
import { TRPCClientError } from "@trpc/client";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import BrandTitle from "@ui/components/BrandTitle";
import type { AuthFormValues } from "@ui/components/Forms/AuthForm";
import AuthForm from "@ui/components/Forms/AuthForm";
import { AuthFormValidation } from "@ui/components/Forms/validations";
import { useAuth } from "@ui/hooks/useAuth";
import { trpc } from "@ui/utils/trpc";

interface ValidationError {
	path: string[];
	message: string;
}

interface AuthModalProps {
	opened: boolean;
	onClose: () => void;
	title: string;
	formLoaderVisible: boolean;
	form: ReturnType<typeof useForm<AuthFormValues>>;
	onSubmit: (values: AuthFormValues) => void;
	type: "login" | "register";
}

const AuthModal: React.FC<AuthModalProps> = ({ opened, onClose, title, formLoaderVisible, form, onSubmit, type }) => (
	<Modal
		opened={opened}
		onClose={onClose}
		title={title}
		shadow="md"
		keepMounted={false}
		overlayProps={{
			backgroundOpacity: 0.5,
		}}
	>
		<LoadingOverlay visible={formLoaderVisible} zIndex={1000} overlayProps={{ radius: "sm" }} />
		<AuthForm type={type} onSubmit={onSubmit} form={form} />
	</Modal>
);

const Landing: React.FC = () => {
	const [loginModalOpened, loginModal] = useDisclosure(false);
	const [registerModalOpened, registerModal] = useDisclosure(false);
	const [formLoaderVisible, formLoader] = useDisclosure(false);

	const registerMutation = trpc.user.register.useMutation();
	const loginMutation = trpc.user.login.useMutation();

	const auth = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (!auth.isLoading && auth.isAuthenticated) {
			navigate("/boards");
		}
	}, [auth.isLoading, auth.isAuthenticated, navigate]);

	const loginForm = useForm<AuthFormValues>({
		initialValues: { username: "", password: "" },
		validate: AuthFormValidation,
	});

	const registerForm = useForm<AuthFormValues>({
		initialValues: { username: "", password: "" },
		validate: AuthFormValidation,
	});

	const handleAuth = async (
		values: AuthFormValues,
		mutation: typeof loginMutation | typeof registerMutation,
		modal: { close: () => void },
		form: ReturnType<typeof useForm<AuthFormValues>>,
	) => {
		formLoader.open();
		try {
			const { token } = await mutation.mutateAsync(values);
			handleSuccessfulAuth(token, modal, form);
		} catch (error: unknown) {
			handleAuthError(error, form);
		} finally {
			formLoader.close();
		}
	};

	const handleSuccessfulAuth = (
		token: string,
		modal: { close: () => void },
		form: ReturnType<typeof useForm<AuthFormValues>>,
	) => {
		auth.setToken(token);
		navigate("/boards");
		modal.close();
		form.reset();
	};

	const handleAuthError = (error: unknown, form: ReturnType<typeof useForm<AuthFormValues>>) => {
		console.error(error);
		if (error instanceof TRPCClientError) {
			handleTRPCError(error, form);
		} else if (error instanceof Error) {
			form.setFieldError("password", error.message);
		} else {
			form.setFieldError("password", "An unexpected error occurred. Please try again.");
		}
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const handleTRPCError = (error: TRPCClientError<any>, form: ReturnType<typeof useForm<AuthFormValues>>) => {
		try {
			const errorData = JSON.parse(error.message) as ValidationError[];
			if (Array.isArray(errorData)) {
				handleValidationErrors(errorData, form);
			} else {
				setGenericFormErrors(form, error.message);
			}
		} catch (parseError) {
			setGenericFormErrors(form, error.message);
		}
	};

	const handleValidationErrors = (errors: ValidationError[], form: ReturnType<typeof useForm<AuthFormValues>>) => {
		errors.forEach((err) => {
			if (err.path && err.path.length > 0) {
				const fieldName = err.path[0] as keyof AuthFormValues;
				if (fieldName in form.values) {
					form.setFieldError(fieldName, err.message);
				}
			}
		});
	};

	const setGenericFormErrors = (form: ReturnType<typeof useForm<AuthFormValues>>, message: string) => {
		form.setFieldError("username", message);
		form.setFieldError("password", message);
	};

	return (
		<>
			<AuthModal
				opened={loginModalOpened}
				onClose={loginModal.close}
				title="Login"
				formLoaderVisible={formLoaderVisible}
				form={loginForm}
				onSubmit={(values) => handleAuth(values, loginMutation, loginModal, loginForm)}
				type="login"
			/>

			<AuthModal
				opened={registerModalOpened}
				onClose={registerModal.close}
				title="Register"
				formLoaderVisible={formLoaderVisible}
				form={registerForm}
				onSubmit={(values) => handleAuth(values, registerMutation, registerModal, registerForm)}
				type="register"
			/>
			<Container size="xs" mt="xl">
				<Card shadow="md" p="xl" radius="md">
					<Stack align="center" gap="xl">
						<Image src="./images/logo_2048.webp" alt="Taskonauts Logo" fit="contain" w={"100%"} h={"100%"} />
						<BrandTitle order={1}>Welcome</BrandTitle>
						<Text size="lg" c="dimmed" style={{ userSelect: "none" }}>
							Please login or register to get started.
						</Text>
						<Group>
							<Button leftSection={<IconLogin size={14} />} onClick={loginModal.open} size="lg">
								Login
							</Button>
							<Button leftSection={<IconUserPlus size={14} />} onClick={registerModal.open} size="lg" variant="outline">
								Register
							</Button>
						</Group>
					</Stack>
				</Card>
			</Container>
		</>
	);
};

export default Landing;
