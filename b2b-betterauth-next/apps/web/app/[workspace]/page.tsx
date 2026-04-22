import type { Metadata } from "next";
import { RevenueCard } from "@/components/overview/revenue-card";

export const metadata: Metadata = { title: "Overview" };
import { MetricChartCard } from "@/components/overview/metric-chart-card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <h1 className="text-heading-24 font-medium">Overview</h1>

      <RevenueCard />

      {/* Metric charts */}
      <div className="grid grid-cols-2 gap-4">
        <MetricChartCard
          title="Monthly Recurring Revenue"
          value="$0"
          period="Jan 5 – Apr 6, 2026"
          showArrow
        />
        <MetricChartCard
          title="Active Subscriptions"
          value="0"
          period="Jan 5 – Apr 6, 2026"
        />
      </div>

      {/* Orders card */}
      <div className="rounded-xl border border-ds-gray-100 bg-ds-bg-300 p-6 max-w-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-heading-16">August 2025</h2>
          <div className="flex items-center gap-2">
            <button type="button" className="text-ds-steel-500 hover:text-foreground transition-colors">&larr;</button>
            <button type="button" className="text-ds-steel-500 hover:text-foreground transition-colors">&rarr;</button>
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-heading-32">0</span>
          <span className="text-label-14 text-muted-foreground">Orders</span>
        </div>

        {/* Weekday grid */}
        <div className="grid grid-cols-7 gap-2">
          {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
            <span key={i} className="text-label-12 text-muted-foreground text-center">{day}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
