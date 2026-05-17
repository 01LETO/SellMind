import { Router } from 'express';
import { z } from 'zod';
import { ContentBlockType, stream, uploadImagesToSupabase } from '../api/integrated-ai.js';
import { SystemPrompt } from '../constants/prompts.js';
import { uploadFiles } from '../middleware/file-upload.js';
import { integratedAiRateLimit } from '../middleware/integrated-ai-rate-limit.js';
import { supabaseAuth } from '../middleware/supabase-auth.js';
import { supabaseAdmin } from '../utils/supabaseClient.js';

const router = Router();

router.use(supabaseAuth);

router.post('/history/clear', async (req, res) => {
    if (!req.supabaseUserId) return res.status(401).json({ error: 'Não autorizado.' });
    const { error } = await supabaseAdmin.from('integrated_ai_messages').delete().eq('user_id', req.supabaseUserId);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
});

router.post('/stream', integratedAiRateLimit, uploadFiles({
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    fieldName: 'images',
}), async (req, res) => {
    const { message } = req.body;

    const msgResult = z.string({ required_error: 'message é obrigatório.' }).min(1).max(10000, 'Mensagem muito longa.').safeParse(message);
    if (!msgResult.success) {
        return res.status(400).json({ error: msgResult.error.issues[0]?.message ?? 'Dados inválidos.' });
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
