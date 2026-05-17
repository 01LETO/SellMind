import * as Sentry from '@sentry/node';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import logger from './utils/logger.js';
import stripeRouter from './routes/stripe.js';
import integratedAiRouter from './routes/integrated-ai.js';
import pagesRouter from './routes/pages.js';

if (process.env.SENTRY_DSN) {
	Sentry.init({
		dsn: process.env.SENTRY_DSN,
		environment: process.env.NODE_ENV || 'development',
		tracesSampleRate: 0.1,
	});
}

const app = express();

app.use(helmet({
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'none'"],
		},
	},
	hsts: {
		maxAge: 31536000,
		includeSubDomains: true,
	},
}));
app.use(cors({
	origin: process.env.FRONTEND_URL || 'http://localhost:5173',
	credentials: true,
}));
app.use(morgan('combined', {
	stream: { write: (msg) => logger.http(msg.trim()) },
}));

// Raw body deve ser parseado antes do express.json() para validação da assinatura Stripe
app.use('/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

app.use('/stripe', stripeRouter);
app.use('/integrated-ai', integratedAiRouter);
app.use('/pages', pagesRouter);

app.use((err, _req, res, _next) => {
	logger.error({ message: err.message, stack: err.stack });
	if (process.env.SENTRY_DSN) Sentry.captureException(err);
	const status = err.status ?? err.statusCode ?? 500;
	res.status(status).json({ error: err.message || 'Erro interno do servidor' });
});

export default app;
