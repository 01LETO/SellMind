import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mocks compartilhados entre todas as instâncias de Stripe
const mockSubscriptionsList = vi.fn().mockResolvedValue({ data: [] });
const mockSubscriptionsCancel = vi.fn().mockResolvedValue({});

vi.mock('stripe', () => {
	const MockStripe = function () {
		this.subscriptions = {
			list: mockSubscriptionsList,
			cancel: mockSubscriptionsCancel,
		};
	};
	return { default: MockStripe };
});

vi.mock('../utils/supabaseClient.js', () => ({
	supabaseAdmin: {
		from: vi.fn(),
		storage: {
			from: vi.fn(() => ({ remove: vi.fn().mockResolvedValue({ error: null }) })),
		},
		auth: {
			admin: {
				deleteUser: vi.fn().mockResolvedValue({ error: null }),
			},
		},
	},
}));

vi.mock('@anthropic-ai/sdk', () => ({ default: function () {} }));

const { supabaseAdmin } = await import('../utils/supabaseClient.js');
const app = (await import('../app.js')).default;

function mockAuthenticatedRequest(app) {
	return request(app)
		.delete('/account')
		.set('Authorization', 'Bearer valid-token');
}

function setupSupabaseMocks({ hasSubscription = false, hasMessages = false } = {}) {
	supabaseAdmin.from.mockImplementation((table) => {
		if (table === 'subscribers') {
			return {
				select: () => ({
					eq: () => ({
						maybeSingle: () => Promise.resolve({
							data: hasSubscription
								? { stripe_customer_id: 'cus_test', subscribed: true }
								: null,
						}),
					}),
				}),
				delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
			};
		}
		if (table === 'integrated_ai_messages') {
			return {
				select: () => ({
					eq: () => Promise.resolve({
						data: hasMessages
							? [{ content: [{ type: 'image', image: 'https://test.supabase.co/storage/v1/object/public/ai-images/foto.jpg' }] }]
							: [],
					}),
				}),
				delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
			};
		}
		return {
			delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
		};
	});
}

// Mock supabaseAuth para simular usuário autenticado
vi.mock('../middleware/supabase-auth.js', () => ({
	supabaseAuth: (req, _res, next) => {
		const header = req.headers.authorization;
		if (header?.startsWith('Bearer valid-token')) {
			req.supabaseUserId = 'user-test-123';
		}
		next();
	},
}));

describe('DELETE /account', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		// Restaurar defaults após reset
		mockSubscriptionsList.mockResolvedValue({ data: [] });
		mockSubscriptionsCancel.mockResolvedValue({});
		supabaseAdmin.auth.admin.deleteUser.mockResolvedValue({ error: null });
		supabaseAdmin.storage.from.mockReturnValue({
			remove: vi.fn().mockResolvedValue({ error: null }),
		});
		setupSupabaseMocks();
	});

	it('retorna 401 quando não há token de autenticação', async () => {
		const res = await request(app).delete('/account');
		expect(res.status).toBe(401);
	});

	it('exclui conta com sucesso e retorna ok:true', async () => {
		const res = await mockAuthenticatedRequest(app);
		expect(res.status).toBe(200);
		expect(res.body).toHaveProperty('ok', true);
	});

	it('cancela assinatura Stripe ativa antes de excluir dados', async () => {
		setupSupabaseMocks({ hasSubscription: true });
		mockSubscriptionsList.mockResolvedValue({ data: [{ id: 'sub_123' }] });

		const res = await mockAuthenticatedRequest(app);
		expect(res.status).toBe(200);
		expect(mockSubscriptionsCancel).toHaveBeenCalledWith('sub_123');
	});

	it('remove arquivos do Storage quando há mensagens com imagens', async () => {
		setupSupabaseMocks({ hasMessages: true });
		const removeMock = vi.fn().mockResolvedValue({ error: null });
		supabaseAdmin.storage.from.mockReturnValue({ remove: removeMock });

		const res = await mockAuthenticatedRequest(app);
		expect(res.status).toBe(200);
		expect(removeMock).toHaveBeenCalledWith(['foto.jpg']);
	});

	it('retorna 500 se o Auth admin falhar ao excluir usuário', async () => {
		supabaseAdmin.auth.admin.deleteUser.mockResolvedValue({
			error: { message: 'user not found' },
		});

		const res = await mockAuthenticatedRequest(app);
		expect(res.status).toBe(500);
		expect(res.body).toHaveProperty('error');
	});

	it('continua a exclusão mesmo se cancelar assinatura Stripe falhar', async () => {
		setupSupabaseMocks({ hasSubscription: true });
		mockSubscriptionsList.mockRejectedValueOnce(new Error('Stripe error'));

		const res = await mockAuthenticatedRequest(app);
		expect(res.status).toBe(200);
	});
});
