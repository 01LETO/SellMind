import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const mockCreate = vi.fn().mockResolvedValue({ id: 'cs_test_123', url: 'https://checkout.stripe.com/test' });
const mockRetrieve = vi.fn().mockResolvedValue({
	id: 'cs_test_123',
	payment_status: 'paid',
	amount_total: 4700,
	customer_details: { email: 'test@example.com' },
});
const mockPortalCreate = vi.fn().mockResolvedValue({ url: 'https://billing.stripe.com/test' });
const mockConstructEvent = vi.fn();

vi.mock('stripe', () => {
	const MockStripe = function () {
		this.checkout = { sessions: { create: mockCreate, retrieve: mockRetrieve } };
		this.billingPortal = { sessions: { create: mockPortalCreate } };
		this.webhooks = { constructEvent: mockConstructEvent };
	};
	return { default: MockStripe };
});

vi.mock('../utils/supabaseClient.js', () => ({
	supabaseAdmin: {
		from: vi.fn(),
		auth: {
			admin: {
				getUserById: vi.fn().mockResolvedValue({ data: { user: { email: 'test@example.com' } } }),
			},
		},
	},
}));

vi.mock('../middleware/supabase-auth.js', () => ({
	supabaseAuth: (req, _res, next) => {
		req.supabaseUserId = 'user-test-123';
		next();
	},
}));

const { supabaseAdmin } = await import('../utils/supabaseClient.js');
const app = (await import('../app.js')).default;

describe('POST /stripe/create-checkout', () => {
	it('retorna 400 quando planType está ausente', async () => {
		const res = await request(app).post('/stripe/create-checkout').send({ userId: 'user-123' });
		expect(res.status).toBe(400);
		expect(res.body).toHaveProperty('error');
	});

	it('retorna 400 quando userId está ausente', async () => {
		const res = await request(app).post('/stripe/create-checkout').send({ planType: 'professional' });
		expect(res.status).toBe(400);
	});

	it('retorna 400 quando planType é inválido', async () => {
		const res = await request(app)
			.post('/stripe/create-checkout')
			.send({ planType: 'invalid', userId: 'user-123' });
		expect(res.status).toBe(400);
	});

	it('retorna sessionId e checkoutUrl com dados válidos', async () => {
		const res = await request(app)
			.post('/stripe/create-checkout')
			.send({ planType: 'professional', userId: 'user-123' });
		expect(res.status).toBe(200);
		expect(res.body).toHaveProperty('sessionId');
		expect(res.body).toHaveProperty('checkoutUrl');
	});
});

describe('POST /stripe/webhook', () => {
	beforeEach(() => vi.clearAllMocks());

	it('retorna 400 quando stripe-signature está ausente', async () => {
		const res = await request(app)
			.post('/stripe/webhook')
			.set('Content-Type', 'application/json')
			.send('{}');
		expect(res.status).toBe(400);
		expect(res.body.error).toMatch(/stripe-signature/i);
	});

	it('retorna 400 quando assinatura é inválida', async () => {
		mockConstructEvent.mockImplementation(() => {
			throw new Error('No signatures found matching the expected signature');
		});

		const res = await request(app)
			.post('/stripe/webhook')
			.set('Content-Type', 'application/json')
			.set('stripe-signature', 'assinatura-invalida')
			.send('{}');

		expect(res.status).toBe(400);
	});

	it('processa checkout.session.completed e retorna 200', async () => {
		mockConstructEvent.mockReturnValue({
			type: 'checkout.session.completed',
			data: {
				object: {
					customer: 'cus_test_123',
					metadata: { userId: 'user-abc', planType: 'professional' },
				},
			},
		});

		supabaseAdmin.from.mockImplementation(() => ({
			select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }) }),
			insert: () => Promise.resolve({ error: null }),
			update: () => ({ eq: () => Promise.resolve({ error: null }) }),
		}));

		const res = await request(app)
			.post('/stripe/webhook')
			.set('Content-Type', 'application/json')
			.set('stripe-signature', 'valid-sig')
			.send('{}');

		expect(res.status).toBe(200);
		expect(res.body).toHaveProperty('received', true);
	});

	it('processa customer.subscription.deleted e reverte plano para free', async () => {
		const mockUpdate = vi.fn().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });

		mockConstructEvent.mockReturnValue({
			type: 'customer.subscription.deleted',
			data: { object: { customer: 'cus_test_123', status: 'canceled' } },
		});

		supabaseAdmin.from.mockImplementation(() => ({
			select: () => ({
				eq: () => ({
					maybeSingle: () => Promise.resolve({ data: { id: 'sub-1', user_id: 'user-abc' } }),
				}),
			}),
			update: mockUpdate,
		}));

		const res = await request(app)
			.post('/stripe/webhook')
			.set('Content-Type', 'application/json')
			.set('stripe-signature', 'valid-sig')
			.send('{}');

		expect(res.status).toBe(200);
		expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ subscribed: false }));
	});
});

describe('POST /stripe/create-portal', () => {
	beforeEach(() => vi.clearAllMocks());

	it('retorna 400 quando userId está ausente', async () => {
		const res = await request(app).post('/stripe/create-portal').send({});
		expect(res.status).toBe(400);
	});

	it('retorna 404 quando usuário não tem assinatura', async () => {
		supabaseAdmin.from.mockReturnValue({
			select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }) }),
		});

		const res = await request(app).post('/stripe/create-portal').send({ userId: 'user-123' });
		expect(res.status).toBe(404);
	});

	it('retorna URL do portal quando usuário tem assinatura', async () => {
		supabaseAdmin.from.mockReturnValue({
			select: () => ({
				eq: () => ({
					maybeSingle: () => Promise.resolve({ data: { stripe_customer_id: 'cus_test_123' } }),
				}),
			}),
		});

		const res = await request(app).post('/stripe/create-portal').send({ userId: 'user-123' });
		expect(res.status).toBe(200);
		expect(res.body).toHaveProperty('url', 'https://billing.stripe.com/test');
	});
});

describe('GET /stripe/session/:sessionId', () => {
	beforeEach(() => vi.clearAllMocks());

	it('retorna dados da sessão para sessionId válido', async () => {
		const res = await request(app).get('/stripe/session/cs_test_123');
		expect(res.status).toBe(200);
		expect(res.body).toMatchObject({
			id: 'cs_test_123',
			status: 'paid',
			amountTotal: 4700,
			customerEmail: 'test@example.com',
		});
	});

	it('propaga erro do Stripe quando sessionId não existe', async () => {
		mockRetrieve.mockRejectedValueOnce(Object.assign(new Error('No such session'), { status: 404 }));
		const res = await request(app).get('/stripe/session/cs_invalid');
		expect(res.status).toBe(404);
	});
});
