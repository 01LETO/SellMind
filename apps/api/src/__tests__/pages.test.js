import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../utils/supabaseClient.js', () => ({
	supabaseAdmin: {
		from: vi.fn(),
	},
}));

vi.mock('../middleware/supabase-auth.js', () => ({
	supabaseAuth: (req, _res, next) => {
		req.supabaseUserId = 'user-test-123';
		next();
	},
}));

vi.mock('../middleware/pages-rate-limit.js', () => ({
	pagesRateLimit: (_req, _res, next) => next(),
}));

vi.mock('@anthropic-ai/sdk', () => {
	const MockAnthropic = function () {
		this.messages = {
			create: vi.fn().mockResolvedValue({
				content: [{ text: '<!DOCTYPE html><html><body>Landing Page</body></html>' }],
			}),
		};
	};
	return { default: MockAnthropic };
});

const { supabaseAdmin } = await import('../utils/supabaseClient.js');
const app = (await import('../app.js')).default;

const validBody = {
	productName: 'Curso de Marketing',
	targetAudience: 'Empreendedores iniciantes',
	mainPain: 'Não sabe atrair clientes',
	transformation: 'Faturar 10k em 30 dias',
	toneOfVoice: 'Inspirador',
};

function mockSupabaseForPlan(planType, pagesUsed) {
	supabaseAdmin.from.mockImplementation((table) => {
		if (table === 'profiles') {
			return {
				select: () => ({
					eq: () => ({
						single: () => Promise.resolve({ data: { plan_type: planType }, error: null }),
					}),
				}),
			};
		}
		if (table === 'pages') {
			return {
				select: (_cols, opts) => {
					if (opts?.head) {
						return {
							eq: () => ({
								gte: () => Promise.resolve({ count: pagesUsed, error: null }),
							}),
						};
					}
					return {
						insert: () => ({
							select: () => ({
								single: () => Promise.resolve({ data: { id: 'page-id-123' }, error: null }),
							}),
						}),
					};
				},
				insert: () => ({
					select: () => ({
						single: () => Promise.resolve({ data: { id: 'page-id-123' }, error: null }),
					}),
				}),
			};
		}
	});
}

describe('POST /pages/generate', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSupabaseForPlan('free', 0);
	});

	it('retorna 400 quando campos obrigatórios estão ausentes', async () => {
		const res = await request(app).post('/pages/generate').send({});
		expect(res.status).toBe(400);
		expect(res.body).toHaveProperty('error');
	});

	it('retorna 400 quando productName excede 100 caracteres', async () => {
		const res = await request(app)
			.post('/pages/generate')
			.send({ ...validBody, productName: 'A'.repeat(101) });
		expect(res.status).toBe(400);
		expect(res.body.error).toMatch(/muito longo/i);
	});

	it('retorna 400 quando targetAudience excede 500 caracteres', async () => {
		const res = await request(app)
			.post('/pages/generate')
			.send({ ...validBody, targetAudience: 'B'.repeat(501) });
		expect(res.status).toBe(400);
		expect(res.body.error).toMatch(/muito longo/i);
	});

	it('retorna 403 quando limite do plano free (3 páginas) é atingido', async () => {
		mockSupabaseForPlan('free', 3);
		const res = await request(app).post('/pages/generate').send(validBody);
		expect(res.status).toBe(403);
		expect(res.body).toHaveProperty('limitReached', true);
	});

	it('retorna 200 com HTML gerado quando dados são válidos', async () => {
		const res = await request(app).post('/pages/generate').send(validBody);
		expect(res.status).toBe(200);
		expect(res.body).toHaveProperty('html');
		expect(res.body.html).toContain('<!DOCTYPE html>');
		expect(res.body).toHaveProperty('title');
		expect(res.body).toHaveProperty('wordCount');
		expect(res.body).toHaveProperty('pageId');
	});

	it('plano professional permite até 30 páginas', async () => {
		mockSupabaseForPlan('professional', 29);
		const res = await request(app).post('/pages/generate').send(validBody);
		expect(res.status).toBe(200);
	});
});
