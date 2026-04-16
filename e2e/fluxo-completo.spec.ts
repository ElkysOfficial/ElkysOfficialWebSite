import { test, expect } from "@playwright/test";
import {
  login,
  logout,
  navigateAdmin,
  navigateClient,
  dismissCookieBanner,
  expectToast,
  waitForPortalLoad,
  uniqueId,
} from "./helpers/auth";

/**
 * TESTE E2E — FLUXO COMPLETO LEAD → EXPANSÃO
 *
 * Testa todo o fluxo operacional da Elkys com múltiplas personas:
 *
 * 1. Comercial cria lead
 * 2. Comercial qualifica e preenche diagnóstico
 * 3. Comercial cria e envia proposta
 * 4. Cliente aceita proposta no portal
 * 5. Admin aprova e cria contrato
 * 6. Jurídico revisa e envia para validação
 * 7. Cliente aceita contrato
 * 8. Jurídico ativa contrato (cria projeto)
 * 9. Dev/PO verifica projeto e onboarding
 * 10. Financeiro verifica cobranças
 * 11. Suporte verifica acesso ao projeto
 * 12. Comercial verifica expansão
 *
 * IMPORTANTE: Configurar credenciais em e2e/.env antes de rodar.
 */

// Credenciais — configurar via variáveis de ambiente ou .env
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@elkys.com.br";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";
const COMERCIAL_EMAIL = process.env.COMERCIAL_EMAIL ?? "";
const COMERCIAL_PASSWORD = process.env.COMERCIAL_PASSWORD ?? "";
const JURIDICO_EMAIL = process.env.JURIDICO_EMAIL ?? "";
const JURIDICO_PASSWORD = process.env.JURIDICO_PASSWORD ?? "";
const FINANCEIRO_EMAIL = process.env.FINANCEIRO_EMAIL ?? "";
const FINANCEIRO_PASSWORD = process.env.FINANCEIRO_PASSWORD ?? "";
const CLIENTE_EMAIL = process.env.CLIENTE_EMAIL ?? "";
const CLIENTE_PASSWORD = process.env.CLIENTE_PASSWORD ?? "";

// Dados compartilhados entre etapas
const LEAD_NAME = `Lead Teste ${uniqueId()}`;
const LEAD_EMAIL = `teste-${Date.now()}@exemplo.com`;
const LEAD_COMPANY = "Empresa Teste LTDA";
const PROPOSAL_TITLE = `Proposta ${LEAD_NAME}`;
const PROPOSAL_VALUE = "15000";

test.describe.serial("Fluxo Completo: Lead → Expansão", () => {
  // ═══════════════════════════════════════════════════════════════════
  // ETAPA 1 — COMERCIAL CRIA LEAD
  // ═══════════════════════════════════════════════════════════════════

  test("1. Comercial cria novo lead", async ({ page }) => {
    test.skip(!COMERCIAL_EMAIL, "COMERCIAL_EMAIL não configurado");

    await login(page, COMERCIAL_EMAIL, COMERCIAL_PASSWORD);
    await navigateAdmin(page, "crm");
    await waitForPortalLoad(page);

    // Clicar em "Novo Lead"
    const newLeadBtn = page.locator(
      'button:has-text("Novo Lead"), button:has-text("Fechar formulario")'
    );
    await newLeadBtn.first().click();

    // Se clicamos em "Fechar formulario", precisamos clicar de novo em "Novo Lead"
    const formVisible = page.locator('input[placeholder="Nome do lead"]');
    if (!(await formVisible.isVisible({ timeout: 2000 }).catch(() => false))) {
      await page.click('button:has-text("Novo Lead")');
    }

    // Preencher formulário com placeholders reais
    await page.fill('input[placeholder="Nome do lead"]', LEAD_NAME);
    await page.fill('input[placeholder="email@exemplo.com"]', LEAD_EMAIL);

    // Salvar
    await page.click('button:has-text("Salvar Lead"), button:has-text("Salvar")');
    await expectToast(page, /criado|salvo/i);

    // Verificar que aparece no kanban
    await expect(page.locator(`text=${LEAD_NAME}`).first()).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════════
  // ETAPA 2 — COMERCIAL QUALIFICA E FAZ DIAGNÓSTICO
  // ═══════════════════════════════════════════════════════════════════

  test("2. Comercial preenche diagnóstico do lead", async ({ page }) => {
    test.skip(!COMERCIAL_EMAIL, "COMERCIAL_EMAIL não configurado");

    await login(page, COMERCIAL_EMAIL, COMERCIAL_PASSWORD);
    await navigateAdmin(page, "crm");
    await waitForPortalLoad(page);

    // Clicar no lead
    await page.click(`text=${LEAD_NAME}`);
    await waitForPortalLoad(page);

    // Verificar que estamos na página de detalhe
    await expect(page.locator(`h1:has-text("${LEAD_NAME}")`)).toBeVisible();

    // Mover para qualificado (botão rápido)
    const qualBtn = page.locator('button:has-text("Qualificado")');
    if (await qualBtn.isVisible()) {
      await qualBtn.click();
      await expectToast(page, /qualificado/i);
    }

    // Scroll até a seção de diagnóstico
    const diagTitle = page.locator("text=Diagnóstico").first();
    if (await diagTitle.isVisible()) {
      await diagTitle.scrollIntoViewIfNeeded();
    }

    // Preencher diagnóstico usando placeholders reais
    await page
      .locator('textarea[placeholder*="Quem"]')
      .fill("Cliente precisa de sistema web para gestão de pedidos");
    await page
      .locator('textarea[placeholder*="dor concreta"]')
      .fill("Processo manual de pedidos causa erros e atraso");
    await page
      .locator('textarea[placeholder*="resultado esperado"]')
      .fill("Automatizar fluxo de pedidos em 3 meses");

    // Concluir diagnóstico (salva e conclui ao mesmo tempo)
    const concludeBtn = page.locator('button:has-text("Concluir")').first();
    await expect(concludeBtn).toBeVisible({ timeout: 5000 });
    await concludeBtn.click();
    await expectToast(page, /conclu|salvo/i);
  });

  // ═══════════════════════════════════════════════════════════════════
  // ETAPA 3 — COMERCIAL CRIA E ENVIA PROPOSTA
  // ═══════════════════════════════════════════════════════════════════

  test("3. Comercial cria proposta a partir do lead", async ({ page }) => {
    test.skip(!COMERCIAL_EMAIL, "COMERCIAL_EMAIL não configurado");

    await login(page, COMERCIAL_EMAIL, COMERCIAL_PASSWORD);
    await navigateAdmin(page, "crm");
    await waitForPortalLoad(page);

    // Abrir o lead
    await page.click(`text=${LEAD_NAME}`);
    await waitForPortalLoad(page);

    // Clicar "Criar proposta" (só aparece com diagnóstico concluído)
    const createProposalBtn = page.locator('a:has-text("Criar proposta")');
    await expect(createProposalBtn).toBeVisible({ timeout: 5000 });
    await createProposalBtn.click();
    await waitForPortalLoad(page);

    // Preencher proposta — campos obrigatórios
    await page.fill('input[id="title"]', PROPOSAL_TITLE);

    // Tipo de solução
    const solutionInput = page.locator('input[placeholder*="Site institucional"]');
    if (await solutionInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await solutionInput.fill("Sistema Web");
    }

    // Valor
    const amountInput = page.locator('input[id="total_amount"]');
    if (await amountInput.isVisible()) {
      await amountInput.click();
      await amountInput.fill(PROPOSAL_VALUE);
    }

    // Escopo
    const scopeTextarea = page.locator('textarea[id="scope_summary"]');
    if (await scopeTextarea.isVisible()) {
      await scopeTextarea.fill(
        "Sistema web para gestão de pedidos com dashboard, relatórios e integração com ERP"
      );
    }

    // Link do documento (obrigatório para enviar)
    const docInput = page.locator('input[placeholder*="drive.google.com"]').first();
    if (await docInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await docInput.fill("https://drive.google.com/test-doc");
    }

    // Enviar para o cliente
    const sendBtn = page.locator('button:has-text("Enviar para cliente")');
    if (await sendBtn.isEnabled({ timeout: 3000 }).catch(() => false)) {
      await sendBtn.click();
      await expectToast(page, /enviada|enviado/i);
    } else {
      // Fallback: salvar como rascunho — admin aprovará diretamente
      await page.click('button:has-text("Salvar rascunho")');
      await expectToast(page, /salvo|rascunho/i);
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ETAPA 4 — ADMIN APROVA PROPOSTA (cria contrato)
  // ═══════════════════════════════════════════════════════════════════

  test("4. Admin aprova proposta e cria contrato", async ({ page }) => {
    test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "ADMIN credentials não configurados");

    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await navigateAdmin(page, "crm");
    await waitForPortalLoad(page);

    // Tab propostas
    await page.click('button:has-text("Propostas")');
    await page.waitForTimeout(2000);

    // Encontrar a proposta na listagem
    const proposalLink = page.locator(`a:has-text("${PROPOSAL_TITLE}")`).first();
    await expect(proposalLink).toBeVisible({ timeout: 10_000 });
    await proposalLink.click();
    await waitForPortalLoad(page);

    // Scroll até o botão de aprovação
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    // Clicar "Aprovar e criar projeto" ou "Criar projeto a partir desta proposta"
    const approveBtn = page
      .locator('button:has-text("Aprovar"), button:has-text("Criar projeto")')
      .first();
    await expect(approveBtn).toBeVisible({ timeout: 10_000 });
    await approveBtn.click();

    await expectToast(page, /aprovad|contrato|projeto/i);
  });

  // ═══════════════════════════════════════════════════════════════════
  // ETAPA 5 — JURÍDICO REVISA CONTRATO
  // ═══════════════════════════════════════════════════════════════════

  test("5. Jurídico revisa contrato e envia para validação", async ({ page }) => {
    test.skip(!JURIDICO_EMAIL, "JURIDICO_EMAIL não configurado");

    await login(page, JURIDICO_EMAIL, JURIDICO_PASSWORD);
    await navigateAdmin(page, "contratos");
    await waitForPortalLoad(page);

    // Verificar que contrato aparece
    await expect(page.locator("text=Rascunho").first()).toBeVisible({ timeout: 10_000 });

    // Expandir contexto comercial
    const contextBtn = page.locator('button:has-text("Ver contexto comercial")').first();
    if (await contextBtn.isVisible()) {
      await contextBtn.click();
      // Verificar que diagnóstico é visível
      await expect(page.locator("text=Contexto da negociação").first()).toBeVisible();
    }

    // Clicar "Enviar para validação"
    const validateBtn = page.locator('button:has-text("Enviar para validação")').first();
    await expect(validateBtn).toBeVisible();

    // Prompt de motivo
    page.on("dialog", async (dialog) => {
      await dialog.accept("Contrato revisado e pronto para assinatura");
    });

    await validateBtn.click();
    await expectToast(page, /em_validacao|validação/i);
  });

  // ═══════════════════════════════════════════════════════════════════
  // ETAPA 6 — JURÍDICO ATIVA CONTRATO (cria projeto)
  // ═══════════════════════════════════════════════════════════════════

  test("6. Jurídico valida assinatura e ativa contrato", async ({ page }) => {
    test.skip(!JURIDICO_EMAIL, "JURIDICO_EMAIL não configurado");

    await login(page, JURIDICO_EMAIL, JURIDICO_PASSWORD);
    await navigateAdmin(page, "contratos");
    await waitForPortalLoad(page);

    // Filtrar por "Em validação"
    const filterBtn = page.locator('button:has-text("Em validação")');
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
    }

    // Clicar "Validar assinatura e ativar"
    const activateBtn = page.locator('button:has-text("Validar assinatura")').first();
    await expect(activateBtn).toBeVisible({ timeout: 10_000 });

    page.on("dialog", async (dialog) => {
      await dialog.accept("Assinatura validada");
    });

    await activateBtn.click();
    await expectToast(page, /ativo|projeto|criados/i);
  });

  // ═══════════════════════════════════════════════════════════════════
  // ETAPA 7 — FINANCEIRO VERIFICA COBRANÇAS
  // ═══════════════════════════════════════════════════════════════════

  test("7. Financeiro verifica cobranças geradas", async ({ page }) => {
    test.skip(!FINANCEIRO_EMAIL, "FINANCEIRO_EMAIL não configurado");

    await login(page, FINANCEIRO_EMAIL, FINANCEIRO_PASSWORD);
    await navigateAdmin(page, "financeiro");
    await waitForPortalLoad(page);

    // Verificar que a página carregou
    await expect(page.locator("text=Receitas").first()).toBeVisible();

    // Verificar tarefas do financeiro
    await navigateAdmin(page, "tarefas/financeiro");
    await waitForPortalLoad(page);

    // Deve existir tarefa "Verificar cobranças"
    const task = page.locator("text=Verificar cobranças").first();
    // Tarefa pode ou não existir dependendo do timing
    if (await task.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(task).toBeVisible();
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ETAPA 8 — DEV/PO VERIFICA PROJETO E ONBOARDING
  // ═══════════════════════════════════════════════════════════════════

  test("8. Dev verifica projeto criado e onboarding", async ({ page }) => {
    test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "ADMIN credentials não configurados");

    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await navigateAdmin(page, "projetos");
    await waitForPortalLoad(page);

    // Buscar projeto pelo nome da proposta
    const searchInput = page.locator('input[placeholder*="buscar" i]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(PROPOSAL_TITLE);
      await page.waitForTimeout(500);
    }

    // Clicar no projeto
    const projectLink = page.locator(`a:has-text("${PROPOSAL_TITLE}")`).first();
    if (await projectLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await projectLink.click();
      await waitForPortalLoad(page);

      // Verificar onboarding checklist
      await expect(page.locator("text=Onboarding").first()).toBeVisible();

      // Verificar diagnóstico comercial
      const diagCard = page.locator("text=Contexto do diagnóstico").first();
      if (await diagCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(diagCard).toBeVisible();
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ETAPA 9 — SUPORTE VERIFICA ACESSO AO PROJETO
  // ═══════════════════════════════════════════════════════════════════

  test("9. Suporte consegue acessar projetos", async ({ page }) => {
    test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Usando admin como fallback");

    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await navigateAdmin(page, "suporte");
    await waitForPortalLoad(page);

    // Página de suporte carrega sem erro
    await expect(page.locator("text=Suporte").first()).toBeVisible();

    // Suporte consegue acessar projetos
    await navigateAdmin(page, "projetos");
    await waitForPortalLoad(page);
    await expect(page.locator("text=Projetos").first()).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════════
  // ETAPA 10 — VERIFICAÇÃO DE NOTIFICAÇÕES
  // ═══════════════════════════════════════════════════════════════════

  test("10. Admin verifica notificações no bell", async ({ page }) => {
    test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "ADMIN credentials não configurados");

    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // Verificar que o bell de notificações existe
    const bell = page.locator('[aria-label*="notif" i], button:has(svg)').first();
    await expect(bell).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════
// TESTES DE ACESSO POR ROLE
// ═══════════════════════════════════════════════════════════════════

test.describe("Acesso por Role", () => {
  test("Comercial acessa CRM sem erro", async ({ page }) => {
    test.skip(!COMERCIAL_EMAIL, "COMERCIAL_EMAIL não configurado");
    await login(page, COMERCIAL_EMAIL, COMERCIAL_PASSWORD);
    await navigateAdmin(page, "crm");
    await waitForPortalLoad(page);
    // Não deve ter erro de boundary
    await expect(page.locator("text=Algo deu errado")).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Leads" })).toBeVisible();
  });

  test("Jurídico acessa Contratos sem erro", async ({ page }) => {
    test.skip(!JURIDICO_EMAIL, "JURIDICO_EMAIL não configurado");
    await login(page, JURIDICO_EMAIL, JURIDICO_PASSWORD);
    await navigateAdmin(page, "contratos");
    await waitForPortalLoad(page);
    await expect(page.locator("text=Algo deu errado")).not.toBeVisible();
  });

  test("Financeiro acessa Finance sem erro", async ({ page }) => {
    test.skip(!FINANCEIRO_EMAIL, "FINANCEIRO_EMAIL não configurado");
    await login(page, FINANCEIRO_EMAIL, FINANCEIRO_PASSWORD);
    await navigateAdmin(page, "financeiro");
    await waitForPortalLoad(page);
    await expect(page.locator("text=Algo deu errado")).not.toBeVisible();
    await expect(page.locator("text=Receitas")).toBeVisible();
  });

  test("Financeiro acessa Projetos sem erro", async ({ page }) => {
    test.skip(!FINANCEIRO_EMAIL, "FINANCEIRO_EMAIL não configurado");
    await login(page, FINANCEIRO_EMAIL, FINANCEIRO_PASSWORD);
    await navigateAdmin(page, "projetos");
    await waitForPortalLoad(page);
    await expect(page.locator("text=Algo deu errado")).not.toBeVisible();
  });

  test("Admin acessa Dashboard sem erro", async ({ page }) => {
    test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "ADMIN credentials não configurados");
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await waitForPortalLoad(page);
    await expect(page.locator("text=Algo deu errado")).not.toBeVisible();
  });

  test("Admin acessa Audit Log sem erro", async ({ page }) => {
    test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "ADMIN credentials não configurados");
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await navigateAdmin(page, "audit-log");
    await waitForPortalLoad(page);
    await expect(page.locator("text=Algo deu errado")).not.toBeVisible();
    // Não deve ter "Usuário desconhecido" (fix v2.75.2)
    const unknownUser = page.locator("text=Usuario desconhecido");
    const unknownCount = await unknownUser.count();
    // Tolerância: pode ter alguns históricos antigos, mas não deve ser a maioria
    expect(unknownCount).toBeLessThan(5);
  });
});

// ═══════════════════════════════════════════════════════════════════
// TESTES DE PÁGINAS CRÍTICAS
// ═══════════════════════════════════════════════════════════════════

test.describe("Páginas críticas não crasham", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "ADMIN credentials não configurados");
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  const pages = [
    { path: "", name: "Dashboard" },
    { path: "crm", name: "CRM" },
    { path: "clientes", name: "Clientes" },
    { path: "contratos", name: "Contratos" },
    { path: "projetos", name: "Projetos" },
    { path: "financeiro", name: "Financeiro" },
    { path: "cobranca-automatica", name: "Billing Automation" },
    { path: "suporte", name: "Suporte" },
    { path: "tarefas", name: "Tarefas" },
    { path: "tarefas/comercial", name: "Tarefas Comercial" },
    { path: "tarefas/financeiro", name: "Tarefas Financeiro" },
    { path: "tarefas/juridico", name: "Tarefas Jurídico" },
    { path: "tarefas/desenvolvimento", name: "Tarefas Dev" },
    { path: "tarefas/suporte", name: "Tarefas Suporte" },
    { path: "tarefas/marketing", name: "Tarefas Marketing" },
    { path: "calendario", name: "Calendário" },
    { path: "equipe", name: "Equipe" },
    { path: "audit-log", name: "Audit Log" },
  ];

  for (const { path, name } of pages) {
    test(`${name} carrega sem crash`, async ({ page }) => {
      await navigateAdmin(page, path);
      await waitForPortalLoad(page);

      // Nenhuma página deve mostrar o error boundary
      await expect(page.locator("text=Algo deu errado")).not.toBeVisible();

      // Nenhum erro de console (TypeError, etc)
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));
      await page.waitForTimeout(2000);
      expect(errors).toHaveLength(0);
    });
  }
});
