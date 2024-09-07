import { AppShell, Box, Burger, Group, Image, ScrollArea, useMantineTheme } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import BrandTitle from "@ui/components/BrandTitle";
import UserMenu from "@ui/components/UserMenu";
import { useApp } from "@ui/hooks/useApp";
import { useAuth } from "@ui/hooks/useAuth";
import { HEADER_HEIGHT, NAVBAR_WIDTH } from "@ui/utils/constants";
import { ReactNode, memo, useState } from "react";

interface AppLayoutProps {
	children: ReactNode;
	isFixedSize: boolean;
}

const AppLayout = memo(({ children, isFixedSize }: AppLayoutProps) => {
	const { isAuthenticated } = useAuth();
	const { sidebarContent } = useApp();
	const [opened, setOpened] = useState(false);
	const theme = useMantineTheme();

	const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
	const isTablet = useMediaQuery(`(max-width: ${theme.breakpoints.md})`);

	return (
		<AppShell
			header={{ height: HEADER_HEIGHT }}
			navbar={
				isAuthenticated
					? {
							width: NAVBAR_WIDTH,
							breakpoint: "sm",
							collapsed: { mobile: !opened },
						}
					: undefined
			}
			padding={0}
		>
			<AppShell.Header>
				<Group h="100%" px="md" justify="space-between" grow>
					<Group>
						{isAuthenticated && isMobile && (
							<Burger opened={opened} onClick={() => setOpened((opened) => !opened)} size="sm" mr="xl" />
						)}
						<Image
							src="./images/logo_256.webp"
							alt="Taskonauts Logo Small"
							w={HEADER_HEIGHT - 3}
							h={HEADER_HEIGHT - 3}
							fit="contain"
						/>
					</Group>
					<Group justify="center">
						{!isTablet && (
							<BrandTitle order={1} style={{ fontSize: "3.2rem" }}>
								Taskonauts
							</BrandTitle>
						)}
					</Group>
					<Group justify="flex-end">
						<UserMenu />
					</Group>
				</Group>
			</AppShell.Header>
			{isAuthenticated && (
				<AppShell.Navbar p="md">
					<ScrollArea.Autosize offsetScrollbars>{sidebarContent}</ScrollArea.Autosize>
				</AppShell.Navbar>
			)}
			<AppShell.Main>
				<Box
					style={{
						height: isFixedSize ? `calc(100vh - ${HEADER_HEIGHT}px)` : "100%",
						overflowY: isFixedSize ? "auto" : "visible",
					}}
				>
					{children}
				</Box>
			</AppShell.Main>
		</AppShell>
	);
});

export default AppLayout;
