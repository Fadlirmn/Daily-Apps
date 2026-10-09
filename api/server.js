import express from 'express';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';

const { Pool } = pg;
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'postgres',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'fintrack',
  user: process.env.POSTGRES_USER || 'fintrack',
  password: process.env.POSTGRES_PASSWORD || 'fintrack_secret',
});

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeychangeit';
const app = express();
app.use(cors());
app.use(express.json());

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const result = await pool.query('SELECT id, email, password_hash FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, name, monthly_income, wealth_goal, currency, start_balance, created_at FROM users WHERE id = $1', [req.user.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, monthly_income, wealth_goal, currency, start_balance } = req.body;
    const result = await pool.query(
      `UPDATE users SET 
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        monthly_income = COALESCE($3, monthly_income),
        wealth_goal = COALESCE($4, wealth_goal),
        currency = COALESCE($5, currency),
        start_balance = COALESCE($6, start_balance)
       WHERE id = $7 RETURNING id, email, name, monthly_income, wealth_goal, currency, start_balance`,
      [name, email, monthly_income, wealth_goal, currency, start_balance, req.user.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Password lama dan baru wajib diisi' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Password baru minimal 6 karakter' });
  try {
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(oldPassword, result.rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Password lama salah' });
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.userId]);
    res.json({ success: true, message: 'Password berhasil diganti' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const resources = ['transactions', 'categories', 'fixed_expenses', 'budgets', 'goals', 'tasks', 'habits', 'schedules'];

resources.forEach(resource => {
  app.get(`/api/${resource}`, authenticateToken, async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${resource} WHERE user_id = $1`, [req.user.userId]);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post(`/api/${resource}`, authenticateToken, async (req, res) => {
    try {
      const keys = Object.keys(req.body).filter(k => k !== 'id' && k !== 'user_id' && k !== 'created_at');
      const values = keys.map(k => req.body[k]);
      
      if (keys.length === 0) {
        const result = await pool.query(
          `INSERT INTO ${resource} (user_id) VALUES ($1) RETURNING *`,
          [req.user.userId]
        );
        return res.status(201).json(result.rows[0]);
      }

      const placeholders = keys.map((_, i) => `$${i + 2}`).join(', ');
      const columns = keys.join(', ');
      
      const query = `INSERT INTO ${resource} (user_id, ${columns}) VALUES ($1, ${placeholders}) RETURNING *`;
      const result = await pool.query(query, [req.user.userId, ...values]);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put(`/api/${resource}/:id`, authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const keys = Object.keys(req.body).filter(k => k !== 'id' && k !== 'user_id' && k !== 'created_at');
      if (keys.length === 0) return res.status(400).json({ error: 'No fields to update' });

      const setClause = keys.map((k, i) => `${k} = $${i + 3}`).join(', ');
      const values = keys.map(k => req.body[k]);

      const query = `UPDATE ${resource} SET ${setClause} WHERE id = $1 AND user_id = $2 RETURNING *`;
      const result = await pool.query(query, [id, req.user.userId, ...values]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Resource not found or unauthorized' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete(`/api/${resource}/:id`, authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(`DELETE FROM ${resource} WHERE id = $1 AND user_id = $2 RETURNING id`, [id, req.user.userId]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Resource not found or unauthorized' });
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API service running on port ${PORT}`);
});
