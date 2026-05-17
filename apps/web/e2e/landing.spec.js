import { test, expect } from '@playwright/test';
import { mockUnauthenticatedUser } from './helpers.js';

test.describe('Landing Page', () => {
	test.beforeEach(async ({ page }) => {
		await mockUnauthenticatedUser(page);
	});

	test('carrega com título correto', async ({ page }) => {
		await page.goto('/landing');
		await expect(page).toHaveTitle(/SellMind/i);
	});

	test('exibe headline principal', async ({ page }) => {
		await page.goto('/landing');
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	});

	test('exibe seção de features', async ({ page }) => {
		await page.goto('/landing');
		// A landing tem 6 features — verifica pelo menos uma
		await expect(page.getByText('IA de última geração')).toBeVisible();
	});

	test('botão de CTA navega para /signup', async ({ page }) => {
		await page.goto('/landing');
		const ctaButton = page.getByRole('link', { name: /criar conta|começar|grátis/i }).first();
		await expect(ctaButton).toBeVisible();
		await ctaButton.click();
		await expect(page).toHaveURL(/\/signup/);
	});

	test('link de login navega para /login', async ({ page }) => {
		await page.goto('/landing');
		await page.getByRole('link', { name: /entrar|login/i }).first().click();
		await expect(page).toHaveURL(/\/login/);
	});

	test('rota raiz redireciona usuário não autenticado para /landing', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveURL(/\/landing/);
	});

	test('página de pricing é acessível sem autenticação', async ({ page }) => {
		await page.goto('/pricing');
		await expect(page).toHaveURL(/\/pricing/);
		await expect(page.getByRole('heading', { name: /planos|preços|pricing/i })).toBeVisible();
	});
});
