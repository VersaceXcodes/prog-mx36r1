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

// Initialize SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'todos.db'));

// Initialize database schema
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    completed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // Insert sample data if table is empty
  db.get("SELECT COUNT(*) as count FROM todos", (err, row) => {
    if (!err && row.count === 0) {
      db.run("INSERT INTO todos (text, completed) VALUES (?, ?)", ['Sample todo item', 0]);
      db.run("INSERT INTO todos (text, completed) VALUES (?, ?)", ['Completed sample', 1]);
    }
  });
});

const app = express();

const port = process.env.PORT || 3000;

// Enhanced CORS configuration with additional headers
app.use(cors({
  origin: [
    'https://sandy-ecuador-compensation-amplifier.trycloudflare.com',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'https://123testing-project-yes.launchpulse.ai',
    'https://123testing-project-yes-api.launchpulse.ai',
    /^https:\/\/.*\.launchpulse\.ai$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.get('Origin') || 'none'}`);
  next();
});

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// Add request timeout handling
app.use((_req, res, next) => {
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      console.log('Request timeout');
      res.status(408).json({ error: 'Request timeout' });
    }
  }, 30000);
  
  res.on('finish', () => {
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
  res.json({ message: "Todo API Server", status: "running", timestamp: new Date().toISOString() });
});

app.get("/health", (_req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Handle preflight OPTIONS requests explicitly
app.options('/api/*', (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.status(200).end();
});

// Todo API endpoints with enhanced error handling
app.get("/api/todos", (_req, res) => {
  console.log('GET /api/todos - Fetching todos');
  
  // Set response headers explicitly
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');
  
  try {
    db.all('SELECT * FROM todos ORDER BY created_at DESC', (err, rows) => {
      if (err) {
        console.error('Error fetching todos:', err);
        if (!res.headersSent) {
          return res.status(500).json({ 
            error: 'Failed to fetch todos', 
            details: err.message,
            timestamp: new Date().toISOString()
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
    console.error('Unexpected error in GET /api/todos:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error', 
        timestamp: new Date().toISOString()
      });
    }
  }
});

app.post("/api/todos", (req, res) => {
  console.log('POST /api/todos - Creating todo:', req.body);
  
  // Set response headers explicitly
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ 
        error: 'Text is required and must be a non-empty string',
        timestamp: new Date().toISOString()
      });
    }
    
    db.run('INSERT INTO todos (text) VALUES (?)', [text.trim()], function(err) {
      if (err) {
        console.error('Error creating todo:', err);
        if (!res.headersSent) {
          return res.status(500).json({ 
            error: 'Failed to create todo', 
            details: err.message,
            timestamp: new Date().toISOString()
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
              timestamp: new Date().toISOString()
            });
          }
          return;
        }
        console.log('Created todo:', row);
        if (!res.headersSent) {
          res.status(201).json(row);
        }
      });
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/todos:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
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

app.delete("/api/todos/:id", (req, res) => {
  console.log(`DELETE /api/todos/${req.params.id} - Deleting todo`);
  
  // Set response headers explicitly
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: 'Valid todo ID is required',
        timestamp: new Date().toISOString()
      });
    }
    
    db.run('DELETE FROM todos WHERE id = ?', [parseInt(id)], function(err) {
      if (err) {
        console.error('Error deleting todo:', err);
        if (!res.headersSent) {
          return res.status(500).json({ 
            error: 'Failed to delete todo', 
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
      
      console.log(`Deleted todo with id: ${id}`);
      if (!res.headersSent) {
        res.json({ 
          message: 'Todo deleted successfully', 
          id: parseInt(id),
          timestamp: new Date().toISOString()
        });
      }
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/todos/:id:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
});

// 404 handler for API routes (must come before static files)
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found', path: req.path });
});

// Serve static files from the dist directory (after API routes)
app.use(express.static(path.join(__dirname, 'dist')));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
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
