require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const apiRoutes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const AppError = require('./utils/appError');

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: false
}));

// Cross-Origin Resource Sharing
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount API v1
app.use('/api/v1', apiRoutes);

// Unhandled Route Handler
app.all('*', (req, res, next) => {
  next(new AppError(`Endpoint not found: ${req.method} ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND'));
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
