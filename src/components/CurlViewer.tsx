"use client";

import { useState, useCallback } from "react";

type CurlViewerProps = {
  curl: string;
};

export default function CurlViewer({ curl }: CurlViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [curl]);

  return (
    <div className="relative rounded-lg bg-gray-900 p-4">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre className="overflow-x-auto text-sm text-green-400 whitespace-pre-wrap">
        {curl}
      </pre>
    </div>
  );
}
