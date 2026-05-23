import express from 'express';
import Stripe from 'stripe';
import logger from '../utils/logger.js';
import { supabaseAdmin } from '../utils/supabaseClient.js';
import { supabaseAuth } from '../middleware/supabase-auth.js';
import { stripeCheckoutRateLimit, stripePortalRateLimit, stripeWebhookRateLimit } from '../middleware/stripe-rate-limit.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const planPrices = {
    professional: 4700,
    enterprise: 14700,
};

/**
 * @openapi
 * /stripe/create-checkout:
 *   post:
 *     summary: Cria uma sessão de checkout Stripe
 *     tags: [Stripe]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [planType, userId]
 *             properties:
 *               planType:
 *                 type: string
 *                 enum: [professional, enterprise]
 *               userId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Sessão criada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                 checkoutUrl:
 *                   type: string
 *                   format: uri
 *       400:
 *         $ref: '#/components/schemas/Error'
 */
router.post('/create-checkout', supabaseAuth, stripeCheckoutRateLimit, async (req, res) => {
    const { planType, userId } = req.body;

    if (!planType || !userId) {
        return res.status(400).json({ error: 'Missing required fields: planType, userId' });
    }

    if (!planPrices[planType]) {
        return res.status(400).json({ error: `Invalid planType. Allowed values: ${Object.keys(planPrices).join(', ')}` });
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'brl',
                        product_data: {
                            name: `SellMind ${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`,
                        },
                        unit_amount: planPrices[planType],
                        recurring: { interval: 'month' },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/cancel`,
            metadata: { userId, planType },
        });
        res.json({ sessionId: session.id, checkoutUrl: session.url });
    } catch (err) {
        logger.error('Stripe create-checkout error:', err.message);
        res.status(err.statusCode ?? 500).json({ error: 'Erro ao criar sessão de pagamento.' });
    }
});

/**
 * @openapi
 * /stripe/create-portal:
 *   post:
 *     summary: Cria sessão do portal de gerenciamento de assinatura
 *     tags: [Stripe]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: URL do portal gerada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   format: uri
 *       404:
 *         description: Nenhuma assinatura encontrada
 */
router.post('/create-portal', supabaseAuth, stripePortalRateLimit, async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId obrigatório' });

    const { data: subscriber } = await supabaseAdmin
        .from('subscribers')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .maybeSingle();

    if (!subscriber?.stripe_customer_id) {
        return res.status(404).json({ error: 'Nenhuma assinatura encontrada para este usuário.' });
    }

    try {
        const session = await stripe.billingPortal.sessions.create({
            customer: subscriber.stripe_customer_id,
            return_url: `${process.env.FRONTEND_URL}/dashboard`,
        });
        res.json({ url: session.url });
    } catch (err) {
        logger.error('Stripe create-portal error:', err.message);
        res.status(err.statusCode ?? 500).json({ error: 'Erro ao abrir portal de assinatura.' });
    }
});

/**
 * @openapi
 * /stripe/session/{sessionId}:
 *   get:
 *     summary: Consulta o status de uma sessão de checkout
 *     tags: [Stripe]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         example: cs_test_abc123
 *     responses:
 *       200:
 *         description: Status da sessão
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [paid, unpaid, no_payment_required]
 *                 amountTotal:
 *                   type: integer
 *                 customerEmail:
 *                   type: string
 *                   format: email
 */
router.get('/session/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        res.json({
            id: session.id,
            status: session.payment_status,
            amountTotal: session.amount_total,
            customerEmail: session.customer_details?.email,
        });
    } catch (err) {
        logger.error('Stripe retrieve-session error:', err.message);
        res.status(err.statusCode ?? 500).json({ error: 'Sessão de pagamento não encontrada.' });
    }
});

// POST /stripe/webhook
router.post('/webhook', stripeWebhookRateLimit, async (req, res) => {
    const sig = req.headers['stripe-signature'];
    if (!sig) return res.status(400).json({ error: 'Missing stripe-signature header' });

    const secret = (process.env.STRIPE_WEBHOOK_SECRET ?? '').trim();

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, secret);
    } catch (err) {
        logger.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: 'Invalid signature' });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const { userId, planType } = session.metadata;

                if (userId && planType) {
                    const subscriptionEndDate = new Date();
                    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);

                    const { data: existing } = await supabaseAdmin
                        .from('subscribers')
                        .select('id')
                        .eq('user_id', userId)
                        .maybeSingle();

                    if (existing) {
                        await supabaseAdmin.from('subscribers').update({
                            stripe_customer_id: session.customer,
                            subscribed: true,
                            subscription_tier: planType,
                            subscription_end: subscriptionEndDate.toISOString(),
                        }).eq('user_id', userId);
                    } else {
                        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
                        await supabaseAdmin.from('subscribers').insert({
                            user_id: userId,
                            email: userData?.user?.email ?? '',
                            stripe_customer_id: session.customer,
                            subscribed: true,
                            subscription_tier: planType,
                            subscription_end: subscriptionEndDate.toISOString(),
                        });
                    }

                    await supabaseAdmin.from('profiles').update({ plan_type: planType }).eq('user_id', userId);
                    logger.info(`Subscription created for user ${userId} with plan ${planType}`);
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                const { data: record } = await supabaseAdmin
                    .from('subscribers')
                    .select('id, user_id')
                    .eq('stripe_customer_id', subscription.customer)
                    .maybeSingle();

                if (record) {
                    await supabaseAdmin.from('subscribers').update({
                        subscribed: subscription.status === 'active',
                        subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
                    }).eq('id', record.id);
                    logger.info(`Subscription updated for user ${record.user_id}`);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                const { data: record } = await supabaseAdmin
                    .from('subscribers')
                    .select('id, user_id')
                    .eq('stripe_customer_id', subscription.customer)
                    .maybeSingle();

                if (record) {
                    await supabaseAdmin.from('subscribers').update({
                        subscribed: false,
                        subscription_end: new Date().toISOString(),
                    }).eq('id', record.id);
                    await supabaseAdmin.from('profiles').update({ plan_type: 'free' }).eq('user_id', record.user_id);
                    logger.info(`Subscription cancelled for user ${record.user_id}`);
                }
                break;
            }

            default:
                logger.info(`Unhandled event type: ${event.type}`);
        }
    } catch (err) {
        logger.error('Error processing webhook event:', err);
        throw err;
    }

    res.json({ received: true });
});

export default router;
