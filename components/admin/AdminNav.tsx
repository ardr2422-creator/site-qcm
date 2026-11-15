"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/qrcode", label: "QR codes" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Espace organisateur" className="flex gap-1">
      {links.map((link) => {
        const active =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-[0.9375rem] font-semibold transition-colors ${
              active
                ? "bg-asperge-700 text-white"
                : "text-brun-700 hover:bg-creme-200 hover:text-brun-900"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
