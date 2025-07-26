import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

console.log('Starting server...');

// Start the server
const server = spawn('node', ['server.js'], {
  stdio: 'inherit'
});

// Wait for server to start
await setTimeout(3000);

console.log('Server should be running now. You can test it at:');
console.log('- Frontend: http://localhost:3000');
console.log('- API: http://localhost:3000/api/todos');
console.log('- Root: http://localhost:3000/');

// Keep the process running
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.kill();
  process.exit(0);
});

// Wait indefinitely
await new Promise(() => {});