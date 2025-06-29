import dotenv from 'dotenv';
import express from 'express';
import * as finnhub from 'finnhub';

import db from '../db.js';

dotenv.config();
import jwt from 'jsonwebtoken';
import request from 'request';

const finnhub_api_key = finnhub.ApiClient.instance.authentications['api_key'];
finnhub_api_key.apiKey = process.env.API_KEY;
const finnhubClient = new finnhub.DefaultApi();

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET;

// Middleware verify JWT and extract user ID
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token)
    return res.status(401).json({error: 'Unauthorized: No token provided'});

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(403).json({error: 'Forbidden: Invalid token'});
  }
};

// get user stock-info
router.get('/userStocks', authenticateToken, async (req, res) => {
  const userId = req.userId;

  try {
    const stmt =
        db.prepare('SELECT stock_symbol FROM user_stocks WHERE user_id = ?');
    const userStockSymbols = stmt.all(userId);

    const stockInfoPromises = userStockSymbols.map(async (row) => {
      const symbol = row.stock_symbol;
      return new Promise((resolve, reject) => {
        finnhubClient.quote(symbol, (err, data) => {
          if (err) {
            console.error(`Finnhub quote error for ${symbol}:`, err);
            resolve(null);
          } else {
            const stockNameStmt =
                db.prepare('SELECT name FROM stocks WHERE symbol = ?');
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
    res.status(500).json({error: 'Failed to fetch user stocks'});
  }
});

// Search stocks
router.get('/search', (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({error: 'Missing search query'});

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
      return res.status(500).json({error: 'Failed to fetch news'});
    }
    res.json(data.slice(0, 3));
  });
});

// save user stocks
router.post('/save-stock', authenticateToken, (req, res) => {
  const userId = req.userId;
  const {symbol} = req.body;

  try {
    const stmt = db.prepare(
        'INSERT OR IGNORE INTO user_stocks (user_id, stock_symbol) VALUES (?, ?)');
    stmt.run(userId, symbol);
    res.status(200).json({message: 'Stock saved.'});
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'Failed to save stock.'});
  }
});

// Delete user stock
router.delete('/delete-stock', authenticateToken, (req, res) => {
  const userId = req.userId;
  const {symbol} = req.body;

  if (!symbol) {
    return res.status(400).json({error: 'Missing stock symbol to delete.'});
  }

  try {
    // Check if the stock belongs to the user before deleting
    const checkStmt = db.prepare(
        'SELECT COUNT(*) AS count FROM user_stocks WHERE user_id = ? AND stock_symbol = ?');
    const result = checkStmt.get(userId, symbol);

    if (result.count === 0) {
      return res.status(404).json(
          {error: 'Stock not found in your portfolio.'});
    }

    const deleteStmt = db.prepare(
        'DELETE FROM user_stocks WHERE user_id = ? AND stock_symbol = ?');
    const info = deleteStmt.run(userId, symbol);

    if (info.changes > 0) {
      res.status(200).json({message: 'Stock deleted successfully.'});
    } else {
      res.status(500).json({error: 'Failed to delete stock.'});
    }
  } catch (err) {
    console.error('Database error deleting stock:', err);
    res.status(500).json({error: 'Failed to delete stock.'});
  }
});


// Helper function to fetch data from Alpha Vantage
const fetchAlphaVantageData = (symbol, interval, outputsize) => {
  return new Promise((resolve, reject) => {
    const url =
        `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${
            symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${
            ALPHA_VANTAGE_API_KEY}`;
    request.get(
        {url: url, json: true, headers: {'User-Agent': 'request'}},
        (err, res, data) => {
          if (err) {
            console.error('Alpha Vantage request error:', err);
            return reject(err);
          }
          if (res.statusCode !== 200) {
            console.error('Alpha Vantage API status:', res.statusCode, data);
            return reject(new Error(
                `Alpha Vantage API returned status ${res.statusCode}`));
          }
          if (data['Error Message']) {
            console.error(
                'Alpha Vantage Error Message:', data['Error Message']);
            return reject(new Error(data['Error Message']));
          }
          if (data['Information']) {
            console.warn('Alpha Vantage Information:', data['Information']);
          }
          resolve(data);
        });
  });
};


// Fetch historical stock data
router.get('/stock-chart', authenticateToken, async (req, res) => {
  const {symbol, range} = req.query;

  if (!symbol || !range) {
    return res.status(400).json(
        {error: 'Missing symbol or range for chart data'});
  }

  let interval = '15min';
  let outputsize = 'compact';
  let timeSeriesKey;
  let functionType = 'TIME_SERIES_INTRADAY';

  switch (parseInt(range)) {
    case 1:
      interval = '5min';
      outputsize = 'compact';
      timeSeriesKey = `Time Series (${interval})`;
      break;
    case 7:
      functionType = 'TIME_SERIES_DAILY';
      outputsize = 'compact';
      timeSeriesKey = `Time Series (Daily)`;
      break;
    case 30:
      functionType = 'TIME_SERIES_DAILY';
      outputsize = 'full';
      timeSeriesKey = `Time Series (Daily)`;
      break;
    case 90:
      functionType = 'TIME_SERIES_DAILY';
      outputsize = 'full';
      timeSeriesKey = `Time Series (Daily)`;
      break;
    case 180:
      functionType = 'TIME_SERIES_DAILY';
      outputsize = 'full';
      timeSeriesKey = `Time Series (Daily)`;
      break;
    case 365:
      functionType = 'TIME_SERIES_DAILY';
      outputsize = 'full';
      timeSeriesKey = `Time Series (Daily)`;
      break;
    default:
      interval = '5min';
      outputsize = 'compact';
      timeSeriesKey = `Time Series (${interval})`;
      break;
  }

  try {
    let alphaVantageUrl;
    if (functionType === 'TIME_SERIES_INTRADAY') {
      alphaVantageUrl = `https://www.alphavantage.co/query?function=${
          functionType}&symbol=${symbol}&interval=${interval}&outputsize=${
          outputsize}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    } else {
      alphaVantageUrl =
          `https://www.alphavantage.co/query?function=${functionType}&symbol=${
              symbol}&outputsize=${outputsize}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    }

    request.get(
        {url: alphaVantageUrl, json: true, headers: {'User-Agent': 'request'}},
        (err, response, data) => {
          if (err) {
            console.error('Alpha Vantage request error:', err);
            return res.status(500).json({
              error:
                  'Failed to fetch chart data from Alpha Vantage (network error)'
            });
          }
          if (response.statusCode !== 200) {
            console.error(
                'Alpha Vantage API status:', response.statusCode, data);
            return res.status(response.statusCode).json({
              error: `Alpha Vantage API returned status ${response.statusCode}`
            });
          }
          if (data['Error Message']) {
            console.error(
                'Alpha Vantage Error Message:', data['Error Message']);
            return res.status(500).json({error: data['Error Message']});
          }
          if (!data[timeSeriesKey]) {
            console.warn(
                `Alpha Vantage: No '${timeSeriesKey}' found for ${
                    symbol} with range ${range}. Data:`,
                data);
            return res.status(200).json({t: [], c: []});
          }

          const timeSeries = data[timeSeriesKey];
          const labels = [];
          const closePrices = [];
          const dates = Object.keys(timeSeries).reverse();

          dates.forEach(date => {
            labels.push(date);
            closePrices.push(parseFloat(timeSeries[date]['4. close']));
          });

          res.json({
            t: labels.map(label => new Date(label).getTime() / 1000),
            c: closePrices
          });
        });

  } catch (err) {
    console.error('Error fetching Alpha Vantage chart data:', err);
    res.status(500).json({error: 'Failed to fetch chart data.'});
  }
});

router.get('/stock-profile', authenticateToken, (req, res) => {
  const {symbol} = req.query;

  if (!symbol) {
    return res.status(400).json({error: 'Missing symbol for stock profile'});
  }

  finnhubClient.companyProfile2({symbol: symbol}, (err, profileData) => {
    if (err) {
      console.error(`Finnhub company profile error for ${symbol}:`, err);
      const stockNameStmt =
          db.prepare('SELECT name FROM stocks WHERE symbol = ?');
      const stockNameResult = stockNameStmt.get(symbol);
      const stockName = stockNameResult ? stockNameResult.name : symbol;
      return res.json({
        symbol: symbol,
        name: stockName,
        c: null,
        d: null,
        dp: null,
        o: null,
        h: null,
        l: null,
        pc: null
      });
    }

    finnhubClient.quote(symbol, (err, quoteData) => {
      if (err) {
        console.error(`Finnhub quote error for profile ${symbol}:`, err);
        return res.json({
          symbol: symbol,
          name: profileData.name || symbol,
          c: null,
          d: null,
          dp: null,
          o: null,
          h: null,
          l: null,
          pc: null
        });
      }

      res.json({
        symbol: symbol,
        name: profileData.name || symbol,
        c: quoteData.c,
        d: quoteData.d,
        dp: quoteData.dp,
        o: quoteData.o,
        h: quoteData.h,
        l: quoteData.l,
        pc: quoteData.pc,
      });
    });
  });
});


// Fetch current stock quote
router.get('/quote', authenticateToken, (req, res) => {
  const {symbol} = req.query;

  if (!symbol) {
    return res.status(400).json({error: 'Missing symbol for quote'});
  }

  finnhubClient.quote(symbol, (err, data) => {
    if (err) {
      console.error(`Finnhub quote error for ${symbol}:`, err);
      return res.status(500).json({error: 'Failed to fetch quote data'});
    }
    res.json(data);
  });
});

export default router;