import type { Metadata } from "next";
import { ArrowDown, Download } from "lucide-react";

export const metadata: Metadata = { title: "Orders" };
import { IconChevronDown } from "@/components/ui/icons";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const columns = ["Customer", "Amount", "Description", "Status", "Invoice number", "Date"];

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-heading-24 font-medium">Orders</h1>

      {/* Tabs + filter + export */}
      <div className="flex items-center justify-between">
        <Tabs defaultValue="orders">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="checkouts">Checkouts</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-2 rounded-md border border-ds-gray-100 bg-ds-bg-300 px-3 py-1.5 text-label-14 text-foreground hover:border-ds-gray-200 transition-colors"
          >
            All products
            <IconChevronDown className="size-3 text-muted-foreground" />
          </button>

          <Button variant="secondary" size="sm" className="gap-2">
            <Download className="size-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-ds-gray-100 bg-ds-bg-300 p-6 space-y-6">
          <span className="text-label-14 text-foreground font-medium">Orders</span>
          <p className="text-display-32">0</p>
        </div>
        <div className="rounded-xl border border-ds-gray-100 bg-ds-bg-300 p-6 space-y-6">
          <span className="text-label-14 text-foreground font-medium">Today&apos;s Revenue</span>
          <p className="text-display-32">$0</p>
        </div>
        <div className="rounded-xl border border-ds-gray-100 bg-ds-bg-300 p-6 space-y-6">
          <span className="text-label-14 text-foreground font-medium">Cumulative Revenue</span>
          <p className="text-display-32">$0</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-ds-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-ds-bg-300">
              {columns.map((col) => (
                <th
                  key={col}
                  className="text-left text-label-13 font-medium px-4 py-3"
                >
                  <span className="flex items-center gap-1">
                    {col}
                    {col === "Date" && <ArrowDown className="size-3 text-muted-foreground" />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={columns.length}
                className="text-center text-label-14 text-muted-foreground py-12"
              >
                No Results
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
