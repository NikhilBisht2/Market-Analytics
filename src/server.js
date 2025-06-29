import dotenv from 'dotenv';
import express from 'express';
import path, {dirname} from 'path';
import {fileURLToPath} from 'url';

import authRoutes from './routes/authRoutes.js'
import pullData from './routes/mrktRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 6003

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.json());

app.use(express.static(path.join(__dirname, '../public'), {index: false}));

// ROUTES
app.use('/auth', authRoutes);
app.use('/mrkt', pullData);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'LogReg.html'));
})

app.listen(PORT, () => {
  console.log(`server started on port: ${PORT}`);
});