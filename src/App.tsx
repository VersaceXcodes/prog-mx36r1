import { FC, useEffect, useState } from "react";
import axios from "axios";

interface Todo {
	id: number;
	text: string;
	completed: boolean;
	created_at: string;
	updated_at: string;
}

const API_BASE_URL = import.meta.env.PROD 
	? 'https://123testing-project-yes.launchpulse.ai/api' 
	: 'http://localhost:3000/api';

const App: FC = () => {
	const [todos, setTodos] = useState<Todo[]>([]);
	const [newTodoText, setNewTodoText] = useState('');
	const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchTodos = async () => {
		try {
			setError(null);
			const response = await axios.get(`${API_BASE_URL}/todos`);
			setTodos(response.data);
		} catch (err) {
			console.error('Error fetching todos:', err);
			setError('Failed to fetch todos. Please check your connection.');
		} finally {
			setLoading(false);
		}
	};

	const addTodo = async () => {
		if (!newTodoText.trim()) return;
		
		try {
			const response = await axios.post(`${API_BASE_URL}/todos`, {
				text: newTodoText.trim()
			});
			setTodos([response.data, ...todos]);
			setNewTodoText('');
		} catch (err) {
			console.error('Error adding todo:', err);
			setError('Failed to add todo. Please try again.');
		}
	};

	const toggleTodo = async (id: number, completed: boolean) => {
		try {
			const response = await axios.put(`${API_BASE_URL}/todos/${id}`, {
				completed: !completed
			});
			setTodos(todos.map(todo => 
				todo.id === id ? response.data : todo
			));
		} catch (err) {
			console.error('Error updating todo:', err);
			setError('Failed to update todo. Please try again.');
		}
	};

	const deleteTodo = async (id: number) => {
		try {
			await axios.delete(`${API_BASE_URL}/todos/${id}`);
			setTodos(todos.filter(todo => todo.id !== id));
		} catch (err) {
			console.error('Error deleting todo:', err);
			setError('Failed to delete todo. Please try again.');
		}
	};

	useEffect(() => {
		fetchTodos();
	}, []);

	const filteredTodos = todos.filter(todo => {
		if (filter === 'active') return !todo.completed;
		if (filter === 'completed') return todo.completed;
		return true;
	});

	if (loading) {
		return (
			<div className="container mx-auto max-w-2xl p-6 mt-8">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading todos...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto max-w-2xl p-6 mt-8">
			<div className="bg-white rounded-lg shadow-lg p-6">
				<h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Todo App</h1>
				
				{error && (
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
						{error}
						<button 
							onClick={() => setError(null)}
							className="float-right text-red-700 hover:text-red-900"
						>
							×
						</button>
					</div>
				)}

				{/* Add Todo Form */}
				<div className="flex gap-2 mb-6">
					<input
						type="text"
						value={newTodoText}
						onChange={(e) => setNewTodoText(e.target.value)}
						onKeyDown={(e) => e.key === 'Enter' && addTodo()}
						placeholder="Add a new todo..."
						className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<button
						onClick={addTodo}
						className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						Add
					</button>
				</div>

				{/* Filter Buttons */}
				<div className="flex gap-2 mb-6">
					{(['all', 'active', 'completed'] as const).map((filterType) => (
						<button
							key={filterType}
							onClick={() => setFilter(filterType)}
							className={`px-4 py-2 rounded-lg capitalize ${
								filter === filterType
									? 'bg-blue-600 text-white'
									: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
							}`}
						>
							{filterType}
						</button>
					))}
				</div>

				{/* Todo List */}
				<div className="space-y-2">
					{filteredTodos.length === 0 ? (
						<p className="text-gray-500 text-center py-8">
							{filter === 'all' ? 'No todos yet. Add one above!' : `No ${filter} todos.`}
						</p>
					) : (
						filteredTodos.map((todo) => (
							<div
								key={todo.id}
								className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
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
											? 'text-gray-500 line-through'
											: 'text-gray-800'
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

				{/* Stats */}
				{todos.length > 0 && (
					<div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-600 text-center">
						{todos.filter(t => !t.completed).length} active, {todos.filter(t => t.completed).length} completed
					</div>
				)}
			</div>
		</div>
	);
};

export default App;
