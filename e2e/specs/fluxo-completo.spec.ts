import { test, expect } from "@playwright/test";
import {
  login,
  navigateAdmin,
  navigateClient,
  expectToast,
  waitForPortalLoad,
  autoAcceptDialogs,
  scrollMainToBottom,
  assertNoCrash,
  captureConsoleErrors,
  assertNoConsoleErrors,
} from "../helpers/auth";
import {
  findClientByLeadName,
  createAuthForClient,
  findProposalByTitle,
  countAdminNotifications,
  getTimelineEventsForProject,
  cleanupAdminClient,
} from "../helpers/supabase-api";

/**
 * TESTE E2E MULTI-PERSONA COMPLETO
 *
 * TODAS as 8 personas do time + cliente participam:
 *  COMERCIAL  → Lead, diagnóstico, proposta, pipeline
 *  ADMIN      → Aprova proposta
 *  JURÍDICO   → Contrato: revisão, validação, ativação
 *  PO         → Onboarding, validação, aceite formal
 *  DEVELOPER  → Verifica projeto, tarefas, docs
 *  DESIGNER   → Verifica projeto, docs
 *  MARKETING  → Verifica CRM, calendário
 *  FINANCEIRO → Cobranças, régua
 *  SUPORTE    → Tickets, SLA
 *  CLIENTE    → Portal: propostas, aceita contrato, vê projeto
 */

// ── Todas as personas ──
const ADMIN = { email: process.env.ADMIN_EMAIL ?? "", password: process.env.ADMIN_PASSWORD ?? "" };
const COMERCIAL = {
  email: process.env.COMERCIAL_EMAIL ?? "",
  password: process.env.COMERCIAL_PASSWORD ?? "",
};
const JURIDICO = {
  email: process.env.JURIDICO_EMAIL ?? "",
  password: process.env.JURIDICO_PASSWORD ?? "",
};
const FINANCEIRO = {
  email: process.env.FINANCEIRO_EMAIL ?? "",
  password: process.env.FINANCEIRO_PASSWORD ?? "",
};
const PO = { email: process.env.PO_EMAIL ?? "", password: process.env.PO_PASSWORD ?? "" };
const DEVELOPER = {
  email: process.env.DEVELOPER_EMAIL ?? "",
  password: process.env.DEVELOPER_PASSWORD ?? "",
};
const DESIGNER = {
  email: process.env.DESIGNER_EMAIL ?? "",
  password: process.env.DESIGNER_PASSWORD ?? "",
};
const MARKETING = {
  email: process.env.MARKETING_EMAIL ?? "",
  password: process.env.MARKETING_PASSWORD ?? "",
};
const SUPORTE = {
  email: process.env.SUPORTE_EMAIL ?? "",
  password: process.env.SUPORTE_PASSWORD ?? "",
};

const CLIENT_PASSWORD = "E2eClient@2026";

// ── Dados de teste ──
const TEST_MARKER = `E2E_TEST_${Date.now()}`;
const LEAD_NAME = `${TEST_MARKER}_Lead`;
const LEAD_EMAIL = `e2e-${Date.now()}@teste-elkys.com`;
const LEAD_COMPANY = `${TEST_MARKER}_Empresa`;
const PROPOSAL_TITLE = `${TEST_MARKER}_Proposta`;
const PROPOSAL_VALUE = "15.000,00";
const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 30);
const VALID_UNTIL = futureDate.toISOString().split("T")[0];

let clientEmail = "";

// ═══════════════════════════════════════════════════════════════
// FLUXO COMPLETO — 20 etapas, todas as personas
// ═══════════════════════════════════════════════════════════════

test.describe.serial("Fluxo Multi-Persona Completo", () => {
  test.afterAll(async () => {
    await cleanupAdminClient();
  });

  // Captura erros de console em TODOS os testes com browser
  let consoleErrors: string[] = [];
  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page);
  });
  test.afterEach(async ({ page: _page }, testInfo) => {
    // Só verifica erros de console em testes que usam browser (não os de API)
    if (testInfo.title.includes("[SISTEMA]") || testInfo.title.includes("[VERIFICAÇÃO]")) return;
    assertNoConsoleErrors(consoleErrors, testInfo.title);
  });

  // ─── 1. COMERCIAL cria lead ───
  test("1. [COMERCIAL] Cria lead", async ({ page }) => {
    test.skip(!COMERCIAL.email, "skip");
    await login(page, COMERCIAL.email, COMERCIAL.password);
    await navigateAdmin(page, "crm");
    await waitForPortalLoad(page);
    const toggleBtn = page.locator(
      'button:has-text("Novo Lead"), button:has-text("Fechar formulario")'
    );
    await toggleBtn.first().click();
    const nameInput = page.locator("input#lead-name");
    if (!(await nameInput.isVisible({ timeout: 3000 }).catch(() => false)))
      await page.click('button:has-text("Novo Lead")');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill(LEAD_NAME);
    await page.fill("input#lead-email", LEAD_EMAIL);
    await page.fill("input#lead-company", LEAD_COMPANY);
    await page.fill("input#lead-value", "15000");
    const src = page.locator("select#lead-source");
    if (await src.isVisible()) await src.selectOption("inbound");
    await page.click('button:has-text("Salvar Lead")');
    await expectToast(page, /criado|salvo/i);
    await expect(page.locator(`text=${LEAD_NAME}`).first()).toBeVisible({ timeout: 10_000 });
  });

  // ─── 2. COMERCIAL diagnóstico ───
  test("2. [COMERCIAL] Diagnóstico do lead (gate)", async ({ page }) => {
    test.skip(!COMERCIAL.email, "skip");
    await login(page, COMERCIAL.email, COMERCIAL.password);
    await navigateAdmin(page, "crm");
    await waitForPortalLoad(page);
    await page.locator(`a:has-text("${LEAD_NAME}")`).first().click();
    await waitForPortalLoad(page);
    const ctx = page.locator('textarea[placeholder*="Quem"]');
    await ctx.scrollIntoViewIfNeeded();
    await ctx.fill(`${TEST_MARKER} - Sistema web para gestão de pedidos`);
    await page
      .locator('textarea[placeholder*="dor concreta"]')
      .fill(`${TEST_MARKER} - Processo manual`);
    await page
      .locator('textarea[placeholder*="resultado esperado"]')
      .fill(`${TEST_MARKER} - Automatizar`);
    const btn = page.locator('button:has-text("Concluir diagnóstico")');
    await expect(btn).toBeVisible({ timeout: 5000 });
    await btn.click();
    await expectToast(page, /conclu|salvo|diagnóstico/i);
    await page.waitForTimeout(2000);
    await expect(page.locator('a:has-text("Criar proposta")')).toBeVisible({ timeout: 10_000 });
  });

  // ─── 3. COMERCIAL envia proposta ───
  test("3. [COMERCIAL] Cria e envia proposta", async ({ page }) => {
    test.skip(!COMERCIAL.email, "skip");
    await login(page, COMERCIAL.email, COMERCIAL.password);
    await navigateAdmin(page, "crm");
    await waitForPortalLoad(page);
    await page.locator(`a:has-text("${LEAD_NAME}")`).first().click();
    await waitForPortalLoad(page);
    await page.locator('a:has-text("Criar proposta")').click();
    await waitForPortalLoad(page);
    await page.fill("input#title", PROPOSAL_TITLE);
    await page.fill("input#solution_type", "Sistema Web");
    await page.locator("input#total_amount").click();
    await page.locator("input#total_amount").fill(PROPOSAL_VALUE);
    await page.fill("input#valid_until", VALID_UNTIL);
    await page.fill("textarea#scope_summary", `${TEST_MARKER} - Dashboard e relatórios`);
    await page.fill("textarea#payment_conditions", "50% entrada, 50% entrega");
    await page.fill("input#document_url", "https://drive.google.com/e2e-test-doc");
    const sendBtn = page.locator('button:has-text("Enviar para cliente")');
    await expect(sendBtn).toBeEnabled({ timeout: 5000 });
    await sendBtn.click();
    await expectToast(page, /enviada|enviado/i);
  });

  // ─── 4. ADMIN aprova ───
  test("4. [ADMIN] Aprova proposta → contrato + converte lead", async ({ page }) => {
    test.skip(!ADMIN.email, "skip");
    await login(page, ADMIN.email, ADMIN.password);
    await navigateAdmin(page, "crm");
    await waitForPortalLoad(page);
    await page.click('button:has-text("Propostas")');
    await page.waitForTimeout(3000);
    await page.locator(`a:has-text("${PROPOSAL_TITLE}")`).first().click();
    await waitForPortalLoad(page);
    const btn = page
      .locator('button:has-text("Aprovar e criar projeto"), button:has-text("Criar projeto")')
      .first();
    await expect(btn).toBeVisible({ timeout: 10_000 });
    await btn.click();
    await expectToast(page, /aprovad|contrato|projeto|criado/i);
    await page.waitForTimeout(3000);
  });

  // ─── 5. SISTEMA cria auth para cliente ───
  test("5. [SISTEMA] Cria conta auth para cliente convertido", async () => {
    const clientId = await findClientByLeadName(LEAD_NAME);
    expect(clientId).toBeTruthy();
    const result = await createAuthForClient(clientId!, CLIENT_PASSWORD);
    expect(result.userId).toBeTruthy();
    clientEmail = result.email;
  });

  // ─── 6. CLIENTE vê propostas ───
  test("6. [CLIENTE] Visualiza propostas no portal", async ({ page }) => {
    expect(clientEmail).toBeTruthy();
    await login(page, clientEmail, CLIENT_PASSWORD);
    await navigateClient(page, "propostas");
    await waitForPortalLoad(page);
    await assertNoCrash(page);
    await expect(page.locator(`text=${PROPOSAL_TITLE}`).first()).toBeVisible({ timeout: 15_000 });
  });

  // ─── 7. CLIENTE vê contratos ───
  test("7. [CLIENTE] Visualiza contratos no portal", async ({ page }) => {
    await login(page, clientEmail, CLIENT_PASSWORD);
    await navigateClient(page, "contratos");
    await waitForPortalLoad(page);
    await assertNoCrash(page);
  });

  // ─── 8. JURÍDICO envia para validação ───
  test("8. [JURÍDICO] Revisa contrato e envia para validação", async ({ page }) => {
    test.skip(!JURIDICO.email, "skip");
    await login(page, JURIDICO.email, JURIDICO.password);
    await navigateAdmin(page, "contratos");
    await waitForPortalLoad(page);
    const filterBtn = page.locator('button:has-text("Rascunho")');
    if (await filterBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await filterBtn.click();
      await page.waitForTimeout(2000);
    }
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(TEST_MARKER);
      await page.waitForTimeout(2000);
    }
    await expect(page.locator("text=Rascunho").first()).toBeVisible({ timeout: 15_000 });
    autoAcceptDialogs(page, "Contrato revisado - E2E");
    await page.locator('button:has-text("Enviar para validação")').first().click();
    await expectToast(page, /em_validacao|validação|Contrato/i);
  });

  // ─── 9. CLIENTE aceita contrato ───
  test("9. [CLIENTE] Aceita contrato no portal", async ({ page }) => {
    await login(page, clientEmail, CLIENT_PASSWORD);
    await navigateClient(page, "contratos");
    await waitForPortalLoad(page);
    const acceptBtn = page.locator('button:has-text("Aceitar contrato")');
    if (await acceptBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await acceptBtn.click();
      const confirmBtn = page
        .locator('button:has-text("Confirmar"), button:has-text("Aceitar")')
        .last();
      if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false))
        await confirmBtn.click();
      await page.waitForTimeout(3000);
    }
  });

  // ─── 10. JURÍDICO ativa contrato ───
  test("10. [JURÍDICO] Valida assinatura e ativa contrato → projeto criado", async ({ page }) => {
    test.skip(!JURIDICO.email, "skip");
    await login(page, JURIDICO.email, JURIDICO.password);
    await navigateAdmin(page, "contratos");
    await waitForPortalLoad(page);
    const filterBtn = page.locator('button:has-text("Em validação")');
    if (await filterBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await filterBtn.click();
      await page.waitForTimeout(2000);
    }
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(TEST_MARKER);
      await page.waitForTimeout(2000);
    }
    autoAcceptDialogs(page, "Assinatura validada - E2E");
    await page.locator('button:has-text("Validar assinatura e ativar")').first().click();
    await expectToast(page, /ativo|projeto|cobranças|criados/i);
    await page.waitForTimeout(3000);
  });

  // ─── 11. PO onboarding ───
  test("11. [PO] Completa onboarding do projeto", async ({ page }) => {
    test.skip(!PO.email, "skip");
    await login(page, PO.email, PO.password);
    await navigateAdmin(page, "projetos");
    await waitForPortalLoad(page);
    const searchInput = page.locator(
      'input[placeholder*="buscar" i], input[placeholder*="Buscar"]'
    );
    if (await searchInput.first().isVisible()) {
      await searchInput.first().fill(TEST_MARKER);
      await page.waitForTimeout(2000);
    }
    await page.locator(`a:has-text("${PROPOSAL_TITLE}")`).first().click();
    await waitForPortalLoad(page);
    await page.locator('button:has-text("Financeiro")').click();
    await page.waitForTimeout(2000);
    await scrollMainToBottom(page);
    await expect(page.locator("text=/Onboarding/i").first()).toBeVisible({ timeout: 10_000 });
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      const cb = checkboxes.nth(i);
      await cb.scrollIntoViewIfNeeded();
      if (!(await cb.isChecked())) await cb.check();
    }
    const saveBtn = page.locator('button:has-text("Salvar")').first();
    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.click();
    await expectToast(page, /salvo|onboarding/i);
    await page.waitForTimeout(2000);
    const concludeBtn = page.locator('button:has-text("Concluir onboarding")');
    if (await concludeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await concludeBtn.scrollIntoViewIfNeeded();
      await concludeBtn.click();
      await expectToast(page, /onboarding|conclu/i);
    }
  });

  // ─── 12. DEVELOPER verifica projeto e tarefas ───
  test("12. [DEVELOPER] Verifica projeto, tarefas e docs", async ({ page }) => {
    test.skip(!DEVELOPER.email, "skip");
    await login(page, DEVELOPER.email, DEVELOPER.password);

    // Projetos — deve ver o projeto E2E
    await navigateAdmin(page, "projetos");
    await waitForPortalLoad(page);
    await assertNoCrash(page);
    const searchInput = page.locator(
      'input[placeholder*="buscar" i], input[placeholder*="Buscar"]'
    );
    if (await searchInput.first().isVisible()) {
      await searchInput.first().fill(TEST_MARKER);
      await page.waitForTimeout(2000);
    }
    await expect(page.locator(`text=${TEST_MARKER}`).first()).toBeVisible({ timeout: 15_000 });

    // Tarefas Dev
    await navigateAdmin(page, "tarefas/desenvolvimento");
    await waitForPortalLoad(page);
    await assertNoCrash(page);

    // Tarefas (todas)
    await navigateAdmin(page, "tarefas");
    await waitForPortalLoad(page);
    await assertNoCrash(page);

    // Documentos Dev
    await navigateAdmin(page, "documentos/desenvolvedor");
    await waitForPortalLoad(page);
    await assertNoCrash(page);
  });

  // ─── 13. DESIGNER verifica projeto e docs ───
  test("13. [DESIGNER] Verifica projeto e docs", async ({ page }) => {
    test.skip(!DESIGNER.email, "skip");
    await login(page, DESIGNER.email, DESIGNER.password);

    // Projetos
    await navigateAdmin(page, "projetos");
    await waitForPortalLoad(page);
    await assertNoCrash(page);

    // Documentos Dev
    await navigateAdmin(page, "documentos/desenvolvedor");
    await waitForPortalLoad(page);
    await assertNoCrash(page);

    // Tarefas Dev
    await navigateAdmin(page, "tarefas/desenvolvimento");
    await waitForPortalLoad(page);
    await assertNoCrash(page);
  });

  // ─── 14. PO validação + aceite ───
  test("14. [PO] Validação e aceite formal", async ({ page }) => {
    test.skip(!PO.email, "skip");
    await login(page, PO.email, PO.password);
    await navigateAdmin(page, "projetos");
    await waitForPortalLoad(page);
    const searchInput = page.locator(
      'input[placeholder*="buscar" i], input[placeholder*="Buscar"]'
    );
    if (await searchInput.first().isVisible()) {
      await searchInput.first().fill(TEST_MARKER);
      await page.waitForTimeout(2000);
    }
    await page.locator(`a:has-text("${PROPOSAL_TITLE}")`).first().click();
    await waitForPortalLoad(page);
    await page.locator('button:has-text("Financeiro")').click();
    await page.waitForTimeout(2000);
    await scrollMainToBottom(page);
    // Iniciar rodada
    const startBtn = page.locator('button:has-text("Iniciar rodada")');
    if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await startBtn.scrollIntoViewIfNeeded();
      await startBtn.click();
      await expectToast(page, /rodada|validação|iniciada/i);
      await page.waitForTimeout(2000);
    }
    // Validação interna
    const markInt = page.locator(
      'button:has-text("Marcar validação interna"), button:has-text("Validação interna")'
    );
    if (
      await markInt
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      await markInt.first().scrollIntoViewIfNeeded();
      await markInt.first().click();
      await page.waitForTimeout(2000);
    }
    // Validação cliente
    autoAcceptDialogs(page, "Cliente Teste E2E");
    const markCli = page.locator(
      'button:has-text("Marcar validação cliente"), button:has-text("Validação cliente")'
    );
    if (
      await markCli
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      await markCli.first().scrollIntoViewIfNeeded();
      await markCli.first().click();
      await page.waitForTimeout(2000);
    }
    // Aprovar rodada
    const appr = page.locator('button:has-text("Aprovar")').first();
    if (await appr.isVisible({ timeout: 5000 }).catch(() => false)) {
      await appr.scrollIntoViewIfNeeded();
      await appr.click();
      await page.waitForTimeout(3000);
    }
    // Aceite formal
    await scrollMainToBottom(page);
    const notes = page.locator('textarea[placeholder*="Ressalvas"]');
    if (await notes.isVisible({ timeout: 5000 }).catch(() => false)) {
      await notes.scrollIntoViewIfNeeded();
      await notes.fill(`${TEST_MARKER} - Entrega aceita`);
    }
    const acceptBtn = page.locator('button:has-text("Registrar aceite formal")');
    if (await acceptBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await acceptBtn.scrollIntoViewIfNeeded();
      await acceptBtn.click();
      await expectToast(page, /aceite|conclu|entrega|registrad/i);
    }
  });

  // ─── 15. FINANCEIRO verifica ───
  test("15. [FINANCEIRO] Verifica cobranças e régua", async ({ page }) => {
    test.skip(!FINANCEIRO.email, "skip");
    await login(page, FINANCEIRO.email, FINANCEIRO.password);
    await navigateAdmin(page, "financeiro");
    await waitForPortalLoad(page);
    await expect(page.locator("text=Receitas").first()).toBeVisible({ timeout: 10_000 });
    await assertNoCrash(page);

    // Projetos (financeiro tem acesso)
    await navigateAdmin(page, "projetos");
    await waitForPortalLoad(page);
    await assertNoCrash(page);

    // Régua de cobrança
    await navigateAdmin(page, "cobranca-automatica");
    await waitForPortalLoad(page);
    await assertNoCrash(page);

    // Clientes
    await navigateAdmin(page, "clientes");
    await waitForPortalLoad(page);
    await assertNoCrash(page);
  });

  // ─── 16. MARKETING verifica CRM e calendário ───
  test("16. [MARKETING] Verifica CRM e calendário", async ({ page }) => {
    test.skip(!MARKETING.email, "skip");
    await login(page, MARKETING.email, MARKETING.password);

    // CRM (marketing tem acesso leitura)
    await navigateAdmin(page, "crm");
    await waitForPortalLoad(page);
    await assertNoCrash(page);

    // Calendário editorial
    await navigateAdmin(page, "calendario");
    await waitForPortalLoad(page);
    await assertNoCrash(page);

    // Documentos M&D
    await navigateAdmin(page, "documentos/marketing-design");
    await waitForPortalLoad(page);
    await assertNoCrash(page);

    // Tarefas Marketing
    await navigateAdmin(page, "tarefas/marketing");
    await waitForPortalLoad(page);
    await assertNoCrash(page);
  });

  // ─── 17. SUPORTE verifica ───
  test("17. [SUPORTE] Verifica suporte e SLA", async ({ page }) => {
    test.skip(!SUPORTE.email, "skip");
    await login(page, SUPORTE.email, SUPORTE.password);
    await navigateAdmin(page, "suporte");
    await waitForPortalLoad(page);
    await assertNoCrash(page);

    // Projetos
    await navigateAdmin(page, "projetos");
    await waitForPortalLoad(page);
    await assertNoCrash(page);

    // Tarefas Suporte
    await navigateAdmin(page, "tarefas/suporte");
    await waitForPortalLoad(page);
    await assertNoCrash(page);
  });

  // ─── 18. Verificação banco ───
  test("18. [VERIFICAÇÃO] Notificações e timeline no banco", async () => {
    const events = await getTimelineEventsForProject(PROPOSAL_TITLE);
    expect(events.length).toBeGreaterThan(0);
    const proposal = await findProposalByTitle(PROPOSAL_TITLE);
    expect(proposal).toBeTruthy();
    expect(proposal!.status).toBe("aprovada");
    expect(proposal!.client_id).toBeTruthy();
  });

  // ─── 19. COMERCIAL pipeline ───
  test("19. [COMERCIAL] Pipeline mostra projeto concluído", async ({ page }) => {
    test.skip(!COMERCIAL.email, "skip");
    await login(page, COMERCIAL.email, COMERCIAL.password);
    await navigateAdmin(page, "crm");
    await waitForPortalLoad(page);
    await page.click('button:has-text("Pipeline")');
    await page.waitForTimeout(3000);
    await expect(page.locator("text=Concluido").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(`text=${TEST_MARKER}`).first()).toBeVisible({ timeout: 10_000 });
    await assertNoCrash(page);
  });

  // ─── 20. CLIENTE vê projeto concluído ───
  test("20. [CLIENTE] Visualiza projeto concluído no portal", async ({ page }) => {
    expect(clientEmail).toBeTruthy();
    await login(page, clientEmail, CLIENT_PASSWORD);
    await navigateClient(page, "projetos");
    await waitForPortalLoad(page);
    await assertNoCrash(page);

    // Financeiro do cliente
    await navigateClient(page, "financeiro");
    await waitForPortalLoad(page);
    await assertNoCrash(page);

    // Suporte do cliente
    await navigateClient(page, "suporte");
    await waitForPortalLoad(page);
    await assertNoCrash(page);
  });
});

// ═══════════════════════════════════════════════════════════════
// ADMIN — 18 páginas
// ═══════════════════════════════════════════════════════════════

test.describe("Admin — todas as páginas", () => {
  test("Admin acessa 18 páginas sem crash e sem erros de console", async ({ page }) => {
    test.setTimeout(120_000); // 18 páginas precisa mais tempo
    test.skip(!ADMIN.email, "skip");
    const errors = captureConsoleErrors(page);
    await login(page, ADMIN.email, ADMIN.password);
    for (const path of [
      "",
      "crm",
      "clientes",
      "contratos",
      "projetos",
      "financeiro",
      "cobranca-automatica",
      "suporte",
      "tarefas",
      "tarefas/comercial",
      "tarefas/financeiro",
      "tarefas/juridico",
      "tarefas/desenvolvimento",
      "tarefas/suporte",
      "tarefas/marketing",
      "calendario",
      "equipe",
      "audit-log",
    ]) {
      await navigateAdmin(page, path);
      await waitForPortalLoad(page);
      await assertNoCrash(page);
    }
    assertNoConsoleErrors(errors, "Admin 18 páginas");
  });
});
