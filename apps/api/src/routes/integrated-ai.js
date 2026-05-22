import { Router } from 'express';
import { z } from 'zod';
import { ContentBlockType, stream, uploadImagesToSupabase } from '../api/integrated-ai.js';
import { SystemPrompt } from '../constants/prompts.js';
import { uploadFiles, validateMagicBytes } from '../middleware/file-upload.js';
import { integratedAiRateLimit } from '../middleware/integrated-ai-rate-limit.js';
import { supabaseAuth } from '../middleware/supabase-auth.js';
import { supabaseAdmin } from '../utils/supabaseClient.js';

const router = Router();

router.use(supabaseAuth);

/**
 * @openapi
 * /integrated-ai/history/clear:
 *   post:
 *     summary: Apaga todo o histórico de conversa do usuário
 *     tags: [Integrated AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Histórico apagado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *       401:
 *         description: Não autorizado
 */
router.post('/history/clear', async (req, res) => {
    if (!req.supabaseUserId) return res.status(401).json({ error: 'Não autorizado.' });
    const { error } = await supabaseAdmin.from('integrated_ai_messages').delete().eq('user_id', req.supabaseUserId);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
});

/**
 * @openapi
 * /integrated-ai/stream:
 *   post:
 *     summary: Envia mensagem e recebe resposta da IA via Server-Sent Events
 *     tags: [Integrated AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 maxLength: 10000
 *                 description: JSON serializado com array de blocos de conteúdo
 *                 example: '[{"type":"text","text":"Olá!"}]'
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Até 4 imagens (JPEG, PNG, WebP, máx. 5MB cada)
 *     responses:
 *       200:
 *         description: Stream SSE com a resposta da IA
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *       400:
 *         description: Dados inválidos
 *       429:
 *         description: Rate limit excedido (10 req/min por usuário)
 */
router.post('/stream', integratedAiRateLimit, uploadFiles({
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    fieldName: 'images',
}), async (req, res) => {
    const { message } = req.body;

    const msgResult = z.string({ required_error: 'message é obrigatório.' }).min(1).max(10000, 'Mensagem muito longa.').safeParse(message);
    if (!msgResult.success) {
        return res.status(400).json({ error: msgResult.error.issues[0]?.message ?? 'Dados inválidos.' });
    }

    const invalidFiles = (req.files ?? []).filter((f) => !validateMagicBytes(f));
    if (invalidFiles.length > 0) {
        return res.status(400).json({ error: 'Um ou mais arquivos enviados são inválidos.' });
    }

    const parsedMessage = JSON.parse(message);

    if (req.files?.length > 0) {
        const imageUrls = await uploadImagesToSupabase({ images: req.files });
        imageUrls.forEach((url) => {
            parsedMessage.push({ type: ContentBlockType.Image, image: url });
        });
    }

    const sseStream = await stream({
        userId: req.supabaseUserId,
        systemPrompt: SystemPrompt,
        userMessage: parsedMessage,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    sseStream.pipe(res, { end: false });
    res.on('close', () => sseStream.destroy());
});

export default router;
