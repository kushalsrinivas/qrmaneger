export default function BillingPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Billing</h2>
          <p className="text-muted-foreground">
            Manage your subscription and billing information
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="rounded-lg border p-6">
          <h3 className="mb-2 text-lg font-semibold">Current Plan</h3>
          <p className="text-muted-foreground">
            Billing features will be implemented here.
          </p>
        </div>
      </div>
    </div>
  );
}
