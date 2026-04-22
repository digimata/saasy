export function RevenueChart() {
  return (
    <div className="rounded-xl border border-ds-gray-100 bg-ds-bg-200 p-4">
      <div className="h-64 flex flex-col justify-end">
        <div className="border-b border-ds-blue-500 w-full" />
      </div>
      <div className="flex gap-8 mt-3">
        <span className="text-label-12 text-muted-foreground">Jul 08</span>
        <span className="text-label-12 text-muted-foreground">Jul 10</span>
        <span className="text-label-12 text-muted-foreground">Jul 11</span>
        <span className="text-label-12 text-muted-foreground">Jul 11</span>
      </div>
    </div>
  );
}
