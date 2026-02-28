"use client";

import { useState, useCallback } from "react";
import {
  getHistory,
  clearHistory,
  type HistoryEntry,
} from "@/lib/storage/history";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-700 text-green-100",
  POST: "bg-blue-700 text-blue-100",
  PUT: "bg-yellow-700 text-yellow-100",
  DELETE: "bg-red-700 text-red-100",
  PATCH: "bg-purple-700 text-purple-100",
};

type RequestHistoryProps = {
  onRerun?: (entry: HistoryEntry) => void;
};

export default function RequestHistory({ onRerun }: RequestHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>(() => getHistory());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleClear = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);

  const statusColor = (status: number) => {
    if (status < 300) return "text-green-400";
    if (status < 400) return "text-yellow-400";
    return "text-red-400";
  };

  if (history.length === 0) {
    return (
      <div className="rounded-lg bg-gray-800 p-4 text-sm text-gray-400">
        No request history yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300">
          Request History ({history.length})
        </h3>
        <button
          type="button"
          onClick={handleClear}
          className="rounded bg-red-900 px-3 py-1 text-xs text-red-200 hover:bg-red-800"
        >
          Clear
        </button>
      </div>

      <div className="space-y-1">
        {history.map((entry) => (
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
              <span
                className={`rounded px-2 py-0.5 text-xs font-bold ${METHOD_COLORS[entry.method] ?? "bg-gray-600 text-gray-200"}`}
              >
                {entry.method}
              </span>
              <span className="flex-1 truncate font-mono text-gray-200">
                {entry.path}
              </span>
              <span className={`font-mono ${statusColor(entry.status)}`}>
                {entry.status}
              </span>
              <span className="text-gray-500">{entry.duration}ms</span>
              <span className="text-xs text-gray-500">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
            </button>

            {expandedId === entry.id && (
              <div className="space-y-3 border-t border-gray-700 px-4 py-3">
                <div>
                  <h4 className="mb-1 text-xs font-medium text-gray-400">
                    Request Headers
                  </h4>
                  <pre className="rounded bg-gray-900 p-2 text-xs text-gray-300 whitespace-pre-wrap">
                    {JSON.stringify(entry.requestHeaders, null, 2)}
                  </pre>
                </div>
                {entry.requestBody != null && (
                  <div>
                    <h4 className="mb-1 text-xs font-medium text-gray-400">
                      Request Body
                    </h4>
                    <pre className="rounded bg-gray-900 p-2 text-xs text-gray-300 whitespace-pre-wrap">
                      {JSON.stringify(entry.requestBody, null, 2)}
                    </pre>
                  </div>
                )}
                <div>
                  <h4 className="mb-1 text-xs font-medium text-gray-400">
                    Response Preview
                  </h4>
                  <pre className="rounded bg-gray-900 p-2 text-xs text-gray-300 whitespace-pre-wrap">
                    {entry.responsePreview}
                  </pre>
                </div>
                {onRerun && (
                  <button
                    type="button"
                    onClick={() => onRerun(entry)}
                    className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                  >
                    Re-run
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
