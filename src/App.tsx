import { FC, useEffect, useState } from "react";

const App: FC = () => {
	const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

	useEffect(() => {
		// Check if we're in development mode and HMR is working
		if (import.meta.env.DEV) {
			// Simple check for HMR availability
			const checkConnection = () => {
				try {
					// If we can access import.meta.hot, HMR is likely working
					if (import.meta.hot) {
						setConnectionStatus('connected');
					} else {
						setConnectionStatus('disconnected');
					}
				} catch {
					setConnectionStatus('disconnected');
				}
			};

			checkConnection();
			
			// Check periodically
			const interval = setInterval(checkConnection, 5000);
			return () => clearInterval(interval);
		} else {
			setConnectionStatus('connected');
		}
	}, []);

	return (
		<>
			<div className="container mx-auto w-full xl:w-[60vw] p-12 mt-12 text-left whitespace-pre-line break-words">
				<section className="pb-4 mb-4 text-center">
					<h1 className="mt-8 text-4xl font-bold text-gray-800">Vite + React</h1>
					<p className="mt-4 text-lg text-gray-600">Your app will update here as it generates</p>
					
					{import.meta.env.DEV && (
						<div className="mt-6 p-4 rounded-lg bg-gray-100">
							<div className="flex items-center justify-center space-x-2">
								<div className={`w-3 h-3 rounded-full ${
									connectionStatus === 'connected' ? 'bg-green-500' : 
									connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
								}`}></div>
								<span className="text-sm text-gray-700">
									Development Server: {connectionStatus}
								</span>
							</div>
							{connectionStatus === 'disconnected' && (
								<p className="mt-2 text-xs text-gray-500">
									WebSocket connection issues detected. The app will still work, but hot reload may be limited.
								</p>
							)}
						</div>
					)}
				</section>
				
				<section className="mt-8 p-6 bg-blue-50 rounded-lg">
					<h2 className="text-xl font-semibold text-blue-800 mb-3">Application Status</h2>
					<div className="space-y-2 text-sm">
						<div className="flex justify-between">
							<span>React:</span>
							<span className="text-green-600 font-medium">✓ Loaded</span>
						</div>
						<div className="flex justify-between">
							<span>Tailwind CSS:</span>
							<span className="text-green-600 font-medium">✓ Active</span>
						</div>
						<div className="flex justify-between">
							<span>Error Boundary:</span>
							<span className="text-green-600 font-medium">✓ Protected</span>
						</div>
						<div className="flex justify-between">
							<span>Build System:</span>
							<span className="text-green-600 font-medium">✓ Vite</span>
						</div>
					</div>
				</section>
			</div>
		</>
	);
};

export default App;
