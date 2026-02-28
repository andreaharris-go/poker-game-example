"use client";

import { useState, useCallback } from "react";

type IdempotencyHelperProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function IdempotencyHelper({
  value,
  onChange,
}: IdempotencyHelperProps) {
  const [reuseKey, setReuseKey] = useState(false);
  const [lastKey, setLastKey] = useState("");

  const handleGenerate = useCallback(() => {
    const newKey = crypto.randomUUID();
    setLastKey(newKey);
    onChange(newKey);
  }, [onChange]);

  const handleToggleReuse = useCallback(() => {
    setReuseKey((prev) => {
      const next = !prev;
      if (next && lastKey) {
        onChange(lastKey);
      }
      return next;
    });
  }, [lastKey, onChange]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        x-idempotency-key
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter or generate idempotency key"
          className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-1.5 text-sm text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleGenerate}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Generate
        </button>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-400">
        <input
          type="checkbox"
          checked={reuseKey}
          onChange={handleToggleReuse}
          className="rounded border-gray-600"
        />
        Reuse last key{lastKey ? ` (${lastKey.slice(0, 8)}…)` : ""}
      </label>
    </div>
  );
}
