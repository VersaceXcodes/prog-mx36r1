import React, { useState, useEffect } from "react";
import axios from "axios";

interface Todo {
	id: number;
	text: string;
	completed: boolean;
	created_at: string;
	updated_at: string;
}

type FilterType = 'all' | 'active' | 'completed';

const API_BASE_URL = 'https://123testing-project-yes-api.launchpulse.ai';

const App: React.FC = () => {
	const [todos, setTodos] = useState<Todo[]>([]);
	const [newTodoText, setNewTodoText] = useState("");
	const [filter, setFilter] = useState<FilterType>('all');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [searchText, setSearchText] = useState("");

	useEffect(() => {
		// Test server connectivity first
		const testConnection = async () => {
			try {
				console.log('Testing server connection...');
				await axios.get(`${API_BASE_URL}/api/health`, { timeout: 5000 });
				console.log('Server connection successful');
				fetchTodos();
			} catch (err) {
				console.error('Server connection failed:', err);
				setError('Unable to connect to server. Please check your connection.');
			}
		};
		
		testConnection();
	}, []);

	const fetchTodos = async (retryCount = 0) => {
		try {
			setLoading(true);
			setError(null);
			console.log('Fetching todos from:', `${API_BASE_URL}/api/todos`);
			const response = await axios.get(`${API_BASE_URL}/api/todos`, {
				timeout: 15000,
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				validateStatus: (status) => status < 500 || status === 502
			});
			
			if (response.status === 502 && retryCount < 3) {
				console.log(`502 error, retrying... (attempt ${retryCount + 1})`);
				setTimeout(() => fetchTodos(retryCount + 1), 1000 * (retryCount + 1));
				return;
			}
			
			console.log('Fetched todos:', response.data);
			setTodos(Array.isArray(response.data) ? response.data : []);
		} catch (err: any) {
			if (err.code === 'ECONNABORTED' && retryCount < 3) {
				console.log(`Timeout error, retrying... (attempt ${retryCount + 1})`);
				setTimeout(() => fetchTodos(retryCount + 1), 2000 * (retryCount + 1));
				return;
			}
			
			const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch todos';
			setError(`Failed to fetch todos: ${errorMessage}`);
			console.error('Error fetching todos:', err);
			setTodos([]);
		} finally {
			setLoading(false);
		}
	};

	const addTodoWithRetry = async (retryCount = 0) => {
		if (!newTodoText.trim()) return;
		
		try {
			setError(null);
			console.log('Adding todo:', newTodoText.trim());
			const response = await axios.post(`${API_BASE_URL}/api/todos`, {
				text: newTodoText.trim()
			}, {
				timeout: 15000,
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				validateStatus: (status) => status < 500 || status === 502
			});
			
			if (response.status === 502 && retryCount < 3) {
				console.log(`502 error adding todo, retrying... (attempt ${retryCount + 1})`);
				setTimeout(() => addTodoWithRetry(retryCount + 1), 1000 * (retryCount + 1));
				return;
			}
			
			console.log('Added todo:', response.data);
			setTodos([response.data, ...todos]);
			setNewTodoText("");
		} catch (err: any) {
			if ((err.code === 'ECONNABORTED' || err.response?.status === 502) && retryCount < 3) {
				console.log(`Error adding todo, retrying... (attempt ${retryCount + 1})`);
				setTimeout(() => addTodoWithRetry(retryCount + 1), 2000 * (retryCount + 1));
				return;
			}
			
			const errorMessage = err.response?.data?.error || err.message || 'Failed to add todo';
			setError(`Failed to add todo: ${errorMessage}`);
			console.error('Error adding todo:', err);
		}
	};

	const addTodo = () => {
		addTodoWithRetry(0);
	};

	const toggleTodo = async (id: number, completed: boolean, retryCount = 0) => {
		try {
			setError(null);
			console.log(`Toggling todo ${id} to ${!completed}`);
			const response = await axios.put(`${API_BASE_URL}/api/todos/${id}`, {
				completed: !completed
			}, {
				timeout: 15000,
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				validateStatus: (status) => status < 500 || status === 502
			});
			
			if (response.status === 502 && retryCount < 3) {
				console.log(`502 error toggling todo, retrying... (attempt ${retryCount + 1})`);
				setTimeout(() => toggleTodo(id, completed, retryCount + 1), 1000 * (retryCount + 1));
				return;
			}
			
			console.log('Updated todo:', response.data);
			setTodos(todos.map(todo => 
				todo.id === id ? response.data : todo
			));
		} catch (err: any) {
			if ((err.code === 'ECONNABORTED' || err.response?.status === 502) && retryCount < 3) {
				console.log(`Error toggling todo, retrying... (attempt ${retryCount + 1})`);
				setTimeout(() => toggleTodo(id, completed, retryCount + 1), 2000 * (retryCount + 1));
				return;
			}
			
			const errorMessage = err.response?.data?.error || err.message || 'Failed to update todo';
			setError(`Failed to update todo: ${errorMessage}`);
			console.error('Error updating todo:', err);
		}
	};

	const deleteTodo = async (id: number, retryCount = 0) => {
		try {
			setError(null);
			console.log(`Deleting todo ${id}`);
			const response = await axios.delete(`${API_BASE_URL}/api/todos/${id}`, {
				timeout: 15000,
				headers: {
					'Accept': 'application/json'
				},
				validateStatus: (status) => status < 500 || status === 502
			});
			
			if (response.status === 502 && retryCount < 3) {
				console.log(`502 error deleting todo, retrying... (attempt ${retryCount + 1})`);
				setTimeout(() => deleteTodo(id, retryCount + 1), 1000 * (retryCount + 1));
				return;
			}
			
			console.log(`Deleted todo ${id}`);
			setTodos(todos.filter(todo => todo.id !== id));
		} catch (err: any) {
			if ((err.code === 'ECONNABORTED' || err.response?.status === 502) && retryCount < 3) {
				console.log(`Error deleting todo, retrying... (attempt ${retryCount + 1})`);
				setTimeout(() => deleteTodo(id, retryCount + 1), 2000 * (retryCount + 1));
				return;
			}
			
			const errorMessage = err.response?.data?.error || err.message || 'Failed to delete todo';
			setError(`Failed to delete todo: ${errorMessage}`);
			console.error('Error deleting todo:', err);
		}
	};

	const filteredTodos = todos.filter(todo => {
		// Apply search filter
		if (searchText && !todo.text.toLowerCase().includes(searchText.toLowerCase())) {
			return false;
		}
		
		// Apply status filter
		if (filter === 'active') return !todo.completed;
		if (filter === 'completed') return todo.completed;
		return true;
	});

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			addTodo();
		}
	};

	return (
		<div className="container mx-auto w-full xl:w-[60vw] p-12 mt-12">
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
				<h1 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-8">
					Todo App
				</h1>

				{error && (
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
						{error}
					</div>
				)}

				<div className="mb-6">
					<div className="flex gap-2 mb-4">
						<input
							type="text"
							value={newTodoText}
							onChange={(e) => setNewTodoText(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Add a new todo..."
							className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
						/>
						<button
							onClick={addTodo}
							disabled={!newTodoText.trim()}
							className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
						>
							Add
						</button>
					</div>
					<div className="flex gap-2">
						<input
							type="text"
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							placeholder="Search todos..."
							className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
						/>
						{searchText && (
							<button
								onClick={() => setSearchText("")}
								className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
							>
								Clear
							</button>
						)}
					</div>
				</div>

				<div className="mb-4">
					{searchText && (
						<div className="text-center mb-2 text-sm text-gray-600 dark:text-gray-400">
							Showing {filteredTodos.length} result{filteredTodos.length !== 1 ? 's' : ''} for "{searchText}"
						</div>
					)}
					<div className="flex gap-2 justify-center">
						<button
							onClick={() => setFilter('all')}
							className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
						>
							All ({todos.length})
						</button>
						<button
							onClick={() => setFilter('active')}
							className={`px-4 py-2 rounded-lg ${filter === 'active' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
						>
							Active ({todos.filter(t => !t.completed).length})
						</button>
						<button
							onClick={() => setFilter('completed')}
							className={`px-4 py-2 rounded-lg ${filter === 'completed' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
						>
							Completed ({todos.filter(t => t.completed).length})
						</button>
					</div>
				</div>

				{loading ? (
					<div className="text-center py-8">
						<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
						<p className="mt-2 text-gray-600 dark:text-gray-400">Loading todos...</p>
					</div>
				) : (
					<div className="space-y-2">
						{filteredTodos.length === 0 ? (
							<p className="text-center text-gray-500 dark:text-gray-400 py-8">
								{filter === 'all' ? 'No todos yet. Add one above!' : 
								 filter === 'active' ? 'No active todos!' : 'No completed todos!'}
							</p>
						) : (
							filteredTodos.map((todo) => (
								<div
									key={todo.id}
									className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
								>
									<input
										type="checkbox"
										checked={todo.completed}
										onChange={() => toggleTodo(todo.id, todo.completed)}
										className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
									/>
									<span
										className={`flex-1 ${
											todo.completed
												? 'line-through text-gray-500 dark:text-gray-400'
												: 'text-gray-900 dark:text-gray-100'
										}`}
									>
										{todo.text}
									</span>
									<button
										onClick={() => deleteTodo(todo.id)}
										className="px-3 py-1 text-red-600 hover:bg-red-100 rounded"
									>
										Delete
									</button>
								</div>
							))
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default App;
