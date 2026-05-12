import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelative(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = (Date.now() - d.getTime()) / 1000;
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [3600, "minute"],
    [86400, "hour"],
    [604800, "day"],
    [2629800, "week"],
    [31557600, "month"],
  ];
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (let i = 0; i < units.length; i++) {
    const [limit, unit] = units[i];
    if (Math.abs(diff) < limit) {
      const divisor = i === 0 ? 1 : units[i - 1][0];
      return rtf.format(-Math.round(diff / divisor), unit);
    }
  }
  return rtf.format(-Math.round(diff / 31557600), "year");
}

export function truncateAddress(addr?: string | null, head = 6, tail = 4) {
  if (!addr) return "";
  if (addr.length <= head + tail) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}
