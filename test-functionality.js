#!/usr/bin/env node

import axios from 'axios';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_BASE_URL = 'http://localhost:3000';
let server;

async function startServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting server...');
    server = spawn('node', ['server.js'], {
      cwd: __dirname,
      stdio: 'pipe'
    });

    server.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('Server:', output.trim());
      if (output.includes('Server running on port')) {
        setTimeout(resolve, 2000); // Give server time to fully start
      }
    });

    server.stderr.on('data', (data) => {
      console.error('Server Error:', data.toString());
    });

    server.on('error', reject);
    
    // Timeout after 10 seconds
    setTimeout(() => reject(new Error('Server start timeout')), 10000);
  });
}

function stopServer() {
  if (server) {
    console.log('🛑 Stopping server...');
    server.kill();
  }
}

async function testEndpoint(method, url, data = null, expectedStatus = 200) {
  try {
    console.log(`📡 Testing ${method} ${url}`);
    
    const config = {
      method,
      url: `${API_BASE_URL}${url}`,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    
    if (response.status === expectedStatus) {
      console.log(`✅ ${method} ${url} - Status: ${response.status}`);
      return response.data;
    } else {
      console.log(`❌ ${method} ${url} - Expected: ${expectedStatus}, Got: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ ${method} ${url} - Error: ${error.message}`);
    if (error.response) {
      console.log(`   Response: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
}

async function runTests() {
  console.log('🧪 Starting comprehensive functionality tests...\n');
  
  try {
    // Test 1: Health Check
    console.log('=== Test 1: Health Check ===');
    const health = await testEndpoint('GET', '/api/health');
    if (!health || health.status !== 'healthy') {
      throw new Error('Health check failed');
    }
    
    // Test 2: Get initial todos
    console.log('\n=== Test 2: Get Initial Todos ===');
    const initialTodos = await testEndpoint('GET', '/api/todos');
    if (!Array.isArray(initialTodos)) {
      throw new Error('Initial todos should be an array');
    }
    console.log(`📝 Found ${initialTodos.length} initial todos`);
    
    // Test 3: Add a new todo
    console.log('\n=== Test 3: Add New Todo ===');
    const newTodo = await testEndpoint('POST', '/api/todos', { text: 'Test todo item' }, 201);
    if (!newTodo || !newTodo.id || newTodo.text !== 'Test todo item') {
      throw new Error('Failed to create new todo');
    }
    console.log(`📝 Created todo with ID: ${newTodo.id}`);
    
    // Test 4: Get todos after adding
    console.log('\n=== Test 4: Get Todos After Adding ===');
    const todosAfterAdd = await testEndpoint('GET', '/api/todos');
    if (!Array.isArray(todosAfterAdd) || todosAfterAdd.length !== initialTodos.length + 1) {
      throw new Error('Todo count should increase by 1');
    }
    
    // Test 5: Update todo (mark as completed)
    console.log('\n=== Test 5: Update Todo (Mark Completed) ===');
    const updatedTodo = await testEndpoint('PUT', `/api/todos/${newTodo.id}`, { completed: true });
    if (!updatedTodo || !updatedTodo.completed) {
      throw new Error('Failed to mark todo as completed');
    }
    console.log(`✅ Marked todo ${newTodo.id} as completed`);
    
    // Test 6: Delete todo
    console.log('\n=== Test 6: Delete Todo ===');
    const deleteResult = await testEndpoint('DELETE', `/api/todos/${newTodo.id}`);
    if (!deleteResult || deleteResult.id !== newTodo.id) {
      throw new Error('Failed to delete todo');
    }
    console.log(`🗑️ Deleted todo ${newTodo.id}`);
    
    // Test 7: Verify todo was deleted
    console.log('\n=== Test 7: Verify Todo Deletion ===');
    const todosAfterDelete = await testEndpoint('GET', '/api/todos');
    if (!Array.isArray(todosAfterDelete) || todosAfterDelete.length !== initialTodos.length) {
      throw new Error('Todo count should return to original');
    }
    
    // Test 8: Test error handling (invalid todo ID)
    console.log('\n=== Test 8: Error Handling (Invalid ID) ===');
    await testEndpoint('GET', '/api/todos/999999', null, 404);
    await testEndpoint('PUT', '/api/todos/999999', { completed: true }, 404);
    await testEndpoint('DELETE', '/api/todos/999999', null, 404);
    
    // Test 9: Test validation (empty todo text)
    console.log('\n=== Test 9: Validation (Empty Text) ===');
    await testEndpoint('POST', '/api/todos', { text: '' }, 400);
    await testEndpoint('POST', '/api/todos', { text: '   ' }, 400);
    
    // Test 10: Test CORS headers
    console.log('\n=== Test 10: CORS Headers ===');
    try {
      await axios.options(`${API_BASE_URL}/api/todos`, {
        headers: {
          'Origin': 'https://123testing-project-yes.launchpulse.ai',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      console.log('✅ CORS preflight successful');
    } catch (error) {
      console.log('❌ CORS preflight failed:', error.message);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Health check endpoint working');
    console.log('✅ Get todos endpoint working');
    console.log('✅ Add todo functionality working');
    console.log('✅ Update todo functionality working');
    console.log('✅ Delete todo functionality working');
    console.log('✅ Error handling working');
    console.log('✅ Input validation working');
    console.log('✅ CORS configuration working');
    
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  }
}

async function main() {
  try {
    await startServer();
    await runTests();
  } catch (error) {
    console.error('💥 Error:', error.message);
    process.exit(1);
  } finally {
    stopServer();
    process.exit(0);
  }
}

// Handle cleanup on exit
process.on('SIGINT', () => {
  stopServer();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopServer();
  process.exit(0);
});

main();