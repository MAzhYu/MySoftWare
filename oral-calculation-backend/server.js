const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env
dotenv.config();

// DB connection
const { connectDB } = require('./config/database.mysql');
require('./models/User.mysql');
require('./models/WrongProblem.mysql');
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Ensure UTF-8 JSON responses
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
});

// Routes
app.use('/api/auth', require('./routes/auth.en'));
app.use('/api/problems', require('./routes/problems')); // math problems

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Service healthy',
        services: {
            auth: 'ok',
            problems: 'ok',
            database: 'ok'
        },
        timestamp: new Date().toISOString()
    });
});

// 404 handler (Express 5)
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Resource ${req.originalUrl} not found`
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);

    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}, env: ${process.env.NODE_ENV}`);
});

module.exports = app;