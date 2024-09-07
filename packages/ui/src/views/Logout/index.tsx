import { Container, Paper, Stack, Text, Title } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import BrandTitle from "@ui/components/BrandTitle";
import CenteredLoader from "@ui/components/CenteredLoader";
import { useAuth } from "@ui/hooks/useAuth";
import { sleep } from "@ui/utils/timing";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Logout: React.FC = () => {
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const { setToken } = useAuth();
	const navigate = useNavigate();

	const performLogout = useCallback(async () => {
		try {
			setToken(null);
			await sleep(1000);
			navigate("/", { replace: true });
		} catch (error) {
			console.error("Logout failed:", error);
			setError("Logout failed. Please try again.");
		} finally {
			setIsLoading(false);
		}
	}, [setToken, navigate]);

	useEffect(() => {
		performLogout();
	}, [performLogout]);

	if (error || isLoading) {
		return (
			<Container size="xs" mt="xl">
				<Paper shadow="md" p="xl" radius="md" withBorder>
					<Stack align="center" gap="lg">
						{error ? (
							<>
								<IconAlertCircle size={48} color="red" />
								<Title order={2}>Logout Error</Title>
								<Text c="red" ta="center">
									{error}
								</Text>
							</>
						) : (
							<>
								<BrandTitle order={2}>Logging Out</BrandTitle>
								<CenteredLoader />
							</>
						)}
					</Stack>
				</Paper>
			</Container>
		);
	}

	return null;
};

export default Logout;
