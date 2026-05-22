import { rateLimit, ipKeyGenerator } from 'express-rate-limit';

// Webhook é chamado pelos servidores do Stripe — limite generoso por IP
export const stripeWebhookRateLimit = rateLimit({
	windowMs: 60 * 1000,
	max: 100,
	keyGenerator: ipKeyGenerator,
	message: { error: 'Muitas requisições.' },
	standardHeaders: true,
	legacyHeaders: false,
	skip: (req) => req.headers['stripe-signature'] !== undefined
		? false
		: false, // sempre aplica; assinatura inválida é rejeitada pelo handler
});

export const stripeCheckoutRateLimit = rateLimit({
	windowMs: 60 * 1000,
	max: 5,
	keyGenerator: (req) => req.supabaseUserId ?? ipKeyGenerator(req),
	message: { error: 'Muitas tentativas de checkout. Aguarde um momento e tente novamente.' },
	standardHeaders: true,
	legacyHeaders: false,
});

export const stripePortalRateLimit = rateLimit({
	windowMs: 60 * 1000,
	max: 10,
	keyGenerator: (req) => req.supabaseUserId ?? ipKeyGenerator(req),
	message: { error: 'Muitas requisições. Aguarde um momento e tente novamente.' },
	standardHeaders: true,
	legacyHeaders: false,
});
