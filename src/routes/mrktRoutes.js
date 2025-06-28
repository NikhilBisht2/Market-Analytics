import express from 'express';
import db from '../db.js';
import * as finnhub from 'finnhub';
import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';

const api_key = finnhub.ApiClient.instance.authentications['api_key'];
api_key.apiKey = process.env.API_KEY;
const finnhubClient = new finnhub.DefaultApi();
const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET;

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

// fetch news
router.get('/news', (req, res) => {
  finnhubClient.marketNews('general', {}, (err, data) => {
    if (err) {
      console.error('Finnhub news error:', err);
      return res.status(500).json({ error: 'Failed to fetch news' });
    }
    res.json(data.slice(0, 3)); 
  });
});

// user stocks
router.post('/save-stock', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  let userId;
  try {
    const decoded = jwt.verify(token, SECRET_KEY); 
    userId = decoded.id;
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }

  const { symbol } = req.body;

  try {
    const stmt = db.prepare('INSERT OR IGNORE INTO user_stocks (user_id, stock_symbol) VALUES (?, ?)');
    stmt.run(userId, symbol);
    res.status(200).json({ message: 'Stock saved.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save stock.' });
  }
});

export default router;
