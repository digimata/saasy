import { Button } from "@/components/ui/button";

export function PaymentCard({ onManage, loading }: { onManage: () => void; loading: boolean }) {
  return (
    <div className="space-y-4">
      <h3 className="text-heading-20">Payment</h3>
      <div className="rounded-lg border border-ds-gray-100 p-5">
        <div className="flex items-center justify-between">
          <p className="text-copy-13 text-muted-foreground">Update your payment details</p>
          <Button variant="secondary" onClick={onManage} disabled={loading}>
            Manage in Stripe
          </Button>
        </div>
      </div>
    </div>
  );
}
