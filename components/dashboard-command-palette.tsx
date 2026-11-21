"use client";

import { Command, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const destinations = [
  ["Overview", "/dashboard", "Workspace summary and activity"], ["Businesses", "/dashboard/businesses", "Merchant businesses"], ["Stores", "/dashboard/stores", "Public storefront portfolio"],
  ["Catalogue", "/dashboard/catalog", "Products, categories and variants"], ["Media library", "/dashboard/media", "Images and brand assets"], ["Inventory", "/dashboard/inventory", "Stock and availability"],
  ["Orders", "/dashboard/orders", "Order lifecycle"], ["Suppliers", "/dashboard/procurement", "Purchasing and receiving"], ["Analytics", "/dashboard/analytics", "Performance reports"],
  ["Team & roles", "/dashboard/team", "People and permissions"], ["Security", "/dashboard/security", "Passwords and sessions"], ["Settings", "/dashboard/settings", "Domains, language and design"],
] as const;

export function DashboardCommandPalette({ placeholder }: { placeholder: string }) {
  const [open, setOpen] = useState(false); const [query, setQuery] = useState(""); const input = useRef<HTMLInputElement>(null);
  useEffect(() => { const listener = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen(value => !value); } if (event.key === "Escape") setOpen(false); }; window.addEventListener("keydown", listener); return () => window.removeEventListener("keydown", listener); }, []);
  useEffect(() => { if (open) window.setTimeout(() => input.current?.focus(), 20); }, [open]);
  const results = useMemo(() => destinations.filter(item => item.join(" ").toLowerCase().includes(query.toLowerCase())), [query]);
  return <><button type="button" onClick={() => setOpen(true)} className="dashboard-command-trigger"><Search /><span>{placeholder}</span><kbd><Command />K</kbd></button>
    {open && <div className="dashboard-command-backdrop" role="presentation" onMouseDown={() => setOpen(false)}><section role="dialog" aria-modal="true" aria-label="Workspace command palette" className="dashboard-command" onMouseDown={event => event.stopPropagation()}>
      <div className="dashboard-command-search"><Search /><input ref={input} value={query} onChange={event => setQuery(event.target.value)} placeholder="Go to a page or find a workspace tool…" /><button type="button" aria-label="Close command palette" onClick={() => setOpen(false)}><X /></button></div>
      <div className="dashboard-command-results">{results.map(([label, href, detail]) => <Link key={href} href={href} onClick={() => setOpen(false)}><span><b>{label}</b><small>{detail}</small></span><kbd>↗</kbd></Link>)}{results.length === 0 && <p>No matching workspace tools.</p>}</div>
      <footer><span>Navigate with search</span><span><kbd>ESC</kbd> close</span></footer>
    </section></div>}
  </>;
}
