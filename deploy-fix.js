import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Deploying Todo App fixes...');

// 1. Ensure dist directory exists and has the built files
console.log('\n1. Checking build files...');
const distPath = path.join(__dirname, 'dist');
const vitereactPublicPath = path.join(__dirname, 'vitereact', 'public');

if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
  console.log('✓ Created dist directory');
}

if (fs.existsSync(vitereactPublicPath)) {
  // Copy files from vitereact/public to dist
  const files = fs.readdirSync(vitereactPublicPath, { withFileTypes: true });
  for (const file of files) {
    const srcPath = path.join(vitereactPublicPath, file.name);
    const destPath = path.join(distPath, file.name);
    
    if (file.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      // Copy directory contents recursively
      const copyDir = (src, dest) => {
        const entries = fs.readdirSync(src, { withFileTypes: true });
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          if (entry.isDirectory()) {
            if (!fs.existsSync(destPath)) {
              fs.mkdirSync(destPath, { recursive: true });
            }
            copyDir(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      };
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  console.log('✓ Copied build files to dist directory');
} else {
  console.log('⚠️  vitereact/public directory not found. Run npm run build in vitereact directory first.');
}

// 2. Check if database file exists
console.log('\n2. Checking database...');
const dbPath = path.join(__dirname, 'todos.db');
if (fs.existsSync(dbPath)) {
  console.log('✓ Database file exists');
} else {
  console.log('✓ Database will be created on first run');
}

// 3. Verify server configuration
console.log('\n3. Verifying server configuration...');
const serverPath = path.join(__dirname, 'server.js');
if (fs.existsSync(serverPath)) {
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  
  // Check for key configurations
  const checks = [
    { name: 'CORS configuration', pattern: /cors\(\{/ },
    { name: 'API endpoints', pattern: /app\.get\("\/api\/todos"/ },
    { name: 'Error handling', pattern: /console\.error/ },
    { name: 'Database initialization', pattern: /sqlite3\.Database/ }
  ];
  
  for (const check of checks) {
    if (check.pattern.test(serverContent)) {
      console.log(`✓ ${check.name} found`);
    } else {
      console.log(`❌ ${check.name} missing`);
    }
  }
} else {
  console.log('❌ server.js not found');
}

// 4. Check frontend configuration
console.log('\n4. Verifying frontend configuration...');
const appPath = path.join(__dirname, 'vitereact', 'src', 'App.tsx');
if (fs.existsSync(appPath)) {
  const appContent = fs.readFileSync(appPath, 'utf8');
  
  if (appContent.includes('123testing-project-yes-api.launchpulse.ai')) {
    console.log('✓ Frontend configured for correct API URL');
  } else {
    console.log('❌ Frontend API URL needs to be updated');
  }
  
  if (appContent.includes('axios.get') && appContent.includes('axios.post')) {
    console.log('✓ Frontend API calls implemented');
  } else {
    console.log('❌ Frontend API calls missing');
  }
} else {
  console.log('❌ App.tsx not found');
}

console.log('\n🎉 Deployment check complete!');
console.log('\nTo start the server:');
console.log('  node server.js');
console.log('\nThe server will be available at:');
console.log('  - Frontend: http://localhost:3000');
console.log('  - API: http://localhost:3000/api/todos');
console.log('  - Health: http://localhost:3000/api/health');