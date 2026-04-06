import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Bell, X } from "@/assets/icons";
import { Button, cn } from "@/design-system";

const NOTIFICATION_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  manutencao: { label: "Manutenção", color: "bg-warning/15 text-warning" },
  atualizacao: { label: "Atualização", color: "bg-accent/15 text-accent" },
  otimizacao: { label: "Otimização", color: "bg-primary-soft text-primary" },
  alerta: { label: "Alerta", color: "bg-destructive/15 text-destructive" },
  personalizado: { label: "Comunicado", color: "bg-secondary/15 text-secondary" },
};

interface NotificationItem {
  id: string;
  notification_id: string;
  read_at: string | null;
  created_at: string;
  notification: {
    title: string;
    body: string;
    type: string;
    created_at: string;
  };
}

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

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("notification_recipients")
      .select(
        `
        id,
        notification_id,
        read_at,
        created_at,
        notification:notifications!inner (
          title,
          body,
          type,
          created_at
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (!error && data) {
      const items = (data as unknown as NotificationItem[]).filter(
        (item) => item.notification !== null
      );
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.read_at).length);
    }
    setLoading(false);
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription for new notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notification_recipients",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, fetchNotifications]);

  // Close panel on outside click
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

  const markAsRead = async (recipientId: string) => {
    await supabase
      .from("notification_recipients")
      .update({ read_at: new Date().toISOString() })
      .eq("id", recipientId);

    setNotifications((prev) =>
      prev.map((n) => (n.id === recipientId ? { ...n, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (!unreadIds.length) return;

    await supabase
      .from("notification_recipients")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds);

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    );
    setUnreadCount(0);
  };

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void fetchNotifications();
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Notificações"
      >
        <Bell size={20} />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {/* Notification panel */}
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[360px] max-w-[calc(100vw-32px)] rounded-xl border border-border/80 bg-card shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Notificações</h3>
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

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell size={28} className="mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((item) => {
                const typeInfo =
                  NOTIFICATION_TYPE_LABELS[item.notification.type] ??
                  NOTIFICATION_TYPE_LABELS.personalizado;
                const isUnread = !item.read_at;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (isUnread) void markAsRead(item.id);
                    }}
                    className={cn(
                      "flex w-full gap-3 border-b border-border/40 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/50",
                      isUnread ? "bg-primary/[0.03]" : ""
                    )}
                  >
                    {/* Unread dot */}
                    <div className="flex shrink-0 pt-1.5">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          isUnread ? "bg-primary" : "bg-transparent"
                        )}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            typeInfo.color
                          )}
                        >
                          {typeInfo.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {timeAgo(item.created_at)}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-sm font-medium text-foreground">
                        {item.notification.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {item.notification.body}
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
