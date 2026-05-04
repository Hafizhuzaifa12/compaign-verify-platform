import { DashboardShell } from "@/components/dashboard-shell";

export default function DashboardRouteLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
