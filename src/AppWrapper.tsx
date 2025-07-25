import { FC } from "react";
import App from "./App.tsx";
import ErrorBoundary from "./ErrorBoundary.tsx";
// Removed imports from _cofounder/dev
// import FirstLaunch from "@/_cofounder/dev/firstlaunch.tsx";
// import Cmdl from "@/_cofounder/dev/cmdl.tsx";

const AppWrapper: FC = () => {
	return (
		<ErrorBoundary>
			{/* Removed FirstLaunch and Cmdl components */}
			<App />
		</ErrorBoundary>
	);
};

export default AppWrapper;
