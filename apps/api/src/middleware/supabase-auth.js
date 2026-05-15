import { createClient } from '@supabase/supabase-js';

/**
 * Middleware que verifica o JWT do Supabase enviado pelo frontend.
 * O token chega no header Authorization: Bearer <access_token>.
 * Ao ser validado, popula req.supabaseUserId com o UUID do usuário.
 */
export async function supabaseAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.slice(7);

    try {
        // Cria um cliente anon para verificar o token do usuário
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            },
        );

        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data?.user) {
            return next(new Error('Invalid or expired token'));
        }

        req.supabaseUserId = data.user.id;
        return next();
    } catch (error) {
        return next(new Error(error.message));
    }
}
