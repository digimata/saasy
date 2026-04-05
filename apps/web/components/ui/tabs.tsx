"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  const [activeTab, setActiveTab] = React.useState<string>("");
  const [tabPositions, setTabPositions] = React.useState<Record<string, { left: number; width: number }>>({});
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const updatePositions = () => {
      if (!listRef.current) return;

      const triggers = listRef.current.querySelectorAll('[data-slot="tabs-trigger"]');
      const newPositions: Record<string, { left: number; width: number }> = {};

      triggers.forEach((trigger) => {
        const value = trigger.getAttribute('data-value');
        if (value) {
          const rect = trigger.getBoundingClientRect();
          const listRect = listRef.current!.getBoundingClientRect();
          newPositions[value] = {
            left: rect.left - listRect.left,
            width: rect.width
          };
        }
      });

      setTabPositions(newPositions);
    };

    const checkActiveTab = () => {
      if (!listRef.current) return;
      const activeTrigger = listRef.current.querySelector('[data-state="active"]');
      const activeValue = activeTrigger?.getAttribute('data-value');
      if (activeValue && activeValue !== activeTab) {
        setActiveTab(activeValue);
        if (isInitialLoad) {
          setTimeout(() => setIsInitialLoad(false), 100);
        }
      }
    };

    updatePositions();
    checkActiveTab();

    const timeoutId = setTimeout(() => {
      updatePositions();
      checkActiveTab();
    }, 50);

    window.addEventListener('resize', updatePositions);

    const observer = new MutationObserver(() => {
      const activeTrigger = listRef.current?.querySelector('[data-state="active"]');
      const activeValue = activeTrigger?.getAttribute('data-value');
      if (activeValue && activeValue !== activeTab) {
        setActiveTab(activeValue);
        updatePositions();
      }
    });

    if (listRef.current) {
      observer.observe(listRef.current, {
        subtree: true,
        attributes: true,
        attributeFilter: ['data-state']
      });
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updatePositions);
      observer.disconnect();
    };
  }, [activeTab, isInitialLoad]);

  return (
    <TabsPrimitive.List
      ref={listRef}
      data-slot="tabs-list"
      className={cn(
        "relative flex w-full items-start gap-8 border-b border-border",
        className,
      )}
      {...props}
    >
      {children}
      {activeTab && tabPositions[activeTab] && (
        <motion.div
          className="absolute bottom-0 h-0.5 bg-foreground"
          initial={isInitialLoad ? { width: 0, left: tabPositions[activeTab].left } : false}
          animate={{
            left: tabPositions[activeTab].left,
            width: tabPositions[activeTab].width,
          }}
          transition={
            isInitialLoad
              ? {
                  type: "spring",
                  stiffness: 250,
                  damping: 25,
                  mass: 0.6,
                }
              : {
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  mass: 0.8,
                }
          }
        />
      )}
    </TabsPrimitive.List>
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      data-value={props.value}
      className={cn(
        "relative inline-flex items-center justify-center gap-1.5 pb-3 text-sm text-muted-foreground whitespace-nowrap transition-colors duration-200 cursor-pointer data-[state=active]:text-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
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
