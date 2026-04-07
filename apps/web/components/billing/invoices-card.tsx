"use client";

import { useState, useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { formatDate, formatCurrency, capitalize } from "@/lib/utils";
import type { InvoicesResponse } from "@/app/api/billing/schema";

function getMonthOptions(invoices: InvoicesResponse["invoices"]): { value: string; label: string }[] {
  const months = new Map<string, string>();
  const now = new Date();
  // Always include current month
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  months.set(key, now.toLocaleDateString("en-US", { month: "long", year: "numeric" }));

  for (const inv of invoices) {
    const d = new Date(inv.date * 1000);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!months.has(k)) {
      months.set(k, d.toLocaleDateString("en-US", { month: "long", year: "numeric" }));
    }
  }

  return Array.from(months.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([value, label]) => ({ value, label }));
}

export function InvoicesCard({
  invoices,
  hasMore,
  onLoadMore,
}: {
  invoices: InvoicesResponse["invoices"];
  hasMore: boolean;
  onLoadMore: () => void;
}) {
  const monthOptions = useMemo(() => getMonthOptions(invoices), [invoices]);
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]?.value ?? "");

  function handleMonthChange(value: string | null) {
    setSelectedMonth(value ?? "");
  }

  const filtered = useMemo(() => {
    if (!selectedMonth) return invoices;
    return invoices.filter((inv) => {
      const d = new Date(inv.date * 1000);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return k === selectedMonth;
    });
  }, [invoices, selectedMonth]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-heading-20">Invoices</h3>
        {monthOptions.length > 0 && (
          <Select value={selectedMonth} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-auto gap-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="rounded-lg border border-ds-gray-100 overflow-hidden">
        <table className="w-full text-copy-13">
          <thead>
            <tr className="bg-ds-bg-300 text-label-13 font-medium text-foreground">
              <th className="text-left px-5 py-3 font-medium">Date</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="text-right px-5 py-3 font-medium">Amount</th>
              <th className="text-right px-5 py-3 font-medium">Invoice</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr className="border-t border-ds-gray-100">
                <td colSpan={4} className="px-5 py-6 text-center text-muted-foreground">
                  No invoices yet
                </td>
              </tr>
            ) : (
              filtered.map((inv) => (
                <tr key={inv.id} className="border-t border-ds-gray-100">
                  <td className="px-5 py-3">{formatDate(inv.date)}</td>
                  <td className="px-5 py-3">{capitalize(inv.status)}</td>
                  <td className="px-5 py-3 text-right">
                    {formatCurrency(inv.amountDue, inv.currency)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {inv.hostedInvoiceUrl && (
                      <a
                        href={inv.hostedInvoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="size-3" />
                        View
                      </a>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {hasMore && (
          <div className="px-5 py-3 border-t border-ds-gray-100">
            <Button variant="ghost" size="sm" onClick={onLoadMore}>
              Load more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
