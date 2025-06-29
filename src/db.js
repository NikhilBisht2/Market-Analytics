import Database from 'better-sqlite3';

const db = new Database('./src/my_app.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS user_stocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  stock_symbol TEXT NOT NULL,
  UNIQUE(user_id, stock_symbol),
  FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS stocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL
  );
`);

const row = db.prepare('SELECT COUNT(*) AS count FROM stocks').get();
if (row.count === 0) {
  const insert = db.prepare('INSERT INTO stocks (symbol, name) VALUES (?, ?)');
  const stocks = [
    ['AAPL', 'Apple Inc.'],
    ['GOOGL', 'Alphabet Inc.'],
    ['MSFT', 'Microsoft Corporation'],
    ['AMZN', 'Amazon.com Inc.'],
    ['META', 'Meta Platforms Inc.'],
    ['NFLX', 'Netflix Inc.'],
    ['TSLA', 'Tesla Inc.'],
    ['NVDA', 'NVIDIA Corporation'],
    ['BABA', 'Alibaba Group Holding Ltd'],
    ['V', 'Visa Inc.'],
    ['JPM', 'JPMorgan Chase & Co.'],
    ['WMT', 'Walmart Inc.'],
    ['DIS', 'The Walt Disney Company'],
    ['INTC', 'Intel Corporation'],
    ['PYPL', 'PayPal Holdings Inc.'],
    ['CSCO', 'Cisco Systems Inc.'],
    ['ORCL', 'Oracle Corporation'],
    ['PEP', 'PepsiCo Inc.'],
    ['KO', 'Coca-Cola Co.'],
    ['NKE', 'Nike Inc.'],
    ['PFE', 'Pfizer Inc.'],
    ['MRK', 'Merck & Co Inc.'],
    ['T', 'AT&T Inc.'],
    ['IBM', 'International Business Machines Corp.'],
    ['BA', 'Boeing Co.'],
    ['GE', 'General Electric Co.'],
    ['GM', 'General Motors Company'],
    ['F', 'Ford Motor Company'],
    ['SBUX', 'Starbucks Corporation'],
    ['ADBE', 'Adobe Inc.'],
    ['CRM', 'Salesforce Inc.'],
    ['QCOM', 'Qualcomm Inc.'],
    ['AVGO', 'Broadcom Inc.'],
    ['SAP.DE', 'SAP SE'],
    ['ASML.AS', 'ASML Holding NV'],
    ['SONY', 'Sony Group Corporation'],
    ['TM', 'Toyota Motor Corporation'],
    ['NSRGY', 'Nestle S.A.'],
    ['RY', 'Royal Bank of Canada'],
    ['TD', 'Toronto-Dominion Bank'],
    ['BNS', 'Bank of Nova Scotia'],
    ['INFY.BSE', 'Infosys Ltd'],
    ['RELIANCE.BSE', 'Reliance Industries Ltd'],
    ['HDFCBANK.BSE', 'HDFC Bank Ltd'],
    ['TCS.BSE', 'Tata Consultancy Services'],
    ['WIT', 'Wipro Ltd'],
    ['ITC.BSE', 'ITC Ltd'],
    ['ICICIBANK.BSE', 'ICICI Bank Ltd'],
    ['AXISBANK.BSE', 'Axis Bank Ltd'],
    ['UNH', 'UnitedHealth Group Inc.'],
    ['LLY', 'Eli Lilly and Company'],
    ['ABT', 'Abbott Laboratories'],
    ['JNJ', 'Johnson & Johnson'],
    ['MRNA', 'Moderna Inc.'],
    ['AZN', 'AstraZeneca PLC'],
    ['NVO', 'Novo Nordisk A/S'],
    ['GSK', 'GlaxoSmithKline PLC'],
    ['SNY', 'Sanofi'],
    ['BP', 'BP PLC'],
    ['XOM', 'Exxon Mobil Corporation'],
    ['CVX', 'Chevron Corporation'],
    ['TOT', 'TotalEnergies SE'],
    ['ENB', 'Enbridge Inc.'],
    ['NEE', 'NextEra Energy Inc.'],
    ['DUK', 'Duke Energy Corporation'],
    ['SO', 'Southern Company'],
    ['D', 'Dominion Energy Inc.'],
    ['UL', 'Unilever PLC'],
    ['PG', 'Procter & Gamble Co.'],
    ['CL', 'Colgate-Palmolive Company'],
    ['MO', 'Altria Group Inc.'],
    ['PM', 'Philip Morris International Inc.'],
    ['KMB', 'Kimberly-Clark Corporation'],
    ['DEO', 'Diageo PLC']
  ];

  const insertMany = db.transaction((stocks) => {
    for (const [symbol, name] of stocks) insert.run(symbol, name);
  });

  insertMany(stocks);
}

export default db;
