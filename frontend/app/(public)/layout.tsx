import { PublicSidebarShell } from "@/components/public-sidebar-shell";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <PublicSidebarShell>{children}</PublicSidebarShell>;
}
