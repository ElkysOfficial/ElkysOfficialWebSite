/**
 * Paths dos logos de clientes exibidos no carrossel da landing.
 * Mantido como modulo TS (em vez de fetch em /imgs/logo/logos.json)
 * pra eliminar 1 request + re-render apos o JSON carregar.
 * Atualizado via scripts/update-logos.cjs.
 */
export const clientLogos: readonly string[] = [
  "/imgs/logo/1umprintcomunicacao.svg",
  "/imgs/logo/AKProducoes.svg",
  "/imgs/logo/Antônio Oliveira Advogados.webp",
  "/imgs/logo/God of Baber.webp",
  "/imgs/logo/Hapvida.webp",
  "/imgs/logo/Logo Inline White.webp",
  "/imgs/logo/dps-celulares.webp",
  "/imgs/logo/plansCoop.webp",
];
