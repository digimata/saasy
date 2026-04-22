import { useSearchParams } from "react-router";
import { useUser } from "@clerk/clerk-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import { GeneralTab } from "./general";
import { BillingTab } from "./billing";

const tabs = [
  { id: "general", label: "General" },
  { id: "billing", label: "Billing" },
];

const VALID_TABS = new Set(tabs.map((t) => t.id));

export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const defaultTab = tabParam && VALID_TABS.has(tabParam) ? tabParam : "general";
  const { user, isLoaded } = useUser();

  const fullName = user?.fullName || user?.primaryEmailAddress?.emailAddress || "";
  const initial = (fullName[0] || "?").toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        {!isLoaded ? (
          <>
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-6 w-40" />
          </>
        ) : user ? (
          <>
            <Avatar className="size-10">
              <AvatarImage src={user.imageUrl} />
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            <h2 className="text-heading-24 font-medium">{fullName}</h2>
          </>
        ) : null}
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
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

        <TabsContent value="billing">
          <BillingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
