import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('Testing Todo API...');
  
  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const health = await axios.get(`${API_BASE_URL}/api/health`);
    console.log('✓ Health check:', health.data);
    
    // Test get todos
    console.log('\n2. Testing GET /api/todos...');
    const todos = await axios.get(`${API_BASE_URL}/api/todos`);
    console.log('✓ Get todos:', todos.data);
    
    // Test create todo
    console.log('\n3. Testing POST /api/todos...');
    const newTodo = await axios.post(`${API_BASE_URL}/api/todos`, {
      text: 'Test todo from API test'
    });
    console.log('✓ Created todo:', newTodo.data);
    
    // Test update todo
    console.log('\n4. Testing PUT /api/todos/:id...');
    const updatedTodo = await axios.put(`${API_BASE_URL}/api/todos/${newTodo.data.id}`, {
      completed: true
    });
    console.log('✓ Updated todo:', updatedTodo.data);
    
    // Test delete todo
    console.log('\n5. Testing DELETE /api/todos/:id...');
    const deleteResult = await axios.delete(`${API_BASE_URL}/api/todos/${newTodo.data.id}`);
    console.log('✓ Deleted todo:', deleteResult.data);
    
    console.log('\n✅ All API tests passed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAPI();
}

export default testAPI;