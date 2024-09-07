import { Button, Container, Group, Text } from "@mantine/core";
import BrandTitle from "@ui/components/BrandTitle";
import { Link } from "react-router-dom";

const NotFound: React.FC = () => {
	return (
		<Container>
			<BrandTitle order={1}>404 - Page Not Found</BrandTitle>
			<Text>Sorry, the page you are looking for does not exist.</Text>
			<Group mt="xl">
				<Button component={Link} to="/">
					Go to Home
				</Button>
			</Group>
		</Container>
	);
};

export default NotFound;
