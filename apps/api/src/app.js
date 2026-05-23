import * as Sentry from '@sentry/node';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import logger from './utils/logger.js';
import { swaggerSpec } from './utils/swagger.js';
import stripeRouter from './routes/stripe.js';
import integratedAiRouter from './routes/integrated-ai.js';
import pagesRouter from './routes/pages.js';
import accountRouter from './routes/account.js';

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
const ALLOWED_ORIGINS = [
	process.env.FRONTEND_URL,
	'http://localhost:5173',
	...(process.env.CORS_EXTRA_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean),
].filter(Boolean);

app.use(cors({
	origin: (origin, cb) => {
		if (!origin || ALLOWED_ORIGINS.includes(origin)) {
			cb(null, true);
		} else {
			cb(new Error(`CORS: origin not allowed — ${origin}`));
		}
	},
	credentials: true,
}));
app.use(morgan('combined', {
	stream: { write: (msg) => logger.http(msg.trim()) },
}));

// Raw body para Stripe — lê o stream diretamente, sem depender de type-matching do express.raw
app.use('/stripe/webhook', (req, _res, next) => {
	const chunks = [];
	req.on('data', chunk => chunks.push(chunk));
	req.on('end', () => { req.body = Buffer.concat(chunks); next(); });
	req.on('error', next);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((_req, res, next) => { res.setHeader('X-API-Version', '1'); next(); });

app.get('/health', (_req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

// Desabilitado em produção por padrão; defina DOCS_ENABLED=true para expor em produção
const docsEnabled = process.env.NODE_ENV !== 'production' || process.env.DOCS_ENABLED === 'true';
if (docsEnabled) {
	app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
	app.get('/docs.json', (_req, res) => res.json(swaggerSpec));
}

app.use('/stripe', stripeRouter);
app.use('/integrated-ai', integratedAiRouter);
app.use('/pages', pagesRouter);
app.use('/account', accountRouter);

app.use((err, _req, res, _next) => {
	logger.error({ message: err.message, stack: err.stack });
	if (process.env.SENTRY_DSN) Sentry.captureException(err);
	const status = err.status ?? err.statusCode ?? 500;
	res.status(status).json({ error: err.message || 'Erro interno do servidor' });
});

export default app;
