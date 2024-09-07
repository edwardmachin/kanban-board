import { Center, Loader } from "@mantine/core";

const CenteredLoader = () => (
	<Center style={{ width: "100%", height: "100%" }}>
		<Loader size="lg" variant="dots" role="status" />
	</Center>
);

export default CenteredLoader;
