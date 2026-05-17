import process from 'node:process';
import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
	logger.info(`API server rodando em http://localhost:${PORT}`);
});
