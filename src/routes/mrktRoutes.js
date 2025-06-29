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

// Middleware verify JWT and extract user ID
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden: Invalid token' });
  }
};

// get user stock-info
router.get('/userStocks', authenticateToken, async (req, res) => {
  const userId = req.userId;

  try {
    const stmt = db.prepare('SELECT stock_symbol FROM user_stocks WHERE user_id = ?');
    const userStockSymbols = stmt.all(userId);

    const stockInfoPromises = userStockSymbols.map(async (row) => {
      const symbol = row.stock_symbol;
      return new Promise((resolve, reject) => {
        finnhubClient.quote(symbol, (err, data) => {
          if (err) {
            console.error(`Finnhub quote error for ${symbol}:`, err);
            resolve(null); 
          } else {
            const stockNameStmt = db.prepare('SELECT name FROM stocks WHERE symbol = ?');
            const stockNameResult = stockNameStmt.get(symbol);
            const stockName = stockNameResult ? stockNameResult.name : symbol; 

            resolve({
              symbol: symbol,
              name: stockName,
              currentPrice: data.c,
              priceChange: data.d,
              percentChange: data.dp,
            });
          }
        });
      });
    });

    const userStocks = await Promise.all(stockInfoPromises);
    res.json(userStocks.filter(stock => stock !== null)); 
  } catch (err) {
    console.error('Database or Finnhub error fetching user stocks:', err);
    res.status(500).json({ error: 'Failed to fetch user stocks' });
  }
});

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

// save user stocks
router.post('/save-stock', authenticateToken, (req, res) => { 
  const userId = req.userId;
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
