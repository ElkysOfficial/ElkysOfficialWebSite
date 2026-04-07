import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Bell, X } from "@/assets/icons";
import { Button, cn } from "@/design-system";
import type { Database } from "@/integrations/supabase/types";

type AdminNotification = Database["public"]["Tables"]["admin_notifications"]["Row"];

const SEVERITY_STYLES: Record<string, { label: string; color: string }> = {
  info: { label: "Info", color: "bg-accent/15 text-accent" },
  success: { label: "Sucesso", color: "bg-success/15 text-success" },
  warning: { label: "Atencao", color: "bg-warning/15 text-warning" },
  action_required: { label: "Acao necessaria", color: "bg-destructive/15 text-destructive" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}m`;
}

export default function AdminNotificationBell() {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const isUnread = useCallback(
    (n: AdminNotification) => !n.read_by.includes(user?.id ?? ""),
    [user?.id]
  );

  const fetchNotifications = useCallback(async () => {
    if (!user?.id || roles.length === 0) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);

    if (!error && data) {
      const items = (data as AdminNotification[]).filter((n) =>
        n.target_roles.some((r) => roles.includes(r as never))
      );
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.read_by.includes(user.id)).length);
    }
    setLoading(false);
  }, [user?.id, roles]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications" },
        () => {
          void fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const markAsRead = async (notificationId: string) => {
    if (!user?.id) return;
    const notification = notifications.find((n) => n.id === notificationId);
    if (!notification || notification.read_by.includes(user.id)) return;

    const updatedReadBy = [...notification.read_by, user.id];
    await supabase
      .from("admin_notifications")
      .update({ read_by: updatedReadBy })
      .eq("id", notificationId);

    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read_by: updatedReadBy } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    const unread = notifications.filter((n) => isUnread(n));
    if (!unread.length) return;

    for (const n of unread) {
      const updatedReadBy = [...n.read_by, user.id];
      void supabase.from("admin_notifications").update({ read_by: updatedReadBy }).eq("id", n.id);
    }

    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        read_by: isUnread(n) ? [...n.read_by, user!.id] : n.read_by,
      }))
    );
    setUnreadCount(0);
  };

  const handleClick = (notification: AdminNotification) => {
    if (isUnread(notification)) void markAsRead(notification.id);
    if (notification.action_url) {
      navigate(notification.action_url);
      setOpen(false);
    }
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void fetchNotifications();
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Notificacoes"
      >
        <Bell size={20} />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[380px] max-w-[calc(100vw-32px)] rounded-xl border border-border/80 bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Notificacoes</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-primary"
                  onClick={() => void markAllAsRead()}
                >
                  Marcar todas como lidas
                </Button>
              ) : null}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Fechar"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto sidebar-scroll">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell size={28} className="mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Nenhuma notificacao</p>
              </div>
            ) : (
              notifications.map((item) => {
                const sevInfo = SEVERITY_STYLES[item.severity] ?? SEVERITY_STYLES.info;
                const unread = isUnread(item);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleClick(item)}
                    className={cn(
                      "flex w-full gap-3 border-b border-border/40 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/50",
                      unread ? "bg-primary/[0.03]" : "",
                      item.action_url ? "cursor-pointer" : "cursor-default"
                    )}
                  >
                    <div className="flex shrink-0 pt-1.5">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          unread ? "bg-primary" : "bg-transparent"
                        )}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            sevInfo.color
                          )}
                        >
                          {sevInfo.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {timeAgo(item.created_at)}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-sm font-medium text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {item.body}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
