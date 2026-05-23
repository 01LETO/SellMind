import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { supabaseAdmin } from '../utils/supabaseClient.js';
import { supabaseAuth } from '../middleware/supabase-auth.js';
import logger from '../utils/logger.js';
import { sendLeadNotification } from '../utils/email.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const leadsSubmitRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 5,
	standardHeaders: 'draft-7',
	legacyHeaders: false,
	keyGenerator: (req) => `${req.ip}:${req.params.pageId}`,
	message: { error: 'Muitas submissões. Tente novamente em 15 minutos.' },
});

const dataSchema = z.record(z.string().max(100), z.string().max(500)).refine(
	(obj) => Object.keys(obj).length <= 20,
	{ message: 'Formulário com muitos campos (máx. 20).' },
);

const router = Router();

// POST /leads/:pageId — público, sem auth
router.post('/:pageId', leadsSubmitRateLimit, async (req, res) => {
	const { pageId } = req.params;
	if (!UUID_RE.test(pageId)) return res.status(404).json({ error: 'Página não encontrada.' });

	const parsed = dataSchema.safeParse(req.body?.data ?? {});
	if (!parsed.success) {
		return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' });
	}

	const { data: page, error: pageError } = await supabaseAdmin
		.from('pages')
		.select('id, product_name, user_id')
		.eq('id', pageId)
		.single();

	if (pageError || !page) return res.status(404).json({ error: 'Página não encontrada.' });

	const { error } = await supabaseAdmin
		.from('leads')
		.insert({ page_id: pageId, data: parsed.data });

	if (error) {
		logger.error('Failed to save lead:', error.message);
		return res.status(500).json({ error: 'Erro ao registrar lead.' });
	}

	// Notificação por e-mail — não bloqueia a resposta
	supabaseAdmin.auth.admin.getUserById(page.user_id).then(({ data }) => {
		const ownerEmail = data?.user?.email;
		if (ownerEmail) {
			sendLeadNotification({
				to: ownerEmail,
				productName: page.product_name,
				data: parsed.data,
				pageId,
			});
		}
	});

	res.json({ ok: true });
});

// GET /leads/:pageId — requer autenticação; somente o dono da página
router.get('/:pageId', supabaseAuth, async (req, res) => {
	const { pageId } = req.params;
	if (!UUID_RE.test(pageId)) return res.status(404).json({ error: 'Página não encontrada.' });

	if (!req.supabaseUserId) return res.status(401).json({ error: 'Não autorizado.' });

	const { data: page } = await supabaseAdmin
		.from('pages')
		.select('id, product_name')
		.eq('id', pageId)
		.eq('user_id', req.supabaseUserId)
		.single();

	if (!page) return res.status(404).json({ error: 'Página não encontrada.' });

	const { data: leads } = await supabaseAdmin
		.from('leads')
		.select('id, data, created_at')
		.eq('page_id', pageId)
		.order('created_at', { ascending: false });

	res.json({ leads: leads ?? [], productName: page.product_name });
});

export default router;
