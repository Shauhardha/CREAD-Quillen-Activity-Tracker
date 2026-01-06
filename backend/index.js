require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// MySQL Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: 'cread_tracker'
});

db.connect(err => {
  if (err) {
    console.error('DB Connection Failed:', err);
    process.exit(1);
  }
  console.log('MySQL Connected!');
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'CREAD Tracker API Running', 
    time: new Date().toISOString() 
  });
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});