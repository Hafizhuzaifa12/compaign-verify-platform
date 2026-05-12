import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  delta?: { value: string; direction: "up" | "down"; tone?: "good" | "bad" };
  icon: LucideIcon;
  hint?: string;
}

export function StatCard({ label, value, delta, icon: Icon, hint }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-semibold tracking-tight">{value}</span>
          {delta && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs",
                (delta.tone ?? (delta.direction === "up" ? "good" : "bad")) ===
                  "good"
                  ? "bg-success/15 text-success"
                  : "bg-danger/15 text-danger"
              )}
            >
              {delta.direction === "up" ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {delta.value}
            </span>
          )}
        </div>
        {hint && (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        )}
      </CardContent>
    </Card>
  );
}
