import { rateLimit, ipKeyGenerator } from 'express-rate-limit';

// Limita por user_id (após supabaseAuth), caindo para IP se o usuário não estiver autenticado
export const integratedAiRateLimit = rateLimit({
	windowMs: 60 * 1000,
	max: 10,
	keyGenerator: (req) => req.supabaseUserId ?? ipKeyGenerator(req),
	message: { error: 'Muitas requisições. Aguarde um momento e tente novamente.' },
	standardHeaders: true,
	legacyHeaders: false,
});
