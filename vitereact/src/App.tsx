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

const API_BASE_URL = process.env.NODE_ENV === 'production' 
	? 'https://123testing-project-yes.launchpulse.ai' 
	: 'http://localhost:3000';

const App: React.FC = () => {
	const [todos, setTodos] = useState<Todo[]>([]);
	const [newTodoText, setNewTodoText] = useState("");
	const [filter, setFilter] = useState<FilterType>('all');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchTodos();
	}, []);

	const fetchTodos = async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await axios.get(`${API_BASE_URL}/api/todos`);
			setTodos(response.data);
		} catch (err) {
			setError('Failed to fetch todos');
			console.error('Error fetching todos:', err);
		} finally {
			setLoading(false);
		}
	};

	const addTodo = async () => {
		if (!newTodoText.trim()) return;
		
		try {
			setError(null);
			const response = await axios.post(`${API_BASE_URL}/api/todos`, {
				text: newTodoText.trim()
			});
			setTodos([response.data, ...todos]);
			setNewTodoText("");
		} catch (err) {
			setError('Failed to add todo');
			console.error('Error adding todo:', err);
		}
	};

	const toggleTodo = async (id: number, completed: boolean) => {
		try {
			setError(null);
			const response = await axios.put(`${API_BASE_URL}/api/todos/${id}`, {
				completed: !completed
			});
			setTodos(todos.map(todo => 
				todo.id === id ? response.data : todo
			));
		} catch (err) {
			setError('Failed to update todo');
			console.error('Error updating todo:', err);
		}
	};

	const deleteTodo = async (id: number) => {
		try {
			setError(null);
			await axios.delete(`${API_BASE_URL}/api/todos/${id}`);
			setTodos(todos.filter(todo => todo.id !== id));
		} catch (err) {
			setError('Failed to delete todo');
			console.error('Error deleting todo:', err);
		}
	};

	const filteredTodos = todos.filter(todo => {
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
					<div className="flex gap-2">
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
				</div>

				<div className="mb-4 flex gap-2 justify-center">
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
