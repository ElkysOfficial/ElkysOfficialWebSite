import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") }); // Supabase URLs
dotenv.config({ path: path.resolve(__dirname, "e2e", ".env") }); // Credenciais E2E

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  // Testes dependem de timing entre escrita no Supabase e aparicao na UI
  // (fluxo serial onde teste N-1 cria dado que teste N consome). Em rede
  // real contra producao, isso varia. 2 retries absorvem flakiness sem
  // esconder regressao real (bug deterministico falha nas 3 tentativas).
  retries: 2,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: "https://elkys.com.br",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
