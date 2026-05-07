const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false, // For local development/scripts
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/referral', require('./routes/referral'));

// Serve Specialist View
app.get('/referral/:docId', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'referral.html'));
});

// Root Route
const APP_NAME = "MediRef";
app.get('/', (req, res) => {
  res.send(`${APP_NAME} Backend API is running...`);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[${APP_NAME}] Server started on port ${PORT}`);
  console.log(`[${APP_NAME}] Specialist view available at ${process.env.BACKEND_URL}/referral/:docId`);
});
