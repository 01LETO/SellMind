import { rateLimit, ipKeyGenerator } from 'express-rate-limit';

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
