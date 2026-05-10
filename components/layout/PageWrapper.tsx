"use client";

import { useStore } from "@/stores/useStore";
import { cn } from "@/lib/utils";

interface PageWrapperProps {
  children: React.ReactNode;
}

export function PageWrapper({ children }: PageWrapperProps) {
  const { sidebarCollapsed } = useStore();

  return (
    <div
      className={cn(
        "min-h-screen bg-background transition-all duration-300",
        sidebarCollapsed ? "ml-16" : "ml-64"
      )}
    >
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}