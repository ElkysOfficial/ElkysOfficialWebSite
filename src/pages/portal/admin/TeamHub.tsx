import { lazy, Suspense, useState } from "react";
import { useLocation } from "react-router-dom";

import PortalLoading from "@/components/portal/shared/PortalLoading";
import { cn } from "@/design-system";

const AdminTeam = lazy(() => import("@/pages/portal/admin/Team"));
const AdminNotifications = lazy(() => import("@/pages/portal/admin/Notifications"));

type TeamTab = "membros" | "notificacoes";

export default function TeamHub() {
  const location = useLocation();
  const requestedTab = (location.state as { teamTab?: TeamTab } | null)?.teamTab ?? "membros";
  const [activeTab, setActiveTab] = useState<TeamTab>(requestedTab);

  const tabs: { key: TeamTab; label: string }[] = [
    { key: "membros", label: "Membros" },
    { key: "notificacoes", label: "Notificacoes" },
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
        {activeTab === "membros" ? <AdminTeam /> : <AdminNotifications />}
      </Suspense>
    </div>
  );
}
