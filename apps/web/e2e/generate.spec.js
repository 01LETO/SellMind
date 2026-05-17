import { test, expect } from '@playwright/test';
import { mockAuthenticatedUser, mockUnauthenticatedUser, mockApiResponse } from './helpers.js';

const GENERATED_HTML = '<!DOCTYPE html><html><head><title>Curso Teste</title></head><body><h1>Curso de Marketing</h1></body></html>';

test.describe('Geração de página de vendas', () => {
	test('redireciona para /landing sem autenticação', async ({ page }) => {
		await mockUnauthenticatedUser(page);
		await page.goto('/');
		await expect(page).toHaveURL(/\/landing/);
	});

	test.describe('Usuário autenticado', () => {
		test.beforeEach(async ({ page }) => {
			await mockAuthenticatedUser(page);
		});

		test('exibe formulário de geração na home', async ({ page }) => {
			await page.goto('/');
			await expect(page.getByLabel(/produto|serviço/i)).toBeVisible();
			await expect(page.getByLabel(/público-alvo/i)).toBeVisible();
			await expect(page.getByLabel(/dor|problema/i)).toBeVisible();
			await expect(page.getByLabel(/transformação/i)).toBeVisible();
		});

		test('botão de gerar fica desabilitado sem tom de voz selecionado', async ({ page }) => {
			await page.goto('/');
			await page.getByLabel(/produto|serviço/i).fill('Curso de Marketing');
			// Sem selecionar tom de voz — ao submeter deve mostrar erro
			const submitBtn = page.getByRole('button', { name: /gerar|criar página/i });
			await submitBtn.click();
			await expect(page.getByText(/tom de voz|obrigatório/i)).toBeVisible({ timeout: 3000 });
		});

		test('gera página com sucesso e navega para /result', async ({ page }) => {
			// Mock da API de geração
			await mockApiResponse(page, '**/pages/generate', {
				html: GENERATED_HTML,
				title: 'Curso de Marketing — Página de Vendas',
				wordCount: 5,
				generatedAt: new Date().toISOString(),
				pageId: 'page-e2e-123',
			});

			await page.goto('/');

			await page.getByLabel(/produto|serviço/i).fill('Curso de Marketing');
			await page.getByLabel(/público-alvo/i).fill('Empreendedores');
			await page.getByLabel(/dor|problema/i).fill('Não atrai clientes');
			await page.getByLabel(/transformação/i).fill('Faturar 10k');

			// Seleciona tom de voz no Select do Radix
			await page.getByRole('combobox').click();
			await page.getByRole('option', { name: /profissional|inspirador|urgente|amigável/i }).first().click();

			await page.getByRole('button', { name: /gerar|criar página/i }).click();

			// Deve navegar para /result com o HTML gerado
			await expect(page).toHaveURL(/\/result/, { timeout: 10000 });
		});

		test('exibe erro quando API retorna 403 (limite atingido)', async ({ page }) => {
			await mockApiResponse(page, '**/pages/generate', {
				error: 'Limite do plano free atingido (3 páginas/mês).',
				limitReached: true,
				planType: 'free',
				limit: 3,
				used: 3,
			}, 403);

			await page.goto('/');

			await page.getByLabel(/produto|serviço/i).fill('Produto Teste');
			await page.getByLabel(/público-alvo/i).fill('Público Teste');
			await page.getByLabel(/dor|problema/i).fill('Dor Teste');
			await page.getByLabel(/transformação/i).fill('Transformação Teste');

			await page.getByRole('combobox').click();
			await page.getByRole('option').first().click();

			await page.getByRole('button', { name: /gerar|criar página/i }).click();

			await expect(page.getByText(/limite|upgrade|plano/i)).toBeVisible({ timeout: 5000 });
		});
	});
});

test.describe('Dashboard', () => {
	test('redireciona para /landing sem autenticação', async ({ page }) => {
		await mockUnauthenticatedUser(page);
		await page.goto('/dashboard');
		await expect(page).toHaveURL(/\/landing/);
	});

	test('exibe páginas geradas do usuário', async ({ page }) => {
		await mockAuthenticatedUser(page);

		// Mock das páginas do Supabase
		await page.route('**/rest/v1/pages**', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([
					{
						id: 'page-1',
						product_name: 'Curso de Marketing',
						title: 'Curso de Marketing — Página de Vendas',
						word_count: 1500,
						created_at: new Date().toISOString(),
					},
				]),
			});
		});

		await page.goto('/dashboard');
		await expect(page).toHaveURL(/\/dashboard/);
		await expect(page.getByText('Curso de Marketing')).toBeVisible({ timeout: 5000 });
	});

	test('exibe mensagem quando não há páginas geradas', async ({ page }) => {
		await mockAuthenticatedUser(page);

		await page.route('**/rest/v1/pages**', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([]),
			});
		});

		await page.goto('/dashboard');
		await expect(page.getByText(/nenhuma|ainda não|crie sua primeira/i)).toBeVisible({ timeout: 5000 });
	});
});
