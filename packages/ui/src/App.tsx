import { MantineProvider } from "@mantine/core";
import AuthProvider from "@ui/providers/AuthProvider";
import Router from "@ui/router";
import { theme } from "@ui/theme";

import "@mantine/core/styles.css";
import "@mantine/tiptap/styles.css";
import "@ui/styles/brand-font.css";
import "@ui/styles/index.css";

const App = () => {
	return (
		<MantineProvider theme={theme} defaultColorScheme="dark">
			<AuthProvider>
				<Router />
			</AuthProvider>
		</MantineProvider>
	);
};

export default App;
