import { rateLimit, ipKeyGenerator } from 'express-rate-limit';

// 5 gerações por minuto por usuário — o limite mensal do plano é validado na rota
export const pagesRateLimit = rateLimit({
	windowMs: 60 * 1000,
	max: 5,
	keyGenerator: (req) => req.supabaseUserId ?? ipKeyGenerator(req),
	message: { error: 'Muitas requisições de geração. Aguarde um momento e tente novamente.' },
	standardHeaders: true,
	legacyHeaders: false,
});
