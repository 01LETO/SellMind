import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const mockStream = vi.fn();

vi.mock('../api/integrated-ai.js', () => ({
	ContentBlockType: { Image: 'image' },
	stream: mockStream,
	uploadImagesToSupabase: vi.fn().mockResolvedValue([]),
}));

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

vi.mock('../middleware/integrated-ai-rate-limit.js', () => ({
	integratedAiRateLimit: (_req, _res, next) => next(),
}));

vi.mock('../middleware/file-upload.js', () => ({
	uploadFiles: () => (_req, _res, next) => next(),
}));

// Mock de Anthropic para evitar erros em módulos que importam o SDK
vi.mock('@anthropic-ai/sdk', () => {
	const MockAnthropic = function () {};
	return { default: MockAnthropic };
});

const { supabaseAdmin } = await import('../utils/supabaseClient.js');
const app = (await import('../app.js')).default;

describe('POST /integrated-ai/stream', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Mock que encerra a resposta imediatamente para o Supertest não ficar pendurado
		mockStream.mockResolvedValue({
			pipe: (res) => { res.end(); },
			destroy: vi.fn(),
			on: vi.fn(),
		});
	});

	it('retorna 400 quando message está ausente', async () => {
		const res = await request(app).post('/integrated-ai/stream').send({});
		expect(res.status).toBe(400);
		expect(res.body).toHaveProperty('error');
	});

	it('retorna 400 quando message excede 10.000 caracteres', async () => {
		const longMsg = 'A'.repeat(10001);
		const res = await request(app)
			.post('/integrated-ai/stream')
			.send({ message: longMsg });
		expect(res.status).toBe(400);
		expect(res.body.error).toMatch(/longa/i);
	});

	it('chama stream com userId correto quando message é válida', async () => {
		const message = JSON.stringify([{ type: 'text', text: 'Olá!' }]);
		await request(app).post('/integrated-ai/stream').send({ message });
		expect(mockStream).toHaveBeenCalledWith(
			expect.objectContaining({ userId: 'user-test-123' }),
		);
	});
});

describe('POST /integrated-ai/history/clear', () => {
	it('retorna 200 ao limpar histórico', async () => {
		supabaseAdmin.from.mockReturnValue({
			delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
		});
		const res = await request(app).post('/integrated-ai/history/clear');
		expect(res.status).toBe(200);
		expect(res.body).toHaveProperty('ok', true);
	});

	it('retorna 500 quando Supabase retorna erro', async () => {
		supabaseAdmin.from.mockReturnValue({
			delete: () => ({ eq: () => Promise.resolve({ error: { message: 'db error' } }) }),
		});
		const res = await request(app).post('/integrated-ai/history/clear');
		expect(res.status).toBe(500);
	});
});
