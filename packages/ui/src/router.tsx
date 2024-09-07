import RouterContent from "@ui/views/RouterContent";
import { MemoryRouter } from "react-router-dom";

const Router = () => {
	return (
		<MemoryRouter basename="/">
			<RouterContent />
		</MemoryRouter>
	);
};
export default Router;
