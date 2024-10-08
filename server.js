require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB Atlas credentials
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Connect to MongoDB Atlas
async function connectDatabase() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    throw error;
  }
}

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

  try {
    for (let category of categories) {
      const collection = database.collection(category);
      allData[category] = await collection.find({}).toArray();
    }
  } catch (error) {
    console.error('Error fetching data from MongoDB:', error.message);
    throw error;
  }

  return allData;
}

// API Endpoint to get all posts
app.get('/api/all', async (req, res) => {
  try {
    const data = await getAllData();
    res.json(data);
  } catch (error) {
    console.error('Error in /api/all endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// New endpoints for individual categories
const categories = ['internship', 'competitions', 'scholarships', 'volunteers', 'events', 'mentors'];

categories.forEach(category => {
  app.get(`/api/${category}`, async (req, res) => {
    try {
      const database = client.db('learnitabDatabase');
      const collection = database.collection(category);
      const data = await collection.find({}).toArray();
      res.json(data);
    } catch (error) {
      console.error(`Error fetching ${category}:`, error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
});

// Fallback route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
async function startServer() {
  try {
    await connectDatabase();
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
