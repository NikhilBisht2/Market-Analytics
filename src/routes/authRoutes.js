import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';

import db from '../db.js';

dotenv.config();

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET;

// Register route
router.post('/register', (req, res) => {
  const {username, password} = req.body;

  const checkUser =
      db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (checkUser) {
    return res.status(400).json({message: 'User already exists'});
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const stmt =
      db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
  stmt.run(username, hashedPassword);

  return res.status(201).json({message: 'User registered successfully'});
});

// Login route
router.post('/login', (req, res) => {
  const {username, password} = req.body;

  const user =
      db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({message: 'Invalid credentials'});
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    return res.status(401).json({message: 'Invalid credentials'});
  }

  const token = jwt.sign(
      {id: user.id, username: user.username}, SECRET_KEY, {expiresIn: '1h'});

  return res.json({message: 'Login successful', token});
});

export default router;
