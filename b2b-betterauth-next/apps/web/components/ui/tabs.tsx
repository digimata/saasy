"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

const TabsContext = React.createContext<{ activeValue: string; id: string }>({ activeValue: "", id: "" });

function Tabs({
  className,
  defaultValue,
  value,
  onValueChange,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  const [activeValue, setActiveValue] = React.useState(value ?? defaultValue ?? "");
  const id = React.useId();

  const handleValueChange = React.useCallback(
    (val: string) => {
      setActiveValue(val);
      onValueChange?.(val);
    },
    [onValueChange]
  );

  React.useEffect(() => {
    if (value !== undefined) setActiveValue(value);
  }, [value]);

  return (
    <TabsContext.Provider value={{ activeValue, id }}>
      <TabsPrimitive.Root
        data-slot="tabs"
        className={cn("flex flex-col gap-2", className)}
        defaultValue={defaultValue}
        value={value}
        onValueChange={handleValueChange}
        {...props}
      />
    </TabsContext.Provider>
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "relative flex w-fit items-center gap-1",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  value,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const { activeValue, id } = React.useContext(TabsContext);
  const isActive = activeValue === value;

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      value={value}
      className={cn(
        "relative inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground whitespace-nowrap transition-colors duration-300 cursor-pointer",
        "hover:text-foreground",
        isActive && "!text-foreground",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {isActive && (
        <motion.span
          layoutId={`tabs-pill-${id}`}
          className="absolute inset-0 rounded-md bg-ds-gray-200"
          transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
        />
      )}
      <span className="relative z-10">{props.children}</span>
    </TabsPrimitive.Trigger>
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
