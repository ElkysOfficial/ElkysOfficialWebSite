import { type Page, expect } from "@playwright/test";

/**
 * Faz login no portal com email/senha.
 * Aguarda o redirect para o dashboard antes de retornar.
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  await page.fill("input#email", email);
  await page.fill("input#password", password);
  await page.click('button[type="submit"]');

  // Aguarda redirect para /portal/admin ou /portal/cliente
  await page.waitForURL(/\/portal\/(admin|cliente)/, { timeout: 30_000 });

  // Fechar cookie banner automaticamente após login
  await dismissCookieBanner(page);
}

/**
 * Faz logout e retorna para a tela de login.
 */
export async function logout(page: Page) {
  const logoutBtn = page.locator('button:has-text("Sair")').first();
  if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await logoutBtn.click();
    await page.waitForURL(/\/login/, { timeout: 15_000 });
  }
}

/**
 * Navega para uma página do admin portal via URL direta.
 */
export async function navigateAdmin(page: Page, path: string) {
  await page.goto(`/portal/admin/${path}`);
  await page.waitForLoadState("domcontentloaded");
}

/**
 * Navega para uma página do portal do cliente via URL direta.
 */
export async function navigateClient(page: Page, path: string) {
  await page.goto(`/portal/cliente/${path}`);
  await page.waitForLoadState("domcontentloaded");
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
 * Aguarda toast de sucesso aparecer.
 */
export async function expectToast(page: Page, textMatch: string | RegExp, timeout = 15_000) {
  const toast = page.locator("[data-sonner-toast]").filter({ hasText: textMatch });
  await expect(toast.first()).toBeVisible({ timeout });
}

/**
 * Aguarda loading desaparecer (PortalLoading spinner) e fecha cookie banner.
 */
export async function waitForPortalLoad(page: Page) {
  // Aguardar spinner aparecer e sumir, ou timeout rápido
  const spinner = page.locator(".animate-portal-spin");
  if (await spinner.isVisible({ timeout: 2000 }).catch(() => false)) {
    await spinner.waitFor({ state: "hidden", timeout: 30_000 });
  }
  // Espera adicional para hydration
  await page.waitForTimeout(500);
  // Sempre tentar fechar cookie banner
  await dismissCookieBanner(page);
}

/**
 * Gera string única para evitar colisão em testes.
 */
export function uniqueId(prefix = "test") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Aceita um window.prompt automaticamente.
 */
export function autoAcceptDialogs(page: Page, response = "") {
  page.on("dialog", async (dialog) => {
    await dialog.accept(response);
  });
}

/**
 * Scroll no main container (AdminLayout usa overflow-auto no main).
 */
export async function scrollMainToBottom(page: Page) {
  await page.locator("main").evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await page.waitForTimeout(1000);
}

/**
 * Verifica que a página não crashou (error boundary).
 */
export async function assertNoCrash(page: Page) {
  await expect(page.locator("text=Algo deu errado")).not.toBeVisible();
}

/**
 * Captura erros de console (TypeError, ReferenceError, etc).
 * Retorna array de mensagens de erro para verificação posterior.
 *
 * Alem de armazenar, imprime EM TEMPO REAL no stdout todos os eventos
 * de console (error, warn, log, info, pageerror, HTTP failures) para
 * visibilidade total durante o E2E. Apenas erros criticos entram no
 * array retornado (que sera validado por assertNoConsoleErrors).
 */
export function captureConsoleErrors(page: Page): string[] {
  const errors: string[] = [];

  page.on("pageerror", (err) => {
    const msg = `[pageerror] ${err.message}`;

    console.log(`  🔴 ${msg}`);
    if (err.stack) {
      console.log(`     ${err.stack.split("\n").slice(0, 4).join("\n     ")}`);
    }
    errors.push(msg);
  });

  page.on("console", (msg) => {
    const type = msg.type();
    const text = msg.text();

    // Filtro de ruido para o log — esconde mensagens de infra/ambiente que nao
    // sao bugs do app (evita poluir o output com centenas de linhas irrelevantes).
    const isNoise =
      text.includes("favicon") ||
      text.includes("Content Security Policy") ||
      text.includes("net::ERR_") ||
      text.includes("NetworkError") ||
      text.includes("Failed to fetch") ||
      text.includes("Failed to load resource") || // GTM/GA DNS fail em ambiente local
      text.includes("Failed to resolve auth state"); // AbortError em navegacao SPA rapida

    if (!isNoise) {
      const icon =
        type === "error" ? "🔴" : type === "warning" ? "🟡" : type === "info" ? "🔵" : "⚪";

      console.log(`  ${icon} [console.${type}] ${text}`);
    }

    if (type === "error" && !isNoise) {
      errors.push(`[console.error] ${text}`);
    }
  });

  // Capturar requests HTTP que falharam com detalhes da URL
  page.on("response", (response) => {
    const status = response.status();
    if (status >= 400 && status !== 404) {
      const url = response.url();
      // Imprimir todas as falhas HTTP (exceto GA/favicon) para visibilidade
      if (url.includes("google") || url.includes("favicon")) return;

      console.log(`  🔴 [HTTP ${status}] ${url}`);
      errors.push(`[HTTP ${status}] ${url}`);
    }
  });

  // Capturar requests que falharam antes de receber response (DNS, network, etc)
  // Imprime URL + motivo para identificar quais hosts nao resolvem
  page.on("requestfailed", (req) => {
    const failure = req.failure();
    const errorText = failure?.errorText ?? "unknown";
    const url = req.url();
    // Ignorar ruido previsivel: GA/GTM (DNS pode falhar em ambiente local, sem
    // impacto funcional) e ERR_ABORTED (navegacao SPA aborta fetch, esperado).
    if (url.includes("google") || url.includes("favicon")) return;
    if (errorText === "net::ERR_ABORTED") return;

    console.log(`  🟠 [requestfailed] ${errorText} → ${url}`);
  });

  return errors;
}

/**
 * Verifica que nenhum erro crítico foi capturado no console.
 */
export function assertNoConsoleErrors(errors: string[], context: string) {
  if (errors.length > 0) {
    throw new Error(
      `Erros de console em "${context}":\n${errors.map((e) => `  - ${e}`).join("\n")}`
    );
  }
}
