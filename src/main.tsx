import { createRoot } from "react-dom/client";
import AppWrapper from "./AppWrapper.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";

// Add global error handler
window.addEventListener('error', (event) => {
	console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
	console.error('Unhandled promise rejection:', event.reason);
});

// Ensure root element exists
const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Root element not found. Make sure there's a div with id='root' in your HTML.");
}

try {
	const root = createRoot(rootElement);
	root.render(
		<BrowserRouter>
			<AppWrapper />
		</BrowserRouter>
	);
} catch (error) {
	console.error('Failed to render application:', error);
	// Fallback rendering
	rootElement.innerHTML = `
		<div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui;">
			<div style="text-align: center; padding: 2rem;">
				<h1 style="color: #dc2626; margin-bottom: 1rem;">Application Error</h1>
				<p style="color: #6b7280; margin-bottom: 1rem;">Failed to load the application. Please refresh the page.</p>
				<button onclick="window.location.reload()" style="background: #2563eb; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; cursor: pointer;">
					Refresh Page
				</button>
			</div>
		</div>
	`;
}
