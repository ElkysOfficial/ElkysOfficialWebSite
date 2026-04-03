import type { AppRole } from "@/contexts/AuthContext";

export function getDefaultAdminRoute(roles: AppRole[]) {
  if (roles.includes("admin_super") || roles.includes("admin")) {
    return "/portal/admin";
  }

  if (roles.includes("marketing")) {
    return "/portal/admin/calendario";
  }

  if (roles.includes("developer")) {
    return "/portal/admin/documentos/desenvolvedor";
  }

  if (roles.includes("support")) {
    return "/portal/admin/suporte";
  }

  return "/portal/admin";
}
