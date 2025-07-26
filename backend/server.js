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

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'https://123testing-project-yes.launchpulse.ai'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: "5mb" }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (_req, res) => {
  res.json({ message: "Todo API Server", status: "running" });
});

// Todo API endpoints
app.get("/api/todos", (_req, res) => {
  db.all('SELECT * FROM todos ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      console.error('Error fetching todos:', err);
      return res.status(500).json({ error: 'Failed to fetch todos' });
    }
    res.json(rows);
  });
});

app.post("/api/todos", (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }
  
  db.run('INSERT INTO todos (text) VALUES (?)', [text], function(err) {
    if (err) {
      console.error('Error creating todo:', err);
      return res.status(500).json({ error: 'Failed to create todo' });
    }
    
    db.get('SELECT * FROM todos WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        console.error('Error fetching created todo:', err);
        return res.status(500).json({ error: 'Failed to fetch created todo' });
      }
      res.status(201).json(row);
    });
  });
});

app.put("/api/todos/:id", (req, res) => {
  const { id } = req.params;
  const { text, completed } = req.body;
  
  let query = 'UPDATE todos SET updated_at = CURRENT_TIMESTAMP';
  const params = [];
  
  if (text !== undefined) {
    query += ', text = ?';
    params.push(text);
  }
  
  if (completed !== undefined) {
    query += ', completed = ?';
    params.push(completed ? 1 : 0);
  }
  
  query += ' WHERE id = ?';
  params.push(id);
  
  db.run(query, params, function(err) {
    if (err) {
      console.error('Error updating todo:', err);
      return res.status(500).json({ error: 'Failed to update todo' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    db.get('SELECT * FROM todos WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Error fetching updated todo:', err);
        return res.status(500).json({ error: 'Failed to fetch updated todo' });
      }
      res.json(row);
    });
  });
});

app.delete("/api/todos/:id", (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM todos WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting todo:', err);
      return res.status(500).json({ error: 'Failed to delete todo' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.json({ message: 'Todo deleted successfully' });
  });
});

// Catch-all route for SPA routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(3000, '0.0.0.0', () => {
  console.log(`Server running on port 3000 and listening on 0.0.0.0`);
});
