import { test, expect } from '@playwright/test';
import { mockUnauthenticatedUser } from './helpers.js';

test.describe('Fluxo de autenticação', () => {
	test.beforeEach(async ({ page }) => {
		await mockUnauthenticatedUser(page);
	});

	test.describe('Login', () => {
		test('exibe formulário de login', async ({ page }) => {
			await page.goto('/login');
			await expect(page.getByLabel(/e-mail/i)).toBeVisible();
			await expect(page.getByLabel(/senha/i)).toBeVisible();
			await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
		});

		test('mostra erro ao tentar login com credenciais inválidas', async ({ page }) => {
			// Mock retorna erro de autenticação
			await page.route('**/auth/v1/token**', async (route) => {
				await route.fulfill({
					status: 400,
					contentType: 'application/json',
					body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }),
				});
			});

			await page.goto('/login');
			await page.getByLabel(/e-mail/i).fill('wrong@email.com');
			await page.getByLabel(/senha/i).fill('senhaerrada');
			await page.getByRole('button', { name: /entrar/i }).click();

			// Deve exibir mensagem de erro (toast)
			await expect(page.getByText(/erro|invalid|credenciais/i)).toBeVisible({ timeout: 5000 });
		});

		test('link "esqueci minha senha" navega para forgot-password', async ({ page }) => {
			await page.goto('/login');
			await page.getByRole('link', { name: /esqueci|recuperar/i }).click();
			await expect(page).toHaveURL(/\/forgot-password/);
		});

		test('link "criar conta" navega para signup', async ({ page }) => {
			await page.goto('/login');
			await page.getByRole('link', { name: /criar conta|cadastr|signup/i }).click();
			await expect(page).toHaveURL(/\/signup/);
		});
	});

	test.describe('Signup', () => {
		test('exibe formulário de cadastro', async ({ page }) => {
			await page.goto('/signup');
			await expect(page.getByLabel(/nome/i)).toBeVisible();
			await expect(page.getByLabel(/e-mail/i)).toBeVisible();
			// Senha aparece mais de uma vez — pega pelo primeiro
			await expect(page.getByLabel(/senha/i).first()).toBeVisible();
			await expect(page.getByRole('button', { name: /criar conta|cadastrar/i })).toBeVisible();
		});

		test('mostra erro quando senhas não coincidem', async ({ page }) => {
			await page.goto('/signup');
			await page.getByLabel(/nome/i).fill('Usuário Teste');
			await page.getByLabel(/e-mail/i).fill('novo@email.com');

			const senhaFields = page.getByLabel(/senha/i);
			await senhaFields.first().fill('senha12345');
			await senhaFields.last().fill('senhadiferente');

			await page.getByRole('button', { name: /criar conta|cadastrar/i }).click();

			await expect(page.getByText(/não coincidem|senhas/i)).toBeVisible({ timeout: 5000 });
		});
	});

	test.describe('Recuperação de senha', () => {
		test('exibe campo de e-mail', async ({ page }) => {
			await page.goto('/forgot-password');
			await expect(page.getByLabel(/e-mail/i)).toBeVisible();
			await expect(page.getByRole('button', { name: /enviar|recuperar/i })).toBeVisible();
		});

		test('exibe confirmação após envio do link', async ({ page }) => {
			await page.route('**/auth/v1/recover**', async (route) => {
				await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
			});

			await page.goto('/forgot-password');
			await page.getByLabel(/e-mail/i).fill('usuario@email.com');
			await page.getByRole('button', { name: /enviar|recuperar/i }).click();

			await expect(page.getByText(/verifique seu e-mail|enviamos/i)).toBeVisible({ timeout: 5000 });
		});

		test('reset-password mostra tela de link expirado após timeout', async ({ page }) => {
			// Não dispara nenhum evento PASSWORD_RECOVERY — simula link expirado
			await page.goto('/reset-password');

			// Aguarda o timeout de 8s configurado na página
			await expect(page.getByText(/expirado|inválido/i)).toBeVisible({ timeout: 12000 });
			await expect(page.getByRole('button', { name: /solicitar novo link/i })).toBeVisible();
		});
	});
});
