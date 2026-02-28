"use client";

import { useState } from "react";
import type { ApiResponse } from "@/lib/api/client";

type ResponseViewerProps = {
  response: ApiResponse | null;
  loading: boolean;
};

function statusColor(status: number): string {
  if (status < 300) return "text-green-400";
  if (status < 400) return "text-yellow-400";
  return "text-red-400";
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function syntaxHighlight(json: string): string {
  const escaped = escapeHtml(json);
  return escaped.replace(
    /(&quot;(\\u[\da-fA-F]{4}|\\[^u]|[^\\&])*&quot;(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = "text-purple-400"; // number
      if (match.startsWith("&quot;")) {
        cls = match.endsWith(":") ? "text-blue-300" : "text-green-300";
      } else if (/true|false/.test(match)) {
        cls = "text-yellow-300";
      } else if (match === "null") {
        cls = "text-gray-500";
      }
      return `<span class="${cls}">${match}</span>`;
    },
  );
}

export default function ResponseViewer({
  response,
  loading,
}: ResponseViewerProps) {
  const [showHeaders, setShowHeaders] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-gray-800 p-4">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-blue-500" />
        <span className="text-sm text-gray-400">Sending request…</span>
      </div>
    );
  }

  if (!response) return null;

  const prettyBody =
    typeof response.body === "object" && response.body !== null
      ? JSON.stringify(response.body, null, 2)
      : response.rawBody;

  return (
    <div className="space-y-3 rounded-lg bg-gray-800 p-4">
      {/* Status line */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className={`font-bold text-lg ${statusColor(response.status)}`}>
          {response.status} {response.statusText}
        </span>
        <span className="text-gray-400">{response.duration}ms</span>
        <span className="text-gray-500">
          {new Date(response.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {/* Headers toggle */}
      <button
        type="button"
        onClick={() => setShowHeaders((prev) => !prev)}
        className="text-sm text-blue-400 hover:text-blue-300"
      >
        {showHeaders ? "▼ Hide Headers" : "▶ Show Headers"}
      </button>
      {showHeaders && (
        <div className="rounded bg-gray-900 p-3">
          {Object.entries(response.headers).map(([key, val]) => (
            <div key={key} className="text-xs">
              <span className="text-blue-300">{key}:</span>{" "}
              <span className="text-gray-300">{val}</span>
            </div>
          ))}
        </div>
      )}

      {/* Raw/Pretty toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowRaw(false)}
          className={`rounded px-2 py-1 text-xs ${!showRaw ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"}`}
        >
          Pretty
        </button>
        <button
          type="button"
          onClick={() => setShowRaw(true)}
          className={`rounded px-2 py-1 text-xs ${showRaw ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"}`}
        >
          Raw
        </button>
      </div>

      {/* Body */}
      {showRaw ? (
        <pre className="overflow-x-auto rounded bg-gray-900 p-3 text-sm text-gray-300 whitespace-pre-wrap">
          {response.rawBody}
        </pre>
      ) : (
        <pre
          className="overflow-x-auto rounded bg-gray-900 p-3 text-sm whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: syntaxHighlight(prettyBody) }}
        />
      )}
    </div>
  );
}
