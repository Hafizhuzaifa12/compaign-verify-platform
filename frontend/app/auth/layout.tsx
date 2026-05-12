import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, hsl(var(--primary) / 0.25) 0%, transparent 70%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 hero-grid opacity-40" />

      <header className="relative z-10">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--accent)))] shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.7)]">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold tracking-tight">Verit</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 pb-12">
        {children}
      </main>
    </div>
  );
}
