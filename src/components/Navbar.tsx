"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import type { HeaderProfile } from "@/lib/api/client";
import {
  getProfiles,
  getActiveProfileId,
} from "@/lib/storage/profiles";
import HeaderProfileSelector from "./HeaderProfileSelector";

const BASE_URL_KEY = "poker-api-base-url";
const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

const NAV_LINKS = [
  { href: "/", label: "Demo" },
  { href: "/explorer", label: "Explorer" },
  { href: "/wallet", label: "Wallet" },
  { href: "/tournaments", label: "Tournaments" },
  { href: "/tables", label: "Tables" },
  { href: "/logs", label: "Logs" },
];

export default function Navbar() {
  const [baseUrl, setBaseUrl] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_BASE_URL;
    return localStorage.getItem(BASE_URL_KEY) ?? DEFAULT_BASE_URL;
  });
  const [showHeaders, setShowHeaders] = useState(false);
  const [activeProfile, setActiveProfile] = useState<HeaderProfile | null>(
    () => {
      const profiles = getProfiles();
      const activeId = getActiveProfileId();
      return profiles.find((p) => p.id === activeId) ?? profiles[0] ?? null;
    },
  );

  const handleBaseUrlChange = useCallback((url: string) => {
    setBaseUrl(url);
    localStorage.setItem(BASE_URL_KEY, url);
  }, []);

  const resolvedHeaders: Record<string, string> = {};
  if (activeProfile) {
    resolvedHeaders["x-vendor-id"] = activeProfile.vendorId;
    resolvedHeaders["x-provider-id"] = activeProfile.providerId;
    if (activeProfile.userId)
      resolvedHeaders["x-user-id"] = activeProfile.userId;
    if (activeProfile.adminKey)
      resolvedHeaders["x-admin-key"] = activeProfile.adminKey;
  }

  return (
    <nav className="bg-gray-900 shadow">
      <div className="mx-auto max-w-7xl px-4">
        {/* Main bar */}
        <div className="flex flex-wrap items-center gap-4 py-3">
          {/* Title */}
          <Link href="/" className="text-lg font-bold text-white whitespace-nowrap">
            Poker API Debug
          </Link>

          {/* Nav links */}
          <div className="flex flex-wrap gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Base URL */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 whitespace-nowrap">
              API URL
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => handleBaseUrlChange(e.target.value)}
              className="w-48 rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Profile selector */}
          <HeaderProfileSelector
            onProfileChange={(profile) => setActiveProfile(profile)}
          />

          {/* Headers toggle */}
          <button
            type="button"
            onClick={() => setShowHeaders((prev) => !prev)}
            className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600"
          >
            {showHeaders ? "▼ Headers" : "▶ Headers"}
          </button>
        </div>

        {/* Collapsible headers */}
        {showHeaders && (
          <div className="border-t border-gray-700 py-2">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
              {Object.entries(resolvedHeaders).map(([key, val]) => (
                <span key={key}>
                  <span className="text-blue-400">{key}:</span>{" "}
                  <span className="text-gray-300">{val}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
