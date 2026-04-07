import { ArrowUpRight, ChevronDown } from "lucide-react";
import { RevenueChart } from "./revenue-chart";

export function RevenueCard() {
  return (
    <div className="rounded-xl border border-ds-gray-100 bg-ds-bg-300 overflow-hidden">
      {/* Header + stats */}
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <button type="button" className="flex items-center gap-1 text-label-14 text-foreground hover:text-foreground transition-colors">
            Revenue
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
          <button type="button" className="text-ds-steel-500 hover:text-foreground transition-colors">
            <ArrowUpRight className="size-4" />
          </button>
        </div>

        <div>
          <p className="text-display-48 mb-4">$0</p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded-full border-2 border-ds-blue-500" />
              <span className="text-label-13 text-muted-foreground">Jul 8, 2025 — Aug 7, 2025</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded-full border-2 border-ds-gray-500" />
              <span className="text-label-13 text-muted-foreground">Jun 8, 2025 — Jul 8, 2025</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 pb-2">
        <RevenueChart />
      </div>
    </div>
  );
}
