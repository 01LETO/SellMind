import { Router } from 'express';
import Stripe from 'stripe';
import { supabaseAuth } from '../middleware/supabase-auth.js';
import { supabaseAdmin } from '../utils/supabaseClient.js';
import logger from '../utils/logger.js';

const router = Router();
router.use(supabaseAuth);

/**
 * @openapi
 * /account:
 *   delete:
 *     summary: Exclui a conta e todos os dados do usuário (GDPR)
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conta excluída com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro ao excluir usuário do Auth
 */
router.delete('/', async (req, res) => {
	const userId = req.supabaseUserId;
	if (!userId) return res.status(401).json({ error: 'Não autorizado.' });

	// 1. Cancelar assinatura Stripe ativa (não-fatal: continua mesmo se falhar)
	const { data: subscriber } = await supabaseAdmin
		.from('subscribers')
		.select('stripe_customer_id, subscribed')
		.eq('user_id', userId)
		.maybeSingle();

	if (subscriber?.stripe_customer_id && subscriber?.subscribed) {
		try {
			const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
			const subscriptions = await stripe.subscriptions.list({
				customer: subscriber.stripe_customer_id,
				status: 'active',
				limit: 1,
			});
			if (subscriptions.data.length > 0) {
				await stripe.subscriptions.cancel(subscriptions.data[0].id);
				logger.info(`Stripe subscription cancelled for user ${userId}`);
			}
		} catch (err) {
			logger.error('Failed to cancel Stripe subscription during account deletion:', err.message);
		}
	}

	// 2. Remover arquivos do Storage (imagens do chat)
	const { data: aiMessages } = await supabaseAdmin
		.from('integrated_ai_messages')
		.select('content')
		.eq('user_id', userId);

	if (aiMessages?.length) {
		const storagePaths = aiMessages
			.flatMap((msg) => msg.content ?? [])
			.filter((block) => block.type === 'image' && block.image)
			.map((block) => {
				try {
					const parts = block.image.split('/storage/v1/object/public/ai-images/');
					return parts[1] ? decodeURIComponent(parts[1]) : null;
				} catch {
					return null;
				}
			})
			.filter(Boolean);

		if (storagePaths.length > 0) {
			const { error: storageError } = await supabaseAdmin.storage
				.from('ai-images')
				.remove(storagePaths);
			if (storageError) {
				logger.error('Failed to delete storage files during account deletion:', storageError.message);
			}
		}
	}

	// 3. Apagar dados do usuário nas tabelas
	await Promise.all([
		supabaseAdmin.from('integrated_ai_messages').delete().eq('user_id', userId),
		supabaseAdmin.from('pages').delete().eq('user_id', userId),
		supabaseAdmin.from('subscribers').delete().eq('user_id', userId),
		supabaseAdmin.from('profiles').delete().eq('user_id', userId),
	]);

	// 4. Apagar usuário do Auth (deve ser o último passo)
	const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
	if (authError) {
		logger.error('Failed to delete auth user:', authError.message);
		return res.status(500).json({ error: 'Erro ao excluir conta. Tente novamente.' });
	}

	logger.info(`Account fully deleted for user ${userId}`);
	res.json({ ok: true });
});

export default router;
