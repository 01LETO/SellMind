import process from 'node:process';
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import logger from './utils/logger.js';
import stripeRouter from './routes/stripe.js';
import integratedAiRouter from './routes/integrated-ai.js';
import pagesRouter from './routes/pages.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
	origin: process.env.FRONTEND_URL || 'http://localhost:5173',
	credentials: true,
}));
app.use(morgan('dev'));

// Raw body must be parsed before express.json() for Stripe webhook signature verification
app.use('/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

app.use('/stripe', stripeRouter);
app.use('/integrated-ai', integratedAiRouter);
app.use('/pages', pagesRouter);

app.use((err, _req, res, _next) => {
	logger.error(err.message, err.stack);
	const status = err.status ?? err.statusCode ?? 500;
	res.status(status).json({ error: err.message || 'Erro interno do servidor' });
});

app.listen(PORT, () => {
	logger.info(`API server rodando em http://localhost:${PORT}`);
});
