import { supabase } from '@/lib/supabaseClient';

const API_SERVER_URL = import.meta.env.VITE_API_URL ?? '/hcgi/api';

async function getSupabaseToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
}

const integratedAiClient = {
    fetch: async (path, options = {}) => {
        const token = await getSupabaseToken();

        const response = await window.fetch(API_SERVER_URL + path, {
            ...options,
            headers: {
                ...options.headers,
                ...(token && { Authorization: `Bearer ${token}` }),
            },
        });

        if (!response.ok) {
            let message = 'Erro na requisição. Tente novamente.';
            try {
                const body = await response.json();
                if (body?.error) message = body.error;
            } catch { /* ignora falha no parse */ }
            throw new Error(message);
        }

        return response.json();
    },

    stream: async (path, { body, signal, images } = {}) => {
        const token = await getSupabaseToken();

        const headers = {
            Accept: 'text/event-stream',
            ...(token && { Authorization: `Bearer ${token}` }),
        };

        const formData = new FormData();
        formData.append('message', JSON.stringify(body.message));
        (images || []).forEach((image) => formData.append('images', image));

        const response = await window.fetch(API_SERVER_URL + path, {
            method: 'POST',
            headers,
            body: formData,
            signal,
        });

        if (!response.ok) {
            let message = 'Erro na requisição. Tente novamente.';
            try {
                const body = await response.json();
                if (body?.error) message = body.error;
            } catch { /* ignora falha no parse */ }
            throw new Error(message);
        }

        if (!response.body) throw new Error('No response body');

        return response;
    },
};

export default integratedAiClient;
export { integratedAiClient };
