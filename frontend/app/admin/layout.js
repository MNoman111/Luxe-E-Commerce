"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/vouchers", label: "Vouchers" },
];

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) router.push("/login?redirect=/admin");
    else if (!user.isAdmin) router.push("/");
  }, [user, loading, router]);

  if (loading || !user || !user.isAdmin)
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-black/60">
        Checking admin access…
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid md:grid-cols-[200px_1fr] gap-8">
      <aside className="md:border-r md:border-black/10 md:pr-4">
        <p className="text-xs uppercase tracking-widest text-black/40 mb-3">Admin</p>
        <nav className="flex md:flex-col gap-2 flex-wrap">
          {nav.map((n) => {
            const active =
              n.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`px-3 py-2 rounded-md text-sm ${
                  active ? "bg-ink text-white" : "hover:bg-black/5"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
          <Link
            href="/"
            className="px-3 py-2 rounded-md text-sm hover:bg-black/5 text-accent"
          >
            ← Store
          </Link>
        </nav>
      </aside>
      <section>{children}</section>
    </div>
  );
}
