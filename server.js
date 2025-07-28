import express from 'express';
import cors from "cors";
import dotenv from "dotenv";
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database with enhanced error handling and connection management
const dbPath = path.join(__dirname, 'todos.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    console.error('Database path attempted:', dbPath);
    process.exit(1);
  }
  console.log('Connected to SQLite database at:', dbPath);
});

// Handle database connection errors
db.on('error', (err) => {
  console.error('Database error:', err);
});

// Ensure database connection is healthy
db.configure('busyTimeout', 30000); // 30 second timeout for busy database

// Database health check function
function checkDatabaseHealth() {
  return new Promise((resolve, reject) => {
    db.get("SELECT 1 as test", (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Initialize database schema with better error handling
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    completed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating todos table:', err);
      return;
    }
    console.log('Todos table ready');
    
    // Insert sample data if table is empty
    db.get("SELECT COUNT(*) as count FROM todos", (err, row) => {
      if (err) {
        console.error('Error checking todo count:', err);
        return;
      }
      
      if (row && row.count === 0) {
        console.log('Inserting sample data...');
        db.run("INSERT INTO todos (text, completed) VALUES (?, ?)", ['Sample todo item', 0], (err) => {
          if (err) console.error('Error inserting sample todo 1:', err);
        });
        db.run("INSERT INTO todos (text, completed) VALUES (?, ?)", ['Completed sample', 1], (err) => {
          if (err) console.error('Error inserting sample todo 2:', err);
        });
      }
    });
  });
});

const app = express();

const port = process.env.PORT || 3000;

// Enhanced CORS configuration with comprehensive origin handling
app.use(cors({
  origin: function (origin, callback) {
    console.log('CORS check for origin:', origin || 'no-origin');
    
    // Allow requests with no origin (like mobile apps, curl requests, or same-origin)
    if (!origin) {
      console.log('CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'https://sandy-ecuador-compensation-amplifier.trycloudflare.com',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'https://123testing-project-yes.launchpulse.ai',
      'https://123testing-project-yes-api.launchpulse.ai'
    ];
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log('CORS: Allowing origin from allowed list:', origin);
      return callback(null, true);
    }
    
    // Check if origin matches launchpulse.ai pattern
    if (/^https:\/\/.*\.launchpulse\.ai$/.test(origin)) {
      console.log('CORS: Allowing launchpulse.ai subdomain:', origin);
      return callback(null, true);
    }
    
    // Allow localhost with any port for development
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      console.log('CORS: Allowing localhost origin:', origin);
      return callback(null, true);
    }
    
    console.log('CORS: Blocking origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Methods'
  ],
  exposedHeaders: ['Content-Length', 'X-Total-Count', 'X-Request-ID'],
  optionsSuccessStatus: 200,
  preflightContinue: false,
  maxAge: 86400 // 24 hours
}));

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.get('Origin') || 'none'}`);
  next();
});

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// Add request timeout handling with better error handling
app.use((_req, res, next) => {
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      console.log('Request timeout - sending 408 response');
      try {
        res.status(408).json({ 
          error: 'Request timeout',
          timestamp: new Date().toISOString(),
          status: 'timeout'
        });
      } catch (err) {
        console.error('Error sending timeout response:', err);
      }
    }
  }, 30000);
  
  res.on('finish', () => {
    clearTimeout(timeout);
  });
  
  res.on('close', () => {
    clearTimeout(timeout);
  });
  
  next();
});

// Add security headers and ensure JSON responses
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  
  // Only set JSON content type for API routes
  if (req.path.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    // Override res.json to ensure valid JSON responses
    const originalJson = res.json;
    res.json = function(obj) {
      try {
        // Validate that the object can be serialized to JSON
        JSON.stringify(obj);
        return originalJson.call(this, obj);
      } catch (error) {
        console.error('Invalid JSON response object:', error);
        return originalJson.call(this, {
          error: 'Internal server error - invalid response format',
          timestamp: new Date().toISOString(),
          status: 'json_error'
        });
      }
    };
  }
  next();
});

// Serve static files from the 'public' directory with proper headers
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

app.get("/", (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({ 
    message: "Todo API Server", 
    status: "running", 
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    endpoints: [
      "GET /api/health",
      "GET /api/todos",
      "POST /api/todos",
      "PUT /api/todos/:id",
      "DELETE /api/todos/:id"
    ]
  });
});

app.get("/health", (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    database: "connected",
    uptime: process.uptime()
  });
});

app.get("/api/health", async (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  try {
    // Test database connection using the health check function
    await checkDatabaseHealth();
    
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      database: "connected",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: "1.0.0"
    });
  } catch (err) {
    console.error('Database health check failed:', err);
    res.status(503).json({ 
      status: "unhealthy", 
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: err.message,
      uptime: process.uptime()
    });
  }
});

// Handle preflight OPTIONS requests explicitly with comprehensive headers
app.options('/api/*', (req, res) => {
  console.log('OPTIONS request for:', req.path, 'from origin:', req.get('Origin'));
  
  const origin = req.get('Origin');
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Content-Length', '0');
  res.status(204).end();
});

// Todo API endpoints with enhanced error handling and database health checks
app.get("/api/todos", async (_req, res) => {
  console.log('GET /api/todos - Fetching todos');
  
  // Set response headers explicitly
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');
  
  try {
    // Check database health before proceeding
    await checkDatabaseHealth();
    
    db.all('SELECT * FROM todos ORDER BY created_at DESC', (err, rows) => {
      if (err) {
        console.error('Error fetching todos:', err);
        if (!res.headersSent) {
          return res.status(500).json({ 
            error: 'Failed to fetch todos', 
            details: err.message,
            timestamp: new Date().toISOString(),
            status: 'database_error'
          });
        }
        return;
      }
      console.log(`Found ${rows ? rows.length : 0} todos`);
      if (!res.headersSent) {
        res.json(rows || []);
      }
    });
  } catch (error) {
    console.error('Database health check failed in GET /api/todos:', error);
    if (!res.headersSent) {
      res.status(503).json({ 
        error: 'Database unavailable', 
        details: error.message,
        timestamp: new Date().toISOString(),
        status: 'service_unavailable'
      });
    }
  }
});

app.post("/api/todos", async (req, res) => {
  console.log('POST /api/todos - Creating todo:', req.body);
  
  // Set response headers explicitly
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ 
        error: 'Text is required and must be a non-empty string',
        timestamp: new Date().toISOString(),
        status: 'invalid_request'
      });
    }
    
    // Check database health before proceeding
    await checkDatabaseHealth();
    
    db.run('INSERT INTO todos (text) VALUES (?)', [text.trim()], function(err) {
      if (err) {
        console.error('Error creating todo:', err);
        if (!res.headersSent) {
          return res.status(500).json({ 
            error: 'Failed to create todo', 
            details: err.message,
            timestamp: new Date().toISOString(),
            status: 'database_error'
          });
        }
        return;
      }
      
      db.get('SELECT * FROM todos WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          console.error('Error fetching created todo:', err);
          if (!res.headersSent) {
            return res.status(500).json({ 
              error: 'Failed to fetch created todo', 
              details: err.message,
              timestamp: new Date().toISOString(),
              status: 'database_error'
            });
          }
          return;
        }
        console.log('Created todo:', row);
        if (!res.headersSent) {
          res.status(201).json({
            ...row,
            status: 'success',
            timestamp: new Date().toISOString()
          });
        }
      });
    });
  } catch (error) {
    console.error('Database health check failed in POST /api/todos:', error);
    if (!res.headersSent) {
      res.status(503).json({ 
        error: 'Database unavailable',
        details: error.message,
        timestamp: new Date().toISOString(),
        status: 'service_unavailable'
      });
    }
  }
});

app.put("/api/todos/:id", (req, res) => {
  console.log(`PUT /api/todos/${req.params.id} - Updating todo:`, req.body);
  
  // Set response headers explicitly
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const { id } = req.params;
    const { text, completed } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: 'Valid todo ID is required',
        timestamp: new Date().toISOString()
      });
    }
    
    let query = 'UPDATE todos SET updated_at = CURRENT_TIMESTAMP';
    const params = [];
    
    if (text !== undefined) {
      if (typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ 
          error: 'Text must be a non-empty string',
          timestamp: new Date().toISOString()
        });
      }
      query += ', text = ?';
      params.push(text.trim());
    }
    
    if (completed !== undefined) {
      query += ', completed = ?';
      params.push(completed ? 1 : 0);
    }
    
    query += ' WHERE id = ?';
    params.push(parseInt(id));
    
    db.run(query, params, function(err) {
      if (err) {
        console.error('Error updating todo:', err);
        if (!res.headersSent) {
          return res.status(500).json({ 
            error: 'Failed to update todo', 
            details: err.message,
            timestamp: new Date().toISOString()
          });
        }
        return;
      }
      
      if (this.changes === 0) {
        if (!res.headersSent) {
          return res.status(404).json({ 
            error: 'Todo not found',
            timestamp: new Date().toISOString()
          });
        }
        return;
      }
      
      db.get('SELECT * FROM todos WHERE id = ?', [parseInt(id)], (err, row) => {
        if (err) {
          console.error('Error fetching updated todo:', err);
          if (!res.headersSent) {
            return res.status(500).json({ 
              error: 'Failed to fetch updated todo', 
              details: err.message,
              timestamp: new Date().toISOString()
            });
          }
          return;
        }
        console.log('Updated todo:', row);
        if (!res.headersSent) {
          res.json(row);
        }
      });
    });
  } catch (error) {
    console.error('Unexpected error in PUT /api/todos/:id:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
});

app.delete("/api/todos/:id", async (req, res) => {
  console.log(`DELETE /api/todos/${req.params.id} - Deleting todo`);
  
  // Set response headers explicitly
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: 'Valid todo ID is required',
        timestamp: new Date().toISOString(),
        status: 'invalid_request'
      });
    }
    
    // Check database health before proceeding
    await checkDatabaseHealth();
    
    db.run('DELETE FROM todos WHERE id = ?', [parseInt(id)], function(err) {
      if (err) {
        console.error('Error deleting todo:', err);
        if (!res.headersSent) {
          return res.status(500).json({ 
            error: 'Failed to delete todo', 
            details: err.message,
            timestamp: new Date().toISOString(),
            status: 'database_error'
          });
        }
        return;
      }
      
      if (this.changes === 0) {
        if (!res.headersSent) {
          return res.status(404).json({ 
            error: 'Todo not found',
            timestamp: new Date().toISOString(),
            status: 'not_found'
          });
        }
        return;
      }
      
      console.log(`Successfully deleted todo with id: ${id}, changes: ${this.changes}`);
      if (!res.headersSent) {
        res.json({ 
          message: 'Todo deleted successfully', 
          id: parseInt(id),
          changes: this.changes,
          timestamp: new Date().toISOString(),
          status: 'success'
        });
      }
    });
  } catch (error) {
    console.error('Database health check failed in DELETE /api/todos/:id:', error);
    if (!res.headersSent) {
      res.status(503).json({ 
        error: 'Database unavailable',
        details: error.message,
        timestamp: new Date().toISOString(),
        status: 'service_unavailable'
      });
    }
  }
});

// 404 handler for API routes (must come before static files)
app.use('/api/*', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(404).json({ 
    error: 'API endpoint not found', 
    path: req.path,
    timestamp: new Date().toISOString(),
    status: 'not_found'
  });
});

// Serve static files from the dist directory (after API routes)
app.use(express.static(path.join(__dirname, 'dist')));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  
  // Ensure we always send JSON response
  if (!res.headersSent) {
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      error: 'Internal server error', 
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
      timestamp: new Date().toISOString(),
      status: 'error'
    });
  }
});

// Catch-all route for SPA routing
app.get('*', (_req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Frontend not built. Run npm run build first.' });
  }
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port} and listening on 0.0.0.0`);
  console.log(`Available at: http://localhost:${port}`);
});
