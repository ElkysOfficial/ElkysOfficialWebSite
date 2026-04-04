import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ExternalLink, FileText } from "@/assets/icons";
import AdminEmptyState from "@/components/portal/AdminEmptyState";
import { Button, cn } from "@/design-system";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

const TABS = [
  { key: "contrato", label: "Contrato" },
  { key: "aditivo", label: "Aditivo" },
  { key: "nota_fiscal", label: "Nota Fiscal" },
  { key: "codigo_fonte", label: "Código-fonte" },
] as const;

type TabKey = (typeof TABS)[number]["key"];
type Document = Database["public"]["Tables"]["documents"]["Row"];

export default function ClientDocuments() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<Document[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const hasLoadedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("contrato");

  const loadDocuments = useCallback(
    async (background = false) => {
      if (!user?.id) {
        setDocs([]);
        hasLoadedRef.current = true;
        setHasLoaded(true);
        setLoading(false);
        return;
      }

      if (!background || !hasLoadedRef.current) {
        setLoading(true);
        setPageError(null);
      }

      const clientRes = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (clientRes.error) {
        if (!hasLoadedRef.current) {
          setPageError(clientRes.error.message);
          setLoading(false);
        }
        return;
      }

      if (!clientRes.data) {
        setDocs([]);
        hasLoadedRef.current = true;
        setHasLoaded(true);
        setLoading(false);
        return;
      }

      const documentsRes = await supabase
        .from("documents")
        .select("*")
        .eq("client_id", clientRes.data.id)
        .order("created_at", { ascending: false });

      if (documentsRes.error) {
        if (!hasLoadedRef.current) {
          setPageError(documentsRes.error.message);
          setLoading(false);
        }
        return;
      }

      setDocs(documentsRes.data ?? []);
      hasLoadedRef.current = true;
      setHasLoaded(true);
      setLoading(false);
    },
    [user?.id]
  );

  useEffect(() => {
    const refreshDocuments = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void loadDocuments(true);
    };

    void loadDocuments();

    const interval = window.setInterval(refreshDocuments, 60000);
    window.addEventListener("focus", refreshDocuments);
    document.addEventListener("visibilitychange", refreshDocuments);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshDocuments);
      document.removeEventListener("visibilitychange", refreshDocuments);
    };
  }, [loadDocuments]);

  const filteredDocs = useMemo(
    () => docs.filter((document) => document.type === activeTab),
    [activeTab, docs]
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Documentos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesse contratos, aditivos, notas fiscais e código-fonte do seu projeto.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-border/60 bg-card p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "min-w-fit rounded-md px-3 py-2 text-sm font-medium transition-all",
              activeTab === tab.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Document list */}
      {loading && !hasLoaded ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-xl border border-border/50 bg-background/60"
            />
          ))}
        </div>
      ) : pageError ? (
        <AdminEmptyState
          icon={FileText}
          title="Não foi possível carregar os documentos"
          description={`${pageError} Tente novamente em instantes.`}
          action={
            <Button type="button" onClick={() => void loadDocuments()}>
              Tentar novamente
            </Button>
          }
        />
      ) : filteredDocs.length === 0 ? (
        <AdminEmptyState
          icon={FileText}
          title="Nenhum documento nesta categoria"
          description="Os arquivos desta seção ainda não foram disponibilizados no portal."
        />
      ) : (
        <div className="space-y-3">
          {filteredDocs.map((doc) => (
            <article
              key={doc.id}
              className="rounded-xl border border-border/50 bg-background/60 px-4 py-3 transition-all hover:border-primary/25 hover:bg-card sm:px-5 sm:py-4"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-foreground">{doc.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Disponibilizado em {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <Button variant="outline" size="sm">
                    <ExternalLink size={14} />
                    Abrir
                  </Button>
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
