"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLogout } from "@/lib/auth/use-auth";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/documents", label: "Documents" },
  { href: "/reports", label: "Reports" },
];

export function AppHeader() {
  const pathname = usePathname();
  const logout = useLogout();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <nav className="flex items-center gap-6">
          <span className="font-semibold text-slate-900">Pricing Calculator</span>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium ${
                pathname.startsWith(link.href)
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Button
          variant="ghost"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          Log out
        </Button>
      </div>
    </header>
  );
}
