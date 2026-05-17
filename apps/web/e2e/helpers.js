// URL do Supabase nos testes (qualquer string serve, será interceptada)
export const SUPABASE_URL = 'https://test.supabase.co';

const FAKE_USER = {
	id: 'user-e2e-123',
	email: 'test@sellmind.com',
	user_metadata: { full_name: 'Usuário Teste' },
};

const FAKE_SESSION = {
	access_token: 'fake-access-token',
	refresh_token: 'fake-refresh-token',
	expires_in: 3600,
	token_type: 'bearer',
	user: FAKE_USER,
};

/**
 * Intercepta todas as chamadas ao Supabase e retorna um usuário autenticado.
 * Use isso em testes que precisam de um usuário logado.
 */
export async function mockAuthenticatedUser(page) {
	await page.route('**/auth/v1/**', async (route) => {
		const url = route.request().url();

		if (url.includes('/auth/v1/user')) {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(FAKE_USER),
			});
			return;
		}

		if (url.includes('/auth/v1/token')) {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(FAKE_SESSION),
			});
			return;
		}

		await route.continue();
	});

	// Mock do profile do usuário
	await page.route('**/rest/v1/profiles**', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify([{
				id: 'profile-123',
				user_id: FAKE_USER.id,
				email: FAKE_USER.email,
				full_name: 'Usuário Teste',
				plan_type: 'free',
			}]),
		});
	});
}

/**
 * Intercepta chamadas ao Supabase e retorna usuário não autenticado.
 */
export async function mockUnauthenticatedUser(page) {
	await page.route('**/auth/v1/user', async (route) => {
		await route.fulfill({
			status: 401,
			contentType: 'application/json',
			body: JSON.stringify({ message: 'Invalid JWT' }),
		});
	});
}

/**
 * Intercepta a API do backend (Express).
 */
export async function mockApiResponse(page, path, body, status = 200) {
	await page.route(`**${path}`, async (route) => {
		await route.fulfill({
			status,
			contentType: 'application/json',
			body: JSON.stringify(body),
		});
	});
}
