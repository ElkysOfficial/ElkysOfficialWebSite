/**
 * Roteamento por role — determina a rota padrao de cada persona ao logar.
 *
 * @module portal-access
 */

import type { AppRole } from "@/contexts/AuthContext";

/** Retorna a rota inicial do admin portal baseado nos roles do usuario. */
export function getDefaultAdminRoute(roles: AppRole[]) {
  if (roles.includes("admin_super") || roles.includes("admin")) {
    return "/portal/admin";
  }

  if (roles.includes("juridico")) {
    return "/portal/admin/contratos";
  }

  if (roles.includes("comercial")) {
    return "/portal/admin/crm";
  }

  if (roles.includes("financeiro")) {
    return "/portal/admin/financeiro";
  }

  if (roles.includes("marketing")) {
    return "/portal/admin/calendario";
  }

  if (roles.includes("developer") || roles.includes("designer") || roles.includes("po")) {
    return "/portal/admin/projetos";
  }

  if (roles.includes("support")) {
    return "/portal/admin/suporte";
  }

  return "/portal/admin";
}
