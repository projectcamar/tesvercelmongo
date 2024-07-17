const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

// MongoDB Atlas credentials
const uri = 'mongodb+srv://learnitab:ylisuksesjaya@learnitab.w1iivwb.mongodb.net/?retryWrites=true&w=majority&appName=Learnitab';
const client = new MongoClient(uri);

// Connect to MongoDB Atlas
async function connectDatabase() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

connectDatabase();

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Serve your single-page application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Endpoint to fetch all data
async function getAllData() {
  const database = client.db('learnitabDatabase');
  const categories = ['internship', 'competitions', 'scholarships', 'volunteers', 'events', 'mentors'];
  let allData = {};

  for (let category of categories) {
    const collection = database.collection(category);
    allData[category] = await collection.find({}).toArray();
  }

  return allData;
}

app.get('/api/all', async (req, res) => {
  try {
    const data = await getAllData();
    res.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});