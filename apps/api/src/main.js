import process from 'node:process';
import dotenv from 'dotenv';
dotenv.config();

const REQUIRED_ENV_VARS = [
	'SUPABASE_URL',
	'SUPABASE_SERVICE_ROLE_KEY',
	'SUPABASE_ANON_KEY',
	'STRIPE_SECRET_KEY',
	'STRIPE_WEBHOOK_SECRET',
	'FRONTEND_URL',
];

const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missing.length > 0) {
	console.error(`[startup] Variáveis de ambiente obrigatórias não definidas: ${missing.join(', ')}`);
	process.exit(1);
}

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
