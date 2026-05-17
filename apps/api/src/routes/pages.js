import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { supabaseAuth } from '../middleware/supabase-auth.js';
import { pagesRateLimit } from '../middleware/pages-rate-limit.js';
import { supabaseAdmin } from '../utils/supabaseClient.js';
import logger from '../utils/logger.js';

const router = Router();
router.use(supabaseAuth);

const client = new Anthropic();

const PLAN_LIMITS = { free: 3, professional: 30, enterprise: Infinity };

const SYSTEM_PROMPT = `Você é um especialista em copywriting e marketing digital. Crie páginas de vendas HTML completas, profissionais e otimizadas para conversão. Inclua CSS embutido, design responsivo e copy persuasivo. Retorne APENAS o HTML completo começando com <!DOCTYPE html>, sem markdown, sem blocos de código.`;

const generateSchema = z.object({
	productName: z.string().min(1, 'Nome do produto obrigatório.').max(100, 'Nome do produto muito longo (máx. 100 caracteres).'),
	targetAudience: z.string().min(1, 'Público-alvo obrigatório.').max(500, 'Público-alvo muito longo (máx. 500 caracteres).'),
	mainPain: z.string().min(1, 'Principal dor obrigatória.').max(500, 'Principal dor muito longa (máx. 500 caracteres).'),
	transformation: z.string().min(1, 'Transformação obrigatória.').max(500, 'Transformação muito longa (máx. 500 caracteres).'),
	toneOfVoice: z.string().min(1, 'Tom de voz obrigatório.').max(50, 'Tom de voz inválido.'),
});

/**
 * @openapi
 * /pages/generate:
 *   post:
 *     summary: Gera uma página de vendas HTML com IA
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productName, targetAudience, mainPain, transformation, toneOfVoice]
 *             properties:
 *               productName:
 *                 type: string
 *                 maxLength: 100
 *                 example: Curso de Marketing Digital
 *               targetAudience:
 *                 type: string
 *                 maxLength: 500
 *                 example: Empreendedores iniciantes
 *               mainPain:
 *                 type: string
 *                 maxLength: 500
 *                 example: Não consegue atrair clientes online
 *               transformation:
 *                 type: string
 *                 maxLength: 500
 *                 example: Faturar R$10k em 30 dias
 *               toneOfVoice:
 *                 type: string
 *                 maxLength: 50
 *                 example: Inspirador e direto
 *     responses:
 *       200:
 *         description: Página gerada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 html:
 *                   type: string
 *                   description: HTML completo da landing page
 *                 title:
 *                   type: string
 *                 wordCount:
 *                   type: integer
 *                 generatedAt:
 *                   type: string
 *                   format: date-time
 *                 pageId:
 *                   type: string
 *                   format: uuid
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Limite do plano atingido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 limitReached:
 *                   type: boolean
 *                 planType:
 *                   type: string
 *                 limit:
 *                   type: integer
 *                 used:
 *                   type: integer
 *       429:
 *         description: Rate limit excedido (5 req/min por usuário)
 */
router.post('/generate', pagesRateLimit, async (req, res) => {
	const parsed = generateSchema.safeParse(req.body);
	if (!parsed.success) {
		const message = parsed.error.issues[0]?.message ?? 'Dados inválidos.';
		return res.status(400).json({ error: message });
	}
	const { productName, targetAudience, mainPain, transformation, toneOfVoice } = parsed.data;

	if (!req.supabaseUserId) {
		return res.status(401).json({ error: 'Não autorizado.' });
	}

	// Check plan limit
	const now = new Date();
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

	const [{ data: profile }, { count: pagesThisMonth }] = await Promise.all([
		supabaseAdmin.from('profiles').select('plan_type').eq('user_id', req.supabaseUserId).single(),
		supabaseAdmin.from('pages').select('*', { count: 'exact', head: true })
			.eq('user_id', req.supabaseUserId)
			.gte('created_at', startOfMonth),
	]);

	const planType = profile?.plan_type || 'free';
	const limit = PLAN_LIMITS[planType] ?? PLAN_LIMITS.free;

	if (pagesThisMonth >= limit) {
		return res.status(403).json({
			error: `Limite do plano ${planType} atingido (${limit} páginas/mês). Faça upgrade para continuar.`,
			limitReached: true,
			planType,
			limit,
			used: pagesThisMonth,
		});
	}

	const userPrompt = `Crie uma página de vendas completa para:

**Produto/Serviço:** ${productName}
**Público-alvo:** ${targetAudience}
**Principal dor/problema:** ${mainPain}
**Transformação prometida:** ${transformation}
**Tom de voz:** ${toneOfVoice}

Gere a landing page HTML completa, responsiva e otimizada para conversão.`;

	logger.info(`Generating sales page for "${productName}" (plan: ${planType}, used: ${pagesThisMonth}/${limit === Infinity ? '∞' : limit})`);

	const response = await client.messages.create({
		model: 'claude-opus-4-7',
		max_tokens: 8192,
		system: SYSTEM_PROMPT,
		messages: [{ role: 'user', content: userPrompt }],
	});

	let html = response.content[0].text.trim();
	html = html.replace(/^```html\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();

	const wordCount = html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
	const title = `${productName} — Página de Vendas`;
	const generatedAt = new Date().toISOString();

	const { data: savedPage, error: dbError } = await supabaseAdmin
		.from('pages')
		.insert({
			user_id: req.supabaseUserId,
			product_name: productName,
			target_audience: targetAudience,
			main_pain: mainPain,
			transformation,
			tone_of_voice: toneOfVoice,
			html_content: html,
			title,
			word_count: wordCount,
			generated_at: generatedAt,
		})
		.select('id')
		.single();

	if (dbError) {
		logger.error('Failed to save page to Supabase:', dbError.message);
	}

	res.json({
		html,
		title,
		wordCount,
		generatedAt,
		pageId: savedPage?.id ?? null,
	});
});

export default router;
