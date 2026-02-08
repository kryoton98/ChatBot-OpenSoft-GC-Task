/**
 * @file index.js
 * @description Main entry point for the Backend.
 */

// 1. Load Environment Variables (MUST BE FIRST)
const dotenv = require('dotenv');
dotenv.config(); 

// 2. Database Connection
const connectDB = require('./services/databaseService');
connectDB(); 

// 3. Core Imports
const express = require('express');
const cors = require('cors');

// 4. Route Imports
const chatRoutes = require('./routes/chatRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// 5. Port Setup 
// (Changed default to 5000 to match your Frontend URL)
const PORT = process.env.PORT || 5000; 

// 6. Middlewares
app.use(cors()); // Allow Frontend to talk to Backend
app.use(express.json()); // Allow Backend to read JSON data

// 7. Test Route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Backend is running successfully!' });
});

// 8. API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/chats', chatRoutes);

// 9. Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});