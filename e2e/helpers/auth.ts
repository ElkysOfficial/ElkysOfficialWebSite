import { type Page, expect } from "@playwright/test";

/**
 * Faz login no portal com email/senha.
 * Aguarda o redirect para o dashboard antes de retornar.
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  // Aguarda redirect para /portal/admin ou /portal/cliente
  await page.waitForURL(/\/portal\/(admin|cliente)/, { timeout: 20_000 });

  // Fechar cookie banner automaticamente após login
  await dismissCookieBanner(page);
}

/**
 * Faz logout e retorna para a tela de login.
 */
export async function logout(page: Page) {
  // Clica no botão de sair no sidebar/footer
  const logoutBtn = page.locator('button:has-text("Sair")').first();
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await page.waitForURL(/\/login/);
  }
}

/**
 * Navega para uma página do admin portal via URL direta.
 */
export async function navigateAdmin(page: Page, path: string) {
  await page.goto(`/portal/admin/${path}`);
  await page.waitForLoadState("networkidle");
}

/**
 * Navega para uma página do portal do cliente via URL direta.
 */
export async function navigateClient(page: Page, path: string) {
  await page.goto(`/portal/cliente/${path}`);
  await page.waitForLoadState("networkidle");
}

/**
 * Fecha o banner de cookies se estiver visível.
 */
export async function dismissCookieBanner(page: Page) {
  const cookieBtn = page.locator('button:has-text("Aceitar Cookies")');
  if (await cookieBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cookieBtn.click();
    await cookieBtn.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
  }
}

/**
 * Aguarda toast de sucesso aparecer e desaparecer.
 */
export async function expectToast(page: Page, textMatch: string | RegExp) {
  const toast = page.locator("[data-sonner-toast]").filter({ hasText: textMatch });
  await expect(toast.first()).toBeVisible({ timeout: 10_000 });
}

/**
 * Aguarda loading desaparecer (PortalLoading spinner).
 */
export async function waitForPortalLoad(page: Page) {
  const spinner = page.locator(".animate-portal-spin");
  if (await spinner.isVisible({ timeout: 2000 }).catch(() => false)) {
    await spinner.waitFor({ state: "hidden", timeout: 30_000 });
  }
}

/**
 * Gera string única para evitar colisão em testes.
 */
export function uniqueId(prefix = "test") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}
