require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { initQdrantCollection } = require('./config/qdrant');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    logger.info('Starting UK Legal Research AI Backend Service...');

    // 1. Connect to MongoDB
    await connectDB();

    // 1.1 Seed Default Admin & User Roles
    const User = require('./models/User');
    await User.seedDefaultUsers();
    logger.info('Default RBAC personas seeded (admin@lawintel.uk, user@lawintel.uk)');

    // 2. Initialize Qdrant Collection & Payload Schema Indexes
    try {
      await initQdrantCollection();
    } catch (qErr) {
      logger.warn(`Qdrant initialization notice: ${qErr.message}. Ensure Qdrant is running on port 6333.`);
    }

    // 3. Start HTTP Server
    const server = app.listen(PORT, () => {
      logger.info(`Server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      logger.info(`REST API available at: http://localhost:${PORT}/api/v1`);
      logger.info(`Health check at: http://localhost:${PORT}/api/v1/health`);
    });

    // Graceful Shutdown Handlers
    const handleShutdown = (signal) => {
      logger.info(`${signal} received. Closing HTTP server gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (err) {
    logger.error('Fatal bootstrapping error:', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

bootstrap();
