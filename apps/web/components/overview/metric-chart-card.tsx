import { ArrowUpRight } from "lucide-react";

interface MetricChartCardProps {
  title: string;
  value: string;
  period: string;
  showArrow?: boolean;
}

export function MetricChartCard({ title, value, period, showArrow = false }: MetricChartCardProps) {
  const dates = ["Jan 05", "Jan 19", "Feb 02", "Feb 16", "Mar 02", "Mar 16", "Mar 30"];

  return (
    <div className="rounded-xl border border-ds-gray-100 bg-ds-bg-300 overflow-hidden">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-label-14 text-foreground font-medium">{title}</span>
          {showArrow && (
            <button type="button" className="text-ds-steel-500 hover:text-foreground transition-colors">
              <ArrowUpRight className="size-4" />
            </button>
          )}
        </div>

        <div>
          <p className="text-display-40 mb-3">{value}</p>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full border-2 border-ds-blue-500" />
            <span className="text-label-13 text-muted-foreground">{period}</span>
          </div>
        </div>
      </div>

      {/* Chart placeholder */}
      <div className="px-2 pb-2">
        <div className="rounded-xl border border-ds-gray-100 bg-ds-bg-200 p-4">
          <div className="h-52 flex flex-col justify-end">
            <div className="border-b border-ds-blue-500 w-full" />
          </div>
          <div className="flex justify-between mt-3">
            {dates.map((date) => (
              <span key={date} className="text-label-12 text-muted-foreground">{date}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
