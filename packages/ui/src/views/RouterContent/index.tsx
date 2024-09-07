import AppLayout from "@ui/components/AppLayout";
import CenteredLoader from "@ui/components/CenteredLoader";
import RefreshTokenTask from "@ui/components/RefreshTokenTask";
import Starfield from "@ui/components/Stars";
import { useAuth } from "@ui/hooks/useAuth";
import AppProvider from "@ui/providers/AppProvider";
import TRPCProvider from "@ui/providers/TRPCProvider";
import { Suspense, lazy } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";

const Landing = lazy(() => import("@ui/views/Landing"));
const Boards = lazy(() => import("@ui/views/Boards"));
const Logout = lazy(() => import("@ui/views/Logout"));
const NotFound = lazy(() => import("@ui/views/NotFound"));

const ProtectedRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
	const { isAuthenticated } = useAuth();
	return isAuthenticated ? element : <Navigate to="/" replace />;
};

const FIXED_SIZE_ROUTES = ["/boards"];

const RouterContent: React.FC = () => {
	const { isLoading } = useAuth();
	const { pathname } = useLocation();
	const isFixedSize = FIXED_SIZE_ROUTES.includes(pathname);

	if (isLoading) return <CenteredLoader />;

	return (
		<Routes>
			<Route
				element={
					<TRPCProvider>
						<RefreshTokenTask />
						<AppProvider>
							<AppLayout isFixedSize={isFixedSize}>
								<Suspense fallback={<CenteredLoader />}>
									<Starfield>
										<Outlet />
									</Starfield>
								</Suspense>
							</AppLayout>
						</AppProvider>
					</TRPCProvider>
				}
			>
				<Route path="/" element={<Landing />} />
				<Route path="/boards" element={<ProtectedRoute element={<Boards />} />} />
				<Route path="/logout" element={<Logout />} />
				<Route path="*" element={<NotFound />} />
			</Route>
		</Routes>
	);
};

export default RouterContent;
