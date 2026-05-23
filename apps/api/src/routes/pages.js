import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import sanitizeHtml from 'sanitize-html';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { supabaseAuth } from '../middleware/supabase-auth.js';
import { requireEmailVerified } from '../middleware/require-email-verified.js';
import { pagesRateLimit } from '../middleware/pages-rate-limit.js';
import { supabaseAdmin } from '../utils/supabaseClient.js';
import logger from '../utils/logger.js';

const viewRateLimit = rateLimit({
	windowMs: 60 * 1000,
	limit: 3,
	standardHeaders: 'draft-7',
	legacyHeaders: false,
	keyGenerator: (req) => `${req.ip}:${req.params.id}`,
	skip: (_req, res) => { res.locals.skipViewLog = true; return false; },
});

const SANITIZE_OPTIONS = {
	allowedTags: [
		// Estrutura do documento
		'html', 'head', 'body', 'meta', 'title', 'link', 'style',
		// Semântica
		'header', 'footer', 'main', 'section', 'article', 'nav', 'aside',
		'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
		'ul', 'ol', 'li', 'dl', 'dt', 'dd',
		'figure', 'figcaption', 'picture', 'source',
		'blockquote', 'pre', 'code', 'em', 'strong', 'b', 'i', 'u', 's',
		'hr', 'br', 'wbr',
		// Mídia
		'img', 'svg', 'path', 'circle', 'rect', 'line', 'polygon', 'polyline',
		'defs', 'g', 'use', 'symbol', 'linearGradient', 'radialGradient', 'stop',
		// Formulários / CTA
		'form', 'label', 'input', 'button', 'select', 'option', 'textarea',
		// Links e tabelas
		'a', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
	],
	allowedAttributes: {
		'*': ['class', 'id', 'style', 'role', 'aria-label', 'aria-hidden', 'aria-describedby', 'tabindex'],
		'a': ['href', 'target', 'rel'],
		'img': ['src', 'alt', 'width', 'height', 'loading', 'decoding'],
		'meta': ['name', 'content', 'charset', 'http-equiv', 'viewport'],
		'link': ['rel', 'href', 'type', 'media'],
		'input': ['type', 'name', 'placeholder', 'value', 'required', 'disabled', 'checked', 'min', 'max'],
		'form': ['action', 'method', 'novalidate'],
		'button': ['type', 'disabled'],
		'source': ['src', 'srcset', 'media', 'type'],
		'svg': ['xmlns', 'viewBox', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'],
		'path': ['d', 'fill', 'stroke', 'stroke-width', 'fill-rule', 'clip-rule'],
		'circle': ['cx', 'cy', 'r', 'fill', 'stroke'],
		'rect': ['x', 'y', 'width', 'height', 'rx', 'ry', 'fill', 'stroke'],
		'stop': ['offset', 'stop-color', 'stop-opacity'],
		'linearGradient': ['id', 'x1', 'y1', 'x2', 'y2', 'gradientUnits'],
		'radialGradient': ['id', 'cx', 'cy', 'r', 'fx', 'fy', 'gradientUnits'],
		'use': ['href', 'xlink:href', 'x', 'y', 'width', 'height'],
		'th': ['colspan', 'rowspan', 'scope'],
		'td': ['colspan', 'rowspan'],
		'select': ['name', 'required', 'multiple', 'disabled'],
		'textarea': ['name', 'placeholder', 'required', 'rows', 'cols', 'disabled'],
	},
	allowedSchemes: ['https', 'http', 'mailto', 'tel'],
	allowedSchemesByTag: {
		img: ['https', 'http', 'data'],
	},
	// <style> é necessário para landing pages; event handlers bloqueados pois não estão no allowedAttributes
	allowVulnerableTags: true,
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const router = Router();

// Rota pública — sem autenticação
router.get('/public/:id', async (req, res) => {
	const { id } = req.params;
	if (!UUID_RE.test(id)) return res.status(404).json({ error: 'Página não encontrada.' });

	const { data, error } = await supabaseAdmin
		.from('pages')
		.select('html_content, title, product_name')
		.eq('id', id)
		.single();

	if (error || !data) return res.status(404).json({ error: 'Página não encontrada.' });

	const apiBase = process.env.API_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
	const injectedScript = `<script>(function(){var A="${apiBase}",P="${id}";
var vk="_smv_"+P,last=parseInt(localStorage.getItem(vk)||"0");
if(Date.now()-last>3600000){localStorage.setItem(vk,Date.now());fetch(A+"/pages/public/"+P+"/view",{method:"POST"});}
document.addEventListener("submit",function(e){var f=e.target;if(!f||f.tagName!=="FORM")return;e.preventDefault();var d={};new FormData(f).forEach(function(v,k){d[k]=v;});fetch(A+"/leads/"+P,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:d})}).then(function(r){if(r.ok)f.innerHTML='<div style="text-align:center;padding:2rem"><p style="color:#16a34a;font-size:1.1rem;font-weight:600">✓ Recebemos seus dados!</p><p style="color:#6b7280;margin-top:0.5rem">Entraremos em contato em breve.</p></div>';});});})();<\/script>`;
	const html = data.html_content.includes('</body>')
		? data.html_content.replace('</body>', `${injectedScript}\n</body>`)
		: data.html_content + injectedScript;

	res.json({ html, title: data.title, productName: data.product_name });
});

// Registra uma visualização — público, rate-limited (3/min por IP+página)
router.post('/public/:id/view', viewRateLimit, async (req, res) => {
	const { id } = req.params;
	if (!UUID_RE.test(id)) return res.status(204).end();

	supabaseAdmin.from('page_views').insert({ page_id: id }).then(({ error }) => {
		if (error) logger.error('Failed to log page view:', error.message);
	});

	res.status(204).end();
});

// Analytics — requer autenticação; somente o dono da página
router.get('/analytics/:id', supabaseAuth, async (req, res) => {
	const { id } = req.params;
	if (!UUID_RE.test(id)) return res.status(404).json({ error: 'Página não encontrada.' });
	if (!req.supabaseUserId) return res.status(401).json({ error: 'Não autorizado.' });

	const { data: page } = await supabaseAdmin
		.from('pages')
		.select('id, product_name')
		.eq('id', id)
		.eq('user_id', req.supabaseUserId)
		.single();

	if (!page) return res.status(404).json({ error: 'Página não encontrada.' });

	const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

	const [{ data: views }, { data: leads }] = await Promise.all([
		supabaseAdmin.from('page_views').select('viewed_at').eq('page_id', id),
		supabaseAdmin.from('leads').select('created_at').eq('page_id', id),
	]);

	const totalViews = views?.length ?? 0;
	const totalLeads = leads?.length ?? 0;
	const conversionRate = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) : '0.0';

	// Agrupa views por dia nos últimos 30 dias
	const byDay = {};
	for (let i = 29; i >= 0; i--) {
		const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
		byDay[d.toISOString().slice(0, 10)] = 0;
	}
	(views ?? []).filter(v => v.viewed_at >= thirtyDaysAgo).forEach(v => {
		const day = v.viewed_at.slice(0, 10);
		if (byDay[day] !== undefined) byDay[day]++;
	});

	const viewsByDay = Object.entries(byDay).map(([day, count]) => ({ day, views: count }));

	res.json({ productName: page.product_name, totalViews, totalLeads, conversionRate, viewsByDay });
});

router.use(supabaseAuth);
router.use(requireEmailVerified);

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
		model: process.env.CLAUDE_MODEL || 'claude-opus-4-7',
		max_tokens: 8192,
		system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
		messages: [{ role: 'user', content: userPrompt }],
	});

	let html = response.content[0].text.trim();
	html = html.replace(/^```html\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();

	// sanitize-html não preserva <!DOCTYPE> pois não é uma tag; restauramos após sanitização
	const doctypeMatch = html.match(/^<!DOCTYPE[^>]*>/i);
	const doctype = doctypeMatch ? doctypeMatch[0] : '';
	html = sanitizeHtml(html, SANITIZE_OPTIONS);
	if (doctype) html = `${doctype}\n${html}`;

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
