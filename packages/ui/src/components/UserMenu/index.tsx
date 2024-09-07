import {
	Alert,
	Avatar,
	Button,
	Divider,
	Group,
	List,
	Menu,
	Modal,
	Notification,
	PasswordInput,
	Stack,
	Text,
	Title,
	UnstyledButton,
	useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
	IconAlertCircle,
	IconCheck,
	IconChevronRight,
	IconLogout,
	IconMoonStars,
	IconSettings,
	IconSun,
} from "@tabler/icons-react";
import { TRPCClientError } from "@trpc/client";
import { useAuth } from "@ui/hooks/useAuth";
import { trpc } from "@ui/utils/trpc";
import { memo, useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

interface ValidationError {
	code: string;
	minimum?: number;
	type?: string;
	inclusive?: boolean;
	exact?: boolean;
	message: string;
	path: string[];
}

type ErrorState = {
	currentPassword: string[];
	newPassword: string[];
	confirmPassword: string[];
};

const UserMenu = () => {
	const { isAuthenticated, isLoading, tokenData } = useAuth();

	const [newPassword, setNewPassword] = useState("");
	const [currentPassword, setCurrentPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [errors, setErrors] = useState<ErrorState>({
		currentPassword: [],
		newPassword: [],
		confirmPassword: [],
	});
	const [generalError, setGeneralError] = useState("");
	const [success, setSuccess] = useState(false);

	const [menuOpen, menu] = useDisclosure(false);
	const [settingsModelOpen, settingsModel] = useDisclosure(false);

	const { colorScheme, setColorScheme } = useMantineColorScheme({
		keepTransitions: true,
	});

	const changePasswordMutation = trpc.user.changePassword.useMutation();

	const navigate = useNavigate();

	const isDarkMode = colorScheme === "dark";

	const toggleColorScheme = useCallback(() => {
		setColorScheme(isDarkMode ? "light" : "dark");
	}, [isDarkMode, setColorScheme]);

	const handleLogout = useCallback(() => {
		navigate("/logout");
	}, [navigate]);

	const avatarInitials = useMemo(() => {
		return tokenData?.username?.substring(0, 2).toUpperCase() || "";
	}, [tokenData?.username]);

	const handleTRPCError = (error: TRPCClientError<any>) => {
		try {
			const errorData = JSON.parse(error.message) as ValidationError[];
			if (Array.isArray(errorData)) {
				const newErrors: ErrorState = { currentPassword: [], newPassword: [], confirmPassword: [] };
				errorData.forEach((error) => {
					const key = error.path[0];
					if (key && (key === "currentPassword" || key === "newPassword" || key === "confirmPassword")) {
						newErrors[key].push(error.message);
					}
				});
				setErrors(newErrors);
			} else {
				setGeneralError(error.message);
			}
		} catch (parseError) {
			setGeneralError(error.message);
		}
	};

	const handleSaveSettings = useCallback(async () => {
		setErrors({ currentPassword: [], newPassword: [], confirmPassword: [] });
		setGeneralError("");
		setSuccess(false);
		try {
			await changePasswordMutation.mutateAsync({ currentPassword, newPassword, confirmPassword });
			setSuccess(true);
			setTimeout(() => {
				settingsModel.close();
				clearInputs();
			}, 2000);
		} catch (err) {
			if (err instanceof TRPCClientError) {
				handleTRPCError(err);
			} else if (err instanceof Error) {
				setGeneralError(err.message);
			} else {
				setGeneralError("An unexpected error occurred. Please try again.");
			}
		}
	}, [changePasswordMutation, confirmPassword, currentPassword, newPassword, settingsModel]);

	const clearInputs = () => {
		setCurrentPassword("");
		setNewPassword("");
		setConfirmPassword("");
		setErrors({ currentPassword: [], newPassword: [], confirmPassword: [] });
		setGeneralError("");
		setSuccess(false);
	};

	const hasErrors = Object.values(errors).some((errorList) => errorList.length > 0) || !!generalError;

	if (!isAuthenticated || isLoading) return null;

	return (
		<>
			<Modal
				title="Account Settings"
				opened={settingsModelOpen}
				onClose={() => {
					settingsModel.close();
					clearInputs();
				}}
				padding="lg"
				radius="md"
				shadow="xl"
				size="md"
				overlayProps={{
					opacity: 0.55,
				}}
			>
				<form
					onSubmit={(event) => {
						event.preventDefault();
						handleSaveSettings();
					}}
				>
					<Stack gap="md">
						<Divider label="Change Password" labelPosition="center" style={{ userSelect: "none" }} />

						{hasErrors && (
							<Alert icon={<IconAlertCircle size="1rem" />} title="Validation Errors" color="red" variant="filled">
								{generalError ? (
									<Text>{generalError}</Text>
								) : (
									<>
										Please correct the following errors:
										{Object.entries(errors).map(
											([field, errorList]) =>
												errorList.length > 0 && (
													<List key={field} size="sm">
														<Title order={5} style={{ textTransform: "capitalize" }}>
															{field}
														</Title>
														{errorList.map((error, index) => (
															<List.Item key={index}>{error}</List.Item>
														))}
													</List>
												),
										)}
									</>
								)}
							</Alert>
						)}

						<PasswordInput
							label="Current Password"
							placeholder="Enter your current password"
							value={currentPassword}
							onChange={(event) => setCurrentPassword(event.currentTarget.value)}
							required
							error={errors.currentPassword.length > 0 && errors.currentPassword[0]}
						/>
						<PasswordInput
							label="New Password"
							placeholder="Enter your new password"
							value={newPassword}
							onChange={(event) => setNewPassword(event.currentTarget.value)}
							required
							error={errors.newPassword.length > 0 && errors.newPassword[0]}
						/>
						<PasswordInput
							label="Confirm Password"
							placeholder="Confirm your new password"
							value={confirmPassword}
							onChange={(event) => setConfirmPassword(event.currentTarget.value)}
							required
							error={errors.confirmPassword.length > 0 && errors.confirmPassword[0]}
						/>

						<Group justify="flex-end" mt="md">
							<Button
								variant="subtle"
								onClick={() => {
									settingsModel.close();
									clearInputs();
								}}
							>
								Cancel
							</Button>
							<Button type="submit" loading={changePasswordMutation.isPending}>
								Save Changes
							</Button>
						</Group>

						{success && (
							<Notification icon={<IconCheck size="1.1rem" />} title="Success" withCloseButton={false}>
								Password changed successfully!
							</Notification>
						)}
					</Stack>
				</form>
			</Modal>

			<Menu
				position="bottom"
				transitionProps={{ transition: "scale-y" }}
				onOpen={() => menu.open()}
				onClose={() => menu.close()}
				withinPortal
				withArrow
			>
				<Menu.Target>
					<UnstyledButton>
						<Group>
							<Avatar src={null} radius="xl" color="lavender">
								{avatarInitials}
							</Avatar>
							<div style={{ flex: 1 }}>
								<Text size="sm" fw={500}>
									{tokenData?.username}
								</Text>
								<Text c="dimmed" size="xs">
									id: {tokenData?.userId}
								</Text>
							</div>
							<IconChevronRight
								size="1rem"
								style={{
									transform: `rotate(${menuOpen ? 90 : 0}deg)`,
									transition: "transform 200ms ease",
								}}
							/>
						</Group>
					</UnstyledButton>
				</Menu.Target>
				<Menu.Dropdown>
					<Menu.Item
						onClick={toggleColorScheme}
						leftSection={
							isDarkMode ? <IconSun size="0.9rem" stroke={1.5} /> : <IconMoonStars size="0.9rem" stroke={1.5} />
						}
					>
						{isDarkMode ? "Enable Light Mode" : "Enable Dark Mode"}
					</Menu.Item>
					<Menu.Item onClick={settingsModel.open} leftSection={<IconSettings size="0.9rem" stroke={1.5} />}>
						Account settings
					</Menu.Item>
					<Menu.Item onClick={handleLogout} color="red" leftSection={<IconLogout size="0.9rem" stroke={1.5} />}>
						Logout
					</Menu.Item>
				</Menu.Dropdown>
			</Menu>
		</>
	);
};

const MemoizedUserMenu = memo(UserMenu);
export default MemoizedUserMenu;
