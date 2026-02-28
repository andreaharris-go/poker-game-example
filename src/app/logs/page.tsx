"use client";

import { useState, useEffect } from "react";
import type { NetworkLogEntry } from "@/lib/api/client";
import { getNetworkLog, onNetworkLogChange } from "@/lib/api/client";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-700 text-green-100",
  POST: "bg-blue-700 text-blue-100",
  PUT: "bg-yellow-700 text-yellow-100",
  DELETE: "bg-red-700 text-red-100",
  PATCH: "bg-purple-700 text-purple-100",
};

function statusColor(status: number): string {
  if (status === 0) return "text-gray-500";
  if (status < 300) return "text-green-400";
  if (status < 400) return "text-yellow-400";
  return "text-red-400";
}

export default function LogsPage() {
  const [logs, setLogs] = useState<NetworkLogEntry[]>(getNetworkLog);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onNetworkLogChange(() => {
      setLogs(getNetworkLog());
    });
    return unsub;
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Network Logs</h1>
        <span className="text-sm text-gray-400">{logs.length} entries</span>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-lg bg-gray-800 p-8 text-center text-gray-400">
          No network requests yet. Make some API calls to see them here.
        </div>
      ) : (
        <div className="space-y-1">
          {logs.map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg border border-gray-700 bg-gray-800"
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedId((prev) =>
                    prev === entry.id ? null : entry.id,
                  )
                }
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm"
              >
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-bold ${METHOD_COLORS[entry.method] ?? "bg-gray-600 text-gray-200"}`}
                >
                  {entry.method}
                </span>
                <span className="flex-1 truncate font-mono text-gray-200">
                  {entry.url}
                </span>
                <span className={`font-mono ${statusColor(entry.status)}`}>
                  {entry.status || "ERR"}
                </span>
                <span className="text-gray-500">{entry.duration}ms</span>
                <span className="text-xs text-gray-500">
                  {expandedId === entry.id ? "▼" : "▶"}
                </span>
              </button>

              {expandedId === entry.id && (
                <div className="space-y-3 border-t border-gray-700 px-4 py-3">
                  <div>
                    <h4 className="mb-1 text-xs font-medium text-gray-400">
                      Request Headers
                    </h4>
                    <pre className="overflow-x-auto rounded bg-gray-900 p-2 text-xs text-gray-300 whitespace-pre-wrap">
                      {JSON.stringify(entry.requestHeaders, null, 2)}
                    </pre>
                  </div>
                  {entry.requestBody != null && (
                    <div>
                      <h4 className="mb-1 text-xs font-medium text-gray-400">
                        Request Body
                      </h4>
                      <pre className="overflow-x-auto rounded bg-gray-900 p-2 text-xs text-gray-300 whitespace-pre-wrap">
                        {JSON.stringify(entry.requestBody, null, 2)}
                      </pre>
                    </div>
                  )}
                  <div>
                    <h4 className="mb-1 text-xs font-medium text-gray-400">
                      Response Body
                    </h4>
                    <pre className="overflow-x-auto rounded bg-gray-900 p-2 text-xs text-gray-300 whitespace-pre-wrap">
                      {JSON.stringify(entry.responseBody, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
