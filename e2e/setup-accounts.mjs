/**
 * Script para criar contas de teste E2E via Supabase Admin API.
 * Usa a mesma edge function `create-user` que o TeamCreate.tsx.
 *
 * Execução: node e2e/setup-accounts.mjs
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Carregar .env principal (URLs do Supabase) e e2e/.env (credenciais)
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });
dotenv.config({ path: path.resolve(__dirname, ".env") });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Primeiro faz login como admin para ter o token de auth
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "lucelho.silva@elkys.com.br";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  console.error("Missing ADMIN_PASSWORD in .env");
  process.exit(1);
}

const TEST_PASSWORD = "E2eTest@2026";

const ACCOUNTS = [
  { email: "e2e-comercial@elkys.com.br", name: "E2E Comercial", role: "comercial", roleLabel: "Comercial" },
  { email: "e2e-juridico@elkys.com.br", name: "E2E Jurídico", role: "juridico", roleLabel: "Jurídico" },
  { email: "e2e-financeiro@elkys.com.br", name: "E2E Financeiro", role: "financeiro", roleLabel: "Financeiro" },
  { email: "e2e-po@elkys.com.br", name: "E2E Product Owner", role: "po", roleLabel: "Desenvolvimento — PO" },
  { email: "e2e-developer@elkys.com.br", name: "E2E Developer", role: "developer", roleLabel: "Desenvolvimento — Developer" },
  { email: "e2e-designer@elkys.com.br", name: "E2E Designer", role: "designer", roleLabel: "Desenvolvimento — Designer" },
  { email: "e2e-marketing@elkys.com.br", name: "E2E Marketing", role: "marketing", roleLabel: "Marketing" },
  { email: "e2e-suporte@elkys.com.br", name: "E2E Suporte", role: "support", roleLabel: "Suporte" },
];

async function main() {
  console.log("🔐 Fazendo login como admin...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (authError) {
    console.error("❌ Login admin falhou:", authError.message);
    process.exit(1);
  }
  console.log("✅ Login admin OK");

  const authHeaders = {
    Authorization: `Bearer ${authData.session.access_token}`,
  };

  for (const account of ACCOUNTS) {
    console.log(`\n📝 Criando ${account.name} (${account.email})...`);

    // 1. Criar auth user via edge function
    const { data: createData, error: createError } = await supabase.functions.invoke("create-user", {
      body: { email: account.email, password: TEST_PASSWORD, full_name: account.name },
      headers: authHeaders,
    });

    if (createError) {
      console.log(`⚠️  create-user error: ${createError.message} — pode já existir`);
      continue;
    }
    if (createData?.error) {
      if (String(createData.error).includes("already registered")) {
        console.log(`ℹ️  ${account.email} já existe, pulando...`);
        continue;
      }
      console.error(`❌ create-user error: ${createData.error}`);
      continue;
    }

    const userId = createData.user_id;
    console.log(`   ✅ Auth user criado: ${userId}`);

    // 2. Insert team member
    const { error: memberError } = await supabase.from("team_members").insert({
      user_id: userId,
      full_name: account.name,
      email: account.email,
      role_title: account.roleLabel,
      system_role: account.role,
      is_active: true,
      must_change_password: false,
    });
    if (memberError) {
      console.log(`   ⚠️  team_members: ${memberError.message}`);
    } else {
      console.log("   ✅ team_members OK");
    }

    // 3. Assign role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: account.role });
    if (roleError) {
      console.log(`   ⚠️  user_roles: ${roleError.message}`);
    } else {
      console.log("   ✅ user_roles OK");
    }
  }

  console.log("\n🎉 Setup de contas concluído!");
  await supabase.auth.signOut();
}

main().catch(console.error);
