import http from 'http';

function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('Testing server endpoints...');
  
  try {
    // Test root endpoint
    const root = await testEndpoint('/');
    console.log('Root endpoint:', root);
    
    // Test todos endpoint
    const todos = await testEndpoint('/api/todos');
    console.log('Todos endpoint:', todos);
    
    // Test creating a todo
    const newTodo = await testEndpoint('/api/todos', 'POST', { text: 'Test todo from script' });
    console.log('Create todo:', newTodo);
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests();