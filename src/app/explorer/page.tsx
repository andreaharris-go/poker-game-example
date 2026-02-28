"use client";

import { useState, useEffect } from "react";
import type { HeaderProfile } from "@/lib/api/client";
import type { EndpointInfo } from "@/lib/openapi/parser";
import { getEndpointsByTag } from "@/lib/openapi/parser";
import {
  getProfiles,
  getActiveProfileId,
  getDefaultProfile,
} from "@/lib/storage/profiles";
import EndpointCard from "@/components/EndpointCard";
import RequestHistory from "@/components/RequestHistory";

const BASE_URL_KEY = "poker-api-base-url";
const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export default function ExplorerPage() {
  const [profile, setProfile] = useState<HeaderProfile>(getDefaultProfile);
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [endpointsByTag, setEndpointsByTag] = useState<
    Record<string, EndpointInfo[]>
  >({});
  const [collapsedTags, setCollapsedTags] = useState<Set<string>>(new Set());

  useEffect(() => {
    const profiles = getProfiles();
    const activeId = getActiveProfileId();
    const found = profiles.find((p) => p.id === activeId);
    setProfile(found ?? profiles[0] ?? getDefaultProfile());
    setBaseUrl(localStorage.getItem(BASE_URL_KEY) ?? DEFAULT_BASE_URL);
    setEndpointsByTag(getEndpointsByTag());
  }, []);

  const toggleTag = (tag: string) => {
    setCollapsedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const tags = Object.keys(endpointsByTag);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-white">API Explorer</h1>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Endpoints */}
        <div className="flex-1 space-y-6">
          {tags.map((tag) => (
            <div key={tag}>
              <button
                type="button"
                onClick={() => toggleTag(tag)}
                className="mb-2 flex w-full items-center gap-2 text-left"
              >
                <span className="text-xs text-gray-500">
                  {collapsedTags.has(tag) ? "▶" : "▼"}
                </span>
                <h2 className="text-lg font-semibold text-white">{tag}</h2>
                <span className="text-xs text-gray-500">
                  ({endpointsByTag[tag].length})
                </span>
              </button>
              {!collapsedTags.has(tag) && (
                <div className="space-y-2">
                  {endpointsByTag[tag].map((ep) => (
                    <EndpointCard
                      key={`${ep.method}-${ep.path}`}
                      endpoint={ep}
                      baseUrl={baseUrl}
                      profile={profile}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* History sidebar */}
        <div className="w-full lg:w-80 shrink-0">
          <RequestHistory />
        </div>
      </div>
    </main>
  );
}
