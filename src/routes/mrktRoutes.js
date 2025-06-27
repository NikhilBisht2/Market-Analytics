import express from 'express';
import db from '../db.js';

const router = express.Router();

// Search stocks 
router.get('/search', (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Missing search query' });

  const stmt = db.prepare(`
    SELECT symbol, name FROM stocks
    WHERE symbol LIKE ? OR name LIKE ?
    LIMIT 10
  `);

  const results = stmt.all(`%${query}%`, `%${query}%`);
  res.json(results);
});

export default router;
