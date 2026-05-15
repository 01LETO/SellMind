import { rateLimit } from 'express-rate-limit';

export const integratedAiRateLimit = rateLimit({
	windowMs: 60 * 1000,
	max: 20,
	message: { error: 'Muitas requisições. Aguarde um momento e tente novamente.' },
	standardHeaders: true,
	legacyHeaders: false,
});
