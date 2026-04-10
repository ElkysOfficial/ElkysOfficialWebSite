import { Button } from "@/design-system";

export default function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card/92 px-4 py-2.5">
      <p className="text-xs tabular-nums text-muted-foreground">
        {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalItems)} de {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </Button>
        <span className="text-xs font-medium tabular-nums text-foreground">
          {page + 1}/{totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          Proximo
        </Button>
      </div>
    </div>
  );
}
