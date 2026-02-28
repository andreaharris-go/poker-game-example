"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import type { HeaderProfile } from "@/lib/api/client";
import {
  getProfiles,
  getActiveProfileId,
  setActiveProfileId,
} from "@/lib/storage/profiles";

type HeaderProfileSelectorProps = {
  onProfileChange?: (profile: HeaderProfile) => void;
};

export default function HeaderProfileSelector({
  onProfileChange,
}: HeaderProfileSelectorProps) {
  const [profiles] = useState<HeaderProfile[]>(() => getProfiles());
  const [activeId, setActiveId] = useState<string | null>(() => {
    const loaded = getProfiles();
    return getActiveProfileId() ?? loaded[0]?.id ?? null;
  });
  const [open, setOpen] = useState(false);

  const activeProfile = profiles.find((p) => p.id === activeId) ?? profiles[0];

  const handleSelect = useCallback(
    (id: string) => {
      setActiveProfileId(id);
      setActiveId(id);
      setOpen(false);
      const profile = profiles.find((p) => p.id === id);
      if (profile && onProfileChange) {
        onProfileChange(profile);
      }
    },
    [profiles, onProfileChange],
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg border border-gray-600 bg-gray-700 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-600"
      >
        <span className="max-w-[120px] truncate">
          {activeProfile?.name ?? "No Profile"}
        </span>
        <span className="text-xs">▼</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-56 rounded-lg border border-gray-600 bg-gray-800 shadow-lg">
          <div className="max-h-48 overflow-y-auto p-1">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                onClick={() => handleSelect(profile.id)}
                className={`flex w-full items-center rounded px-3 py-2 text-left text-sm hover:bg-gray-700 ${
                  profile.id === activeId
                    ? "bg-gray-700 text-white"
                    : "text-gray-300"
                }`}
              >
                <span className="flex-1 truncate">{profile.name}</span>
                {profile.id === activeId && (
                  <span className="text-xs text-green-400">✓</span>
                )}
              </button>
            ))}
          </div>
          <div className="border-t border-gray-600 p-2">
            <Link
              href="/settings/profiles"
              className="block rounded px-3 py-1.5 text-center text-sm text-blue-400 hover:bg-gray-700"
              onClick={() => setOpen(false)}
            >
              Manage Profiles
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
