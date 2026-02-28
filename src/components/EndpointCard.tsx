"use client";

import { useState, useCallback, useMemo } from "react";
import type { EndpointInfo } from "@/lib/openapi/parser";
import { getDefaultBody } from "@/lib/openapi/parser";
import type { HeaderProfile, ApiResponse } from "@/lib/api/client";
import { sendRequest } from "@/lib/api/client";
import { generateCurl } from "@/lib/curl/generator";
import JsonEditor from "./JsonEditor";
import ResponseViewer from "./ResponseViewer";
import CurlViewer from "./CurlViewer";
import IdempotencyHelper from "./IdempotencyHelper";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-700 text-green-100",
  POST: "bg-blue-700 text-blue-100",
  PUT: "bg-yellow-700 text-yellow-100",
  DELETE: "bg-red-700 text-red-100",
  PATCH: "bg-purple-700 text-purple-100",
};

type EndpointCardProps = {
  endpoint: EndpointInfo;
  baseUrl: string;
  profile: HeaderProfile;
  onResponse?: (response: ApiResponse) => void;
};

export default function EndpointCard({
  endpoint,
  baseUrl,
  profile,
  onResponse,
}: EndpointCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState("");

  const pathParams = endpoint.parameters.filter((p) => p.in === "path");
  const queryParams = endpoint.parameters.filter((p) => p.in === "query");

  const [pathValues, setPathValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    pathParams.forEach((p) => (init[p.name] = ""));
    return init;
  });

  const [queryValues, setQueryValues] = useState<Record<string, string>>(
    () => {
      const init: Record<string, string> = {};
      queryParams.forEach((p) => (init[p.name] = ""));
      return init;
    },
  );

  const defaultBody = useMemo(() => {
    if (!endpoint.hasBody || !endpoint.bodySchemaRef) return "";
    const body = getDefaultBody(endpoint.bodySchemaRef);
    return body ? JSON.stringify(body, null, 2) : "";
  }, [endpoint.hasBody, endpoint.bodySchemaRef]);

  const [body, setBody] = useState(defaultBody);

  const resolvedHeaders = useMemo(() => {
    const headers: Record<string, string> = {
      "x-vendor-id": profile.vendorId,
      "x-provider-id": profile.providerId,
    };
    if (profile.userId) headers["x-user-id"] = profile.userId;
    if (profile.adminKey) headers["x-admin-key"] = profile.adminKey;
    if (idempotencyKey) headers["x-idempotency-key"] = idempotencyKey;
    if (endpoint.hasBody) headers["Content-Type"] = "application/json";
    return headers;
  }, [profile, idempotencyKey, endpoint.hasBody]);

  const resolvedPath = useMemo(() => {
    let p = endpoint.path;
    for (const [key, value] of Object.entries(pathValues)) {
      p = p.replace(`{${key}}`, value || `{${key}}`);
    }
    const q = Object.entries(queryValues)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");
    return q ? `${p}?${q}` : p;
  }, [endpoint.path, pathValues, queryValues]);

  const curlCommand = useMemo(() => {
    let parsedBody: object | undefined;
    if (endpoint.hasBody && body.trim()) {
      try {
        parsedBody = JSON.parse(body);
      } catch {
        // leave undefined if JSON is invalid
      }
    }
    return generateCurl(baseUrl, endpoint.method, resolvedPath, resolvedHeaders, parsedBody);
  }, [baseUrl, endpoint.method, resolvedPath, resolvedHeaders, endpoint.hasBody, body]);

  const handleSend = useCallback(async () => {
    setLoading(true);
    setResponse(null);
    try {
      let parsedBody: object | null = null;
      if (endpoint.hasBody && body.trim()) {
        parsedBody = JSON.parse(body);
      }
      const res = await sendRequest(baseUrl, profile, {
        method: endpoint.method,
        path: endpoint.path,
        headers: {},
        body: parsedBody,
        pathParams: pathValues,
        queryParams: queryValues,
      }, idempotencyKey || undefined);
      setResponse(res);
      onResponse?.(res);
    } catch (err) {
      setResponse({
        status: 0,
        statusText: "Network Error",
        headers: {},
        body: { error: (err as Error).message },
        rawBody: (err as Error).message,
        duration: 0,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }, [baseUrl, profile, endpoint, body, pathValues, queryValues, idempotencyKey, onResponse]);

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span
          className={`rounded px-2.5 py-1 text-xs font-bold ${METHOD_COLORS[endpoint.method] ?? "bg-gray-600 text-gray-200"}`}
        >
          {endpoint.method}
        </span>
        <span className="flex-1 font-mono text-sm text-gray-200">
          {endpoint.path}
        </span>
        {endpoint.tags.map((tag) => (
          <span
            key={tag}
            className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-400"
          >
            {tag}
          </span>
        ))}
        <span className="text-xs text-gray-500">
          {expanded ? "▼" : "▶"}
        </span>
      </button>

      {endpoint.summary && (
        <p className="px-4 pb-2 text-xs text-gray-400">{endpoint.summary}</p>
      )}

      {/* Expanded content */}
      {expanded && (
        <div className="space-y-4 border-t border-gray-700 px-4 py-4">
          {/* Path params */}
          {pathParams.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-gray-400">
                Path Parameters
              </h4>
              {pathParams.map((p) => (
                <div key={p.name} className="flex items-center gap-2">
                  <label className="w-32 text-sm text-gray-300">
                    {p.name}
                    {p.required && (
                      <span className="text-red-400"> *</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={pathValues[p.name] ?? ""}
                    onChange={(e) =>
                      setPathValues((prev) => ({
                        ...prev,
                        [p.name]: e.target.value,
                      }))
                    }
                    placeholder={p.name}
                    className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Query params */}
          {queryParams.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-gray-400">
                Query Parameters
              </h4>
              {queryParams.map((p) => (
                <div key={p.name} className="flex items-center gap-2">
                  <label className="w-32 text-sm text-gray-300">
                    {p.name}
                    {p.required && (
                      <span className="text-red-400"> *</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={queryValues[p.name] ?? ""}
                    onChange={(e) =>
                      setQueryValues((prev) => ({
                        ...prev,
                        [p.name]: e.target.value,
                      }))
                    }
                    placeholder={p.name}
                    className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Body editor */}
          {endpoint.hasBody && (
            <JsonEditor
              value={body}
              onChange={setBody}
              label="Request Body"
              defaultValue={defaultBody}
            />
          )}

          {/* Idempotency key for POST */}
          {endpoint.method === "POST" && (
            <IdempotencyHelper
              value={idempotencyKey}
              onChange={setIdempotencyKey}
            />
          )}

          {/* Curl viewer */}
          <div>
            <h4 className="mb-2 text-xs font-medium text-gray-400">
              cURL Command
            </h4>
            <CurlViewer curl={curlCommand} />
          </div>

          {/* Send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send"}
          </button>

          {/* Response */}
          <ResponseViewer response={response} loading={loading} />
        </div>
      )}
    </div>
  );
}
