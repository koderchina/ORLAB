const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();
const PORT = 3000;

// PostgreSQL configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ORlabDB',
  password: 'admin',
  port: 5432,
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Define a route to get data from the database with optional search and column filtering
app.get('/data', async (req, res) => {
  try {
    let result;
    result = await pool.query(`SELECT * FROM punionica JOIN stanicazapunjenje ON punionica.id_punionice = stanicazapunjenje.id_punionice`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Route to serve the homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Route to serve the dataset page
app.get('/dataset', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'datatable.html'));
});

// Route to download JSON file
app.get('/punionice.json', (req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="punionice.json"');
  res.sendFile(path.join(__dirname, 'punionice.json'));
});

// Route to download CSV file
app.get('/punionice.csv', (req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="punionice.csv"');
  res.sendFile(path.join(__dirname, 'punionice.csv'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});