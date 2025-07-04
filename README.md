# Market Analytics
A full-stack web application for real-time stock market tracking, financial news, and personal portfolio management.

## Overview
Market Analytics allows users to:

- Register and log in securely
- Search for global stock tickers
- View real-time stock data and chart trends
- Save and manage a personal watchlist
- Read the latest financial news

Built using modern web technologies and integrates with Alpha Vantage and Finnhub APIs to deliver up-to-date market insights.

## Tech Stack
**Frontend:**
- HTML, CSS, JavaScript
- Chart.js for dynamic visualizations

**Backend:**
- Node.js, Express.js
- JWT for authentication
- SQLite (via `better-sqlite3`) for database management

**APIs:**
- [Alpha Vantage](https://www.alphavantage.co/) – historical and intraday stock data  
- [Finnhub](https://finnhub.io/) – real-time quotes and news

## Features
- User authentication (JWT-secured)
- Live stock search with autocomplete
- Interactive charts with adjustable time ranges (1D to 1Y)
- Financial news integration
- Save/delete stock watchlist per user
- Historical stock performance viewer

