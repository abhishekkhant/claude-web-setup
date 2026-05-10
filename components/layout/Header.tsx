"use client";

import { useStore } from "@/stores/useStore";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function Header({ title, description, actions }: HeaderProps) {
  const { sidebarCollapsed } = useStore();

  return (
    <div
      className={cn(
        "mb-6 transition-all duration-300",
        sidebarCollapsed ? "ml-16" : "ml-64"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {actions}
        </div>
      </div>
    </div>
  );
}