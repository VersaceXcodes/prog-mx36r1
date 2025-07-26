import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 Starting deployment process...');

try {
  // Step 1: Build the frontend
  console.log('📦 Building frontend...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Step 2: Check if dist directory exists
  if (!fs.existsSync('dist')) {
    throw new Error('Build failed - dist directory not found');
  }
  
  console.log('✅ Frontend built successfully');
  
  // Step 3: Check server dependencies
  console.log('🔍 Checking server dependencies...');
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = ['express', 'cors', 'dotenv', 'sqlite3'];
  
  for (const dep of requiredDeps) {
    if (!packageJson.dependencies[dep]) {
      throw new Error(`Missing dependency: ${dep}`);
    }
  }
  
  console.log('✅ All dependencies present');
  
  // Step 4: Test server syntax
  console.log('🧪 Testing server syntax...');
  execSync('node -c server.js', { stdio: 'inherit' });
  console.log('✅ Server syntax is valid');
  
  console.log('🎉 Deployment ready! Run "node server.js" to start the application.');
  console.log('📍 The app will be available at http://localhost:3000');
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}