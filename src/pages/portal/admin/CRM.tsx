import { lazy, Suspense, useState } from "react";
import { useLocation } from "react-router-dom";

import PortalLoading from "@/components/portal/PortalLoading";
import { cn } from "@/design-system";

// Lazy-load sub-tabs: only the active tab downloads its code
const Leads = lazy(() => import("@/pages/portal/admin/Leads"));
const Proposals = lazy(() => import("@/pages/portal/admin/Proposals"));
const Pipeline = lazy(() => import("@/pages/portal/admin/Pipeline"));

type CrmTab = "leads" | "propostas" | "pipeline";

export default function CRM() {
  const location = useLocation();
  const requestedTab = (location.state as { crmTab?: CrmTab } | null)?.crmTab ?? "leads";
  const [activeTab, setActiveTab] = useState<CrmTab>(requestedTab);

  const tabs: { key: CrmTab; label: string }[] = [
    { key: "leads", label: "Leads" },
    { key: "propostas", label: "Propostas" },
    { key: "pipeline", label: "Pipeline" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-border/60 bg-card p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "min-h-[40px] min-w-fit whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-all",
              activeTab === tab.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Suspense fallback={<PortalLoading />}>
        {activeTab === "leads" ? (
          <Leads />
        ) : activeTab === "propostas" ? (
          <Proposals />
        ) : (
          <Pipeline />
        )}
      </Suspense>
    </div>
  );
}
