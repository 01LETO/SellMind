import process from 'node:process';
import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import logger from './utils/logger.js';

process.on('uncaughtException', (err) => {
	logger.error('UNCAUGHT EXCEPTION:', err.message, err.stack);
});
process.on('unhandledRejection', (reason) => {
	logger.error('UNHANDLED REJECTION:', reason);
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
	logger.info(`API server rodando em http://localhost:${PORT} (Node ${process.version})`);
});
