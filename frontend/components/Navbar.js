"use client";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { count } = useCart();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/products", label: "Shop All" },
    { href: "/products?category=Men", label: "Men" },
    { href: "/products?category=Women", label: "Women" },
    { href: "/products?category=Accessories", label: "Accessories" },
    { href: "/products?category=Footwear", label: "Footwear" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-black/5">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-serif tracking-[0.3em] font-semibold">
          LUXE
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm tracking-wide">
          {links.map((l) => (
            <Link key={l.label} href={l.href} className="hover:text-accent transition">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4 text-sm">
          {user ? (
            <div className="hidden sm:flex items-center gap-3">
              {user.isAdmin && (
                <>
                  <Link href="/admin" className="hover:text-accent">Admin</Link>
                  <span className="text-black/30">|</span>
                </>
              )}
              <Link href="/orders" className="hover:text-accent">Orders</Link>
              <span className="text-black/30">|</span>
              <button onClick={logout} className="hover:text-accent">
                Logout
              </button>
            </div>
          ) : (
            <Link href="/login" className="hidden sm:block hover:text-accent">
              Sign in
            </Link>
          )}
          <Link href="/cart" className="relative">
            Cart
            {count > 0 && (
              <span className="absolute -top-2 -right-4 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
          <button
            className="md:hidden ml-1"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            ☰
          </button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden border-t border-black/5 bg-white px-4 py-3 flex flex-col gap-3 text-sm">
          {links.map((l) => (
            <Link key={l.label} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link href="/orders" onClick={() => setOpen(false)}>Orders</Link>
              <button className="text-left" onClick={() => { logout(); setOpen(false); }}>
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" onClick={() => setOpen(false)}>Sign in</Link>
          )}
        </nav>
      )}
    </header>
  );
}
