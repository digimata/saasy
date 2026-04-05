"use client";

import { useCurrentOrganization } from "@/hooks/auth/use-current-organization";
import { OrganizationLogo } from "@/components/auth/organization/organization-logo";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { GeneralTab } from "./general";
import { MembersTab } from "./members";
import { BillingTab } from "./billing";

const tabs = [
  { id: "general", label: "General" },
  { id: "members", label: "Members" },
  { id: "billing", label: "Billing" },
];

export default function SettingsPage() {
  const { data: organization, isPending } = useCurrentOrganization();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {isPending ? (
          <>
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-6 w-40" />
          </>
        ) : organization ? (
          <>
            <OrganizationLogo organization={organization} size="lg" />
            <h2 className="text-xl font-semibold">{organization.name}</h2>
          </>
        ) : null}
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="general">
          <GeneralTab />
        </TabsContent>

        <TabsContent value="members">
          <MembersTab />
        </TabsContent>

        <TabsContent value="billing">
          <BillingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
