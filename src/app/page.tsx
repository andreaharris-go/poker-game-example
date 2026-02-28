"use client";

import Link from "next/link";

const sections = [
  {
    href: "/explorer",
    title: "API Explorer",
    description: "Browse and test all API endpoints from the OpenAPI spec, grouped by tag.",
  },
  {
    href: "/demo",
    title: "Tournament Demo",
    description: "Step-by-step wizard walking through a full tournament lifecycle.",
  },
  {
    href: "/wallet",
    title: "Wallet",
    description: "Check balances and browse transaction history with cursor pagination.",
  },
  {
    href: "/tournaments",
    title: "Tournaments",
    description: "List, inspect, and manage tournaments with admin quick-actions.",
  },
  {
    href: "/tables",
    title: "Tables",
    description: "Inspect table state, view your hand, and send player actions.",
  },
  {
    href: "/logs",
    title: "Network Logs",
    description: "View every API request made in this session with full details.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold text-white">Poker API Debug Tool</h1>
      <p className="mb-8 text-gray-400">
        Explore, test, and debug the Poker API. Choose a section below to get started.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-lg border border-gray-700 bg-gray-800 p-4 shadow hover:border-blue-500 hover:bg-gray-700 transition-colors"
          >
            <h2 className="mb-1 text-lg font-semibold text-white">{s.title}</h2>
            <p className="text-sm text-gray-400">{s.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
