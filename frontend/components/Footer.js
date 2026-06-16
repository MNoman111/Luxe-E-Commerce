export default function Footer() {
  return (
    <footer className="bg-ink text-white/80 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12 grid gap-8 sm:grid-cols-3">
        <div>
          <div className="text-xl font-serif tracking-[0.3em] text-white">LUXE</div>
          <p className="mt-3 text-sm leading-relaxed">
            Elevated everyday essentials, made to last. Free shipping on orders over $100.
          </p>
        </div>
        <div className="text-sm">
          <div className="text-white font-medium mb-3">Shop</div>
          <ul className="space-y-2">
            <li>Men</li>
            <li>Women</li>
            <li>Accessories</li>
            <li>Footwear</li>
          </ul>
        </div>
        <div className="text-sm">
          <div className="text-white font-medium mb-3">Help</div>
          <ul className="space-y-2">
            <li>Shipping & Returns</li>
            <li>Size Guide</li>
            <li>Contact</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} LUXE. Demo store for portfolio use.
      </div>
    </footer>
  );
}
