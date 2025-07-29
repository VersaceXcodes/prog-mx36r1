import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

async function testLabelFunctionality() {
  try {
    console.log('Testing label functionality...');
    
    // Test 1: Get existing todos
    console.log('\n1. Getting existing todos...');
    const todosResponse = await axios.get(`${API_BASE_URL}/api/todos`);
    console.log('Existing todos:', JSON.stringify(todosResponse.data, null, 2));
    
    // Test 2: Create a new todo with label
    console.log('\n2. Creating new todo with important label...');
    const newTodoResponse = await axios.post(`${API_BASE_URL}/api/todos`, {
      text: 'Test todo with important label',
      label: 'important'
    });
    console.log('Created todo:', JSON.stringify(newTodoResponse.data, null, 2));
    
    // Test 3: Update todo label
    if (todosResponse.data.length > 0) {
      const todoId = todosResponse.data[0].id;
      console.log(`\n3. Updating todo ${todoId} label to urgent...`);
      const updateResponse = await axios.put(`${API_BASE_URL}/api/todos/${todoId}`, {
        label: 'urgent'
      });
      console.log('Updated todo:', JSON.stringify(updateResponse.data, null, 2));
    }
    
    // Test 4: Get todos again to verify changes
    console.log('\n4. Getting todos after updates...');
    const finalTodosResponse = await axios.get(`${API_BASE_URL}/api/todos`);
    console.log('Final todos:', JSON.stringify(finalTodosResponse.data, null, 2));
    
    console.log('\n✅ Label functionality test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testLabelFunctionality();