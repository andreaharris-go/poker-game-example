"use client";

import { useState, useCallback } from "react";

type JsonEditorProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
};

export default function JsonEditor({
  value,
  onChange,
  label,
  placeholder,
  defaultValue,
}: JsonEditorProps) {
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback((text: string) => {
    if (!text.trim()) {
      setError(null);
      return;
    }
    try {
      JSON.parse(text);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const handleChange = useCallback(
    (text: string) => {
      onChange(text);
      validate(text);
    },
    [onChange, validate],
  );

  const handleFormat = useCallback(() => {
    try {
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange(formatted);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [value, onChange]);

  const handleReset = useCallback(() => {
    if (defaultValue !== undefined) {
      onChange(defaultValue);
      validate(defaultValue);
    }
  }, [defaultValue, onChange, validate]);

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder ?? "Enter JSON..."}
        rows={8}
        className={`w-full rounded-lg border bg-gray-700 px-3 py-2 font-mono text-sm text-gray-100 placeholder-gray-400 focus:outline-none ${
          error
            ? "border-red-500 focus:border-red-500"
            : "border-gray-600 focus:border-blue-500"
        }`}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleFormat}
          className="rounded-lg bg-gray-600 px-3 py-1 text-sm text-gray-200 hover:bg-gray-500"
        >
          Format
        </button>
        {defaultValue !== undefined && (
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg bg-gray-600 px-3 py-1 text-sm text-gray-200 hover:bg-gray-500"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
