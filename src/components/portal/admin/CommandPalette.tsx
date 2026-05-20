import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { cn } from "@/design-system";
import {
  AgileMono,
  BarChart,
  Banknote,
  Building2,
  CheckCircle,
  FileText,
  Mail,
  Search,
  Shield,
  Target,
  Users,
  X,
  Zap,
} from "@/assets/icons";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/contexts/AuthContext";

type ResultKind = "action" | "client" | "project" | "lead" | "proposal";

type CommandResult = {
  id: string;
  kind: ResultKind;
  label: string;
  secondary?: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  /** Required roles to see this result (subset semantics — any role suffices). */
  roles?: AppRole[];
};

const KIND_LABEL: Record<ResultKind, string> = {
  action: "Ações rápidas",
  client: "Clientes",
  project: "Projetos",
  lead: "Leads",
  proposal: "Propostas",
};

const KIND_ORDER: ResultKind[] = ["action", "client", "project", "lead", "proposal"];

const QUICK_ACTIONS: CommandResult[] = [
  {
    id: "act-novo-cliente",
    kind: "action",
    label: "Novo cliente",
    secondary: "Cadastrar empresa ou pessoa física",
    href: "/portal/admin/clientes/novo",
    icon: Building2,
    roles: ["admin_super", "admin"],
  },
  {
    id: "act-nova-proposta",
    kind: "action",
    label: "Nova proposta",
    secondary: "Iniciar proposta comercial",
    href: "/portal/admin/propostas/nova",
    icon: Target,
    roles: ["admin_super", "admin", "comercial"],
  },
  {
    id: "act-novo-projeto",
    kind: "action",
    label: "Novo projeto",
    secondary: "Abrir projeto operacional",
    href: "/portal/admin/projetos/novo",
    icon: AgileMono,
    roles: ["admin_super", "admin"],
  },
  {
    id: "act-nova-despesa",
    kind: "action",
    label: "Nova despesa",
    secondary: "Lançamento financeiro",
    href: "/portal/admin/financeiro/nova-despesa",
    icon: Banknote,
    roles: ["admin_super", "admin", "financeiro"],
  },
  {
    id: "act-ir-financeiro",
    kind: "action",
    label: "Ir para Financeiro",
    href: "/portal/admin/financeiro",
    icon: Banknote,
    roles: ["admin_super", "admin", "financeiro"],
  },
  {
    id: "act-ir-cobranca",
    kind: "action",
    label: "Régua de cobrança",
    href: "/portal/admin/cobranca-automatica",
    icon: Zap,
    roles: ["admin_super", "admin", "financeiro"],
  },
  {
    id: "act-ir-contratos",
    kind: "action",
    label: "Contratos em validação",
    href: "/portal/admin/contratos?status=em_validacao",
    icon: FileText,
    roles: ["admin_super", "admin", "juridico"],
  },
  {
    id: "act-ir-equipe",
    kind: "action",
    label: "Equipe",
    href: "/portal/admin/equipe",
    icon: Users,
    roles: ["admin_super", "admin"],
  },
  {
    id: "act-ir-comunicacoes",
    kind: "action",
    label: "Comunicações",
    href: "/portal/admin/comunicacoes",
    icon: Mail,
    roles: ["admin_super", "admin", "comercial", "financeiro"],
  },
  {
    id: "act-ir-auditoria",
    kind: "action",
    label: "Log de auditoria",
    href: "/portal/admin/audit-log",
    icon: Shield,
    roles: ["admin_super", "admin"],
  },
  {
    id: "act-ir-tarefas",
    kind: "action",
    label: "Tarefas",
    href: "/portal/admin/tarefas",
    icon: CheckCircle,
    roles: ["admin_super", "admin"],
  },
  {
    id: "act-ir-overview",
    kind: "action",
    label: "Visão Geral",
    href: "/portal/admin",
    icon: BarChart,
    roles: ["admin_super", "admin"],
  },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CommandResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Filtra acoes rapidas por role — same gating model da sidebar.
  const visibleActions = useMemo(
    () =>
      QUICK_ACTIONS.filter(
        (action) => !action.roles || action.roles.some((r) => roles.includes(r))
      ),
    [roles]
  );

  // Reset ao abrir/fechar pra nao guardar query velha entre invocacoes.
  useEffect(() => {
    if (open) {
      setQuery("");
      setDebouncedQuery("");
      setSearchResults([]);
      setActiveIndex(0);
      const t = window.setTimeout(() => inputRef.current?.focus(), 30);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  // Lock body scroll enquanto aberto.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Debounce 180ms — equilibrio entre responsividade e nao bombardear o
  // Supabase a cada tecla.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setDebouncedQuery("");
      return;
    }
    const t = window.setTimeout(() => setDebouncedQuery(trimmed), 180);
    return () => window.clearTimeout(t);
  }, [query]);

  // Busca cross-entidade. RLS no Supabase filtra automaticamente o que o
  // role atual pode ver — nao precisamos gating extra aqui.
  useEffect(() => {
    if (!debouncedQuery || !open) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const term = `%${debouncedQuery}%`;

    const tasks: Promise<CommandResult[]>[] = [];

    // Clientes — fantasia tem prioridade no label, full_name como fallback.
    tasks.push(
      supabase
        .from("clients")
        .select("id, full_name, nome_fantasia, is_active")
        .or(`full_name.ilike.${term},nome_fantasia.ilike.${term}`)
        .limit(5)
        .then(({ data }) =>
          (data ?? []).map<CommandResult>((c) => ({
            id: `cli-${c.id}`,
            kind: "client",
            label: c.nome_fantasia?.trim() || c.full_name || "Cliente sem nome",
            secondary: c.is_active === false ? "Inativo" : undefined,
            href: `/portal/admin/clientes/${c.id}`,
            icon: Building2,
          }))
        )
    );

    // Projetos.
    tasks.push(
      supabase
        .from("projects")
        .select("id, name, status")
        .ilike("name", term)
        .limit(5)
        .then(({ data }) =>
          (data ?? []).map<CommandResult>((p) => ({
            id: `prj-${p.id}`,
            kind: "project",
            label: p.name,
            secondary: p.status,
            href: `/portal/admin/projetos/${p.id}`,
            icon: AgileMono,
          }))
        )
    );

    // Leads — buscamos nome OU empresa.
    tasks.push(
      supabase
        .from("leads")
        .select("id, name, company, status")
        .or(`name.ilike.${term},company.ilike.${term}`)
        .limit(5)
        .then(({ data }) =>
          (data ?? []).map<CommandResult>((l) => ({
            id: `lead-${l.id}`,
            kind: "lead",
            label: l.name,
            secondary: l.company ?? l.status,
            href: `/portal/admin/leads/${l.id}`,
            icon: Target,
          }))
        )
    );

    // Propostas — title e o campo humanamente identificavel.
    tasks.push(
      supabase
        .from("proposals")
        .select("id, title, status")
        .ilike("title", term)
        .limit(5)
        .then(({ data }) =>
          (data ?? []).map<CommandResult>((p) => ({
            id: `prop-${p.id}`,
            kind: "proposal",
            label: p.title,
            secondary: p.status,
            href: `/portal/admin/propostas/${p.id}`,
            icon: FileText,
          }))
        )
    );

    Promise.all(tasks)
      .then((groups) => {
        if (cancelled) return;
        setSearchResults(groups.flat());
        setActiveIndex(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, open]);

  // Lista renderizada — quando ha query, mostra busca; senao mostra acoes.
  const renderableResults = useMemo<CommandResult[]>(() => {
    if (debouncedQuery) return searchResults;
    // Sem query, filtra acoes por subsequencia simples (case-insensitive)
    // se usuario digitou 1 char — caso contrario lista completa.
    const q = query.trim().toLowerCase();
    if (!q) return visibleActions;
    return visibleActions.filter(
      (a) => a.label.toLowerCase().includes(q) || a.secondary?.toLowerCase().includes(q)
    );
  }, [debouncedQuery, searchResults, query, visibleActions]);

  // Agrupa preservando ordem definida.
  const grouped = useMemo(() => {
    const map = new Map<ResultKind, CommandResult[]>();
    for (const kind of KIND_ORDER) map.set(kind, []);
    for (const r of renderableResults) map.get(r.kind)?.push(r);
    return KIND_ORDER.filter((k) => (map.get(k)?.length ?? 0) > 0).map((k) => ({
      kind: k,
      items: map.get(k)!,
    }));
  }, [renderableResults]);

  const flatList = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  // Garante que o active sempre exista, mesmo apos a lista encolher.
  useEffect(() => {
    if (activeIndex >= flatList.length) {
      setActiveIndex(Math.max(0, flatList.length - 1));
    }
  }, [activeIndex, flatList.length]);

  const handleSelect = useCallback(
    (result: CommandResult) => {
      navigate(result.href);
      onClose();
    },
    [navigate, onClose]
  );

  // Keyboard nav — captura no contexto do modal aberto.
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(flatList.length - 1, i + 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (e.key === "Enter") {
        const item = flatList[activeIndex];
        if (item) {
          e.preventDefault();
          handleSelect(item);
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, flatList, activeIndex, handleSelect, onClose]);

  // Scroll do item ativo pra dentro do viewport.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-cmd-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  if (!open) return null;

  let runningIndex = -1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-secondary-dark/45 backdrop-blur-sm px-3 py-6 sm:py-[10vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Busca rápida"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border/75 bg-card shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border/75 px-4 py-3">
          <Search size={18} className="shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar clientes, projetos, leads, propostas ou ações..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="hidden shrink-0 rounded border border-border/75 bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground sm:inline-flex">
            Esc
          </kbd>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar busca"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground sm:hidden"
          >
            <X size={16} />
          </button>
        </div>

        <div ref={listRef} className="max-h-[60vh] overflow-y-auto sidebar-scroll">
          {loading && grouped.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">Buscando...</div>
          ) : grouped.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              {debouncedQuery
                ? `Nada encontrado para "${debouncedQuery}".`
                : "Comece digitando para buscar."}
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.kind} className="px-2 py-1.5">
                <div className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {KIND_LABEL[group.kind]}
                </div>
                <ul>
                  {group.items.map((result) => {
                    runningIndex += 1;
                    const isActive = runningIndex === activeIndex;
                    const idx = runningIndex;
                    const Icon = result.icon;
                    return (
                      <li key={result.id}>
                        <button
                          type="button"
                          data-cmd-index={idx}
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={() => handleSelect(result)}
                          className={cn(
                            "group flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                            isActive
                              ? "border-border/80 bg-background"
                              : "border-transparent hover:border-border/60 hover:bg-background/60"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors",
                              isActive
                                ? "bg-primary/12 text-primary dark:bg-primary/18"
                                : "bg-background/60 text-muted-foreground group-hover:text-foreground"
                            )}
                          >
                            <Icon size={15} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-foreground">
                              {result.label}
                            </span>
                            {result.secondary ? (
                              <span className="block truncate text-[11px] text-muted-foreground">
                                {result.secondary}
                              </span>
                            ) : null}
                          </span>
                          {isActive ? (
                            <kbd className="hidden shrink-0 rounded border border-border/75 bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground sm:inline-flex">
                              ↵
                            </kbd>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border/75 bg-background/40 px-4 py-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-2">
            <kbd className="rounded border border-border/75 bg-background px-1.5 py-0.5 font-semibold">
              ↑↓
            </kbd>
            navegar
          </span>
          <span className="flex items-center gap-2">
            <kbd className="rounded border border-border/75 bg-background px-1.5 py-0.5 font-semibold">
              ↵
            </kbd>
            abrir
          </span>
          <span className="flex items-center gap-2">
            <kbd className="rounded border border-border/75 bg-background px-1.5 py-0.5 font-semibold">
              Esc
            </kbd>
            fechar
          </span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
