import { useEffect, useMemo, useState } from "react";

import { BarChart, CheckCircle, Clock, Wallet } from "@/assets/icons";
import AdminEmptyState from "@/components/portal/AdminEmptyState";
import MetricTile from "@/components/portal/MetricTile";
import StatusBadge from "@/components/portal/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { CHARGE_STATUS_META, formatPortalDate } from "@/lib/portal";
import { loadChargesForClient, resolveClientForUser } from "@/lib/portal-data";
import { formatBRL } from "@/lib/masks";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type FinancialBucket = "futura" | "proxima_fatura" | "em_atraso" | "pago" | "historico";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ClientFinance() {
  const { user } = useAuth();
  const [charges, setCharges] = useState<
    Awaited<ReturnType<typeof loadChargesForClient>>["charges"]
  >([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    const loadFinance = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setPageError(null);

      const clientRes = await resolveClientForUser(user.id);
      if (clientRes.error || !clientRes.client) {
        setPageError(clientRes.error?.message ?? "Cadastro do cliente nao encontrado.");
        setLoading(false);
        return;
      }

      const chargesRes = await loadChargesForClient(clientRes.client.id);
      if (chargesRes.error) {
        setPageError(chargesRes.error.message);
        setLoading(false);
        return;
      }

      setCharges(chargesRes.charges);
      setLoading(false);
    };

    void loadFinance();
  }, [user?.id]);

  const financialItems = useMemo(() => {
    return charges
      .filter((charge) => charge.status !== "cancelado")
      .map((charge) => {
        // Historical charges: shown separately, never in operational metrics
        if (charge.is_historical) {
          return {
            id: charge.id,
            description: charge.description,
            amount: Number(charge.amount),
            dueDate: charge.due_date,
            bucket: "historico" as FinancialBucket,
            badge: CHARGE_STATUS_META.pago,
          };
        }

        if (charge.status === "pago") {
          return {
            id: charge.id,
            description: charge.description,
            amount: Number(charge.amount),
            dueDate: charge.due_date,
            bucket: "pago" as FinancialBucket,
            badge: CHARGE_STATUS_META.pago,
          };
        }

        if (charge.status === "atrasado") {
          return {
            id: charge.id,
            description: charge.description,
            amount: Number(charge.amount),
            dueDate: charge.due_date,
            bucket: "em_atraso" as FinancialBucket,
            badge: CHARGE_STATUS_META.atrasado,
          };
        }

        // agendada = scheduled future charge
        if (charge.status === "agendada") {
          return {
            id: charge.id,
            description: charge.description,
            amount: Number(charge.amount),
            dueDate: charge.due_date,
            bucket: "futura" as FinancialBucket,
            badge: CHARGE_STATUS_META.agendada,
          };
        }

        // pendente = open, actionable
        return {
          id: charge.id,
          description: charge.description,
          amount: Number(charge.amount),
          dueDate: charge.due_date,
          bucket: "proxima_fatura" as FinancialBucket,
          badge: CHARGE_STATUS_META.pendente,
        };
      })
      .sort((left, right) => left.dueDate.localeCompare(right.dueDate));
  }, [charges]);

  // Metrics exclude historical and agendada
  const nextInvoice = financialItems.find((item) => item.bucket === "proxima_fatura") ?? null;
  const nextInvoiceAmount = nextInvoice?.amount ?? 0;
  const overdueAmount = financialItems
    .filter((item) => item.bucket === "em_atraso")
    .reduce((sum, item) => sum + item.amount, 0);
  const paidAmount = financialItems
    .filter((item) => item.bucket === "pago")
    .reduce((sum, item) => sum + item.amount, 0);

  const overdueItems = financialItems.filter((item) => item.bucket === "em_atraso");
  const upcomingItems = financialItems.filter((item) => item.bucket === "proxima_fatura");
  const futureItems = financialItems.filter((item) => item.bucket === "futura");
  const paidItems = financialItems.filter((item) => item.bucket === "pago");
  const historicalItems = financialItems.filter((item) => item.bucket === "historico");

  const operationalItems = [...upcomingItems, ...overdueItems, ...futureItems, ...paidItems];

  /* ---- Loading skeleton ---- */
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-2xl border border-border/60 bg-card"
            />
          ))}
        </div>
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="h-16 animate-pulse rounded-xl border border-border/50 bg-background/60"
          />
        ))}
      </div>
    );
  }

  /* ---- Error state ---- */
  if (pageError) {
    return (
      <AdminEmptyState
        icon={BarChart}
        title="Nao foi possivel carregar seu financeiro"
        description={pageError}
      />
    );
  }

  /* ---- Main render ---- */
  return (
    <div className="space-y-8">
      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <MetricTile
          label="Proxima fatura"
          value={nextInvoice ? formatBRL(nextInvoiceAmount) : "Sem fatura"}
          icon={Clock}
          tone="primary"
        />
        <MetricTile
          label="Em atraso"
          value={formatBRL(overdueAmount)}
          icon={Wallet}
          tone={overdueAmount > 0 ? "destructive" : "secondary"}
        />
        <MetricTile
          label="Ja pago"
          value={formatBRL(paidAmount)}
          icon={CheckCircle}
          tone="success"
        />
      </div>

      {/* Charges */}
      {operationalItems.length === 0 && historicalItems.length === 0 ? (
        <AdminEmptyState
          icon={BarChart}
          title="Nenhuma cobranca registrada"
          description="Quando houver cobrancas vinculadas a sua conta, elas aparecerao nesta area."
        />
      ) : (
        <div className="space-y-8">
          {/* Em aberto */}
          {upcomingItems.length > 0 && (
            <section className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Em aberto
              </p>
              {upcomingItems.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-2 rounded-xl border border-border/50 bg-background/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.description}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatBRL(item.amount)} · vencimento em {formatPortalDate(item.dueDate)}
                    </p>
                  </div>
                  <StatusBadge label={item.badge.label} tone={item.badge.tone} />
                </article>
              ))}
            </section>
          )}

          {/* Em atraso */}
          {overdueItems.length > 0 && (
            <section className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Em atraso
              </p>
              {overdueItems.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-2 rounded-xl border border-border/50 bg-background/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.description}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatBRL(item.amount)} · vencimento em {formatPortalDate(item.dueDate)}
                    </p>
                  </div>
                  <StatusBadge label={item.badge.label} tone={item.badge.tone} />
                </article>
              ))}
            </section>
          )}

          {/* Proximas faturas */}
          {futureItems.length > 0 && (
            <section className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Proximas faturas
              </p>
              {futureItems.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-2 rounded-xl border border-border/50 bg-background/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.description}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatBRL(item.amount)} · vencimento em {formatPortalDate(item.dueDate)}
                    </p>
                  </div>
                  <StatusBadge label={item.badge.label} tone={item.badge.tone} />
                </article>
              ))}
            </section>
          )}

          {/* Historico pago */}
          {paidItems.length > 0 && (
            <section className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Historico pago
              </p>
              {paidItems.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-2 rounded-xl border border-border/50 bg-background/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.description}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatBRL(item.amount)} · {formatPortalDate(item.dueDate)}
                    </p>
                  </div>
                  <StatusBadge label={item.badge.label} tone={item.badge.tone} />
                </article>
              ))}
            </section>
          )}

          {/* Pagamentos anteriores ao sistema */}
          {historicalItems.length > 0 && (
            <section className="space-y-3 opacity-60">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Pagamentos anteriores ao sistema
              </p>
              {historicalItems.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-2 rounded-xl border border-border/50 bg-background/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                >
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">
                      {item.description}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatBRL(item.amount)} · {formatPortalDate(item.dueDate)}
                    </p>
                  </div>
                  <StatusBadge label={item.badge.label} tone={item.badge.tone} />
                </article>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
