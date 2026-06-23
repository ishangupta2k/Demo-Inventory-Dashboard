"use client"; // usePathname needs the browser -> Client Component

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Home" },
  { href: "/demo", label: "Demo" },
  { href: "/catalog", label: "Catalog" },
  { href: "/vendors", label: "Vendors" },
];

export default function Nav() {
  const path = usePathname();

  return (
    <nav className="nav-tabs" aria-label="Primary">
      {tabs.map((t) => {
        const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={
              "nav-link " + (active ? "is-active" : "")
            }
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
