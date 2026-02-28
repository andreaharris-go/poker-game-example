"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { HeaderProfile, ApiResponse } from "@/lib/api/client";
import { sendRequest } from "@/lib/api/client";
import {
  getProfiles,
  getActiveProfileId,
  getDefaultProfile,
} from "@/lib/storage/profiles";
import ResponseViewer from "@/components/ResponseViewer";

const BASE_URL_KEY = "poker-api-base-url";
const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export default function TablesPage() {
  const [profile, setProfile] = useState<HeaderProfile>(getDefaultProfile);
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [tableId, setTableId] = useState("");

  const [tableRes, setTableRes] = useState<ApiResponse | null>(null);
  const [tableLoading, setTableLoading] = useState(false);

  const [handRes, setHandRes] = useState<ApiResponse | null>(null);
  const [handLoading, setHandLoading] = useState(false);

  const [actionType, setActionType] = useState("check");
  const [amount, setAmount] = useState("");
  const [actionRes, setActionRes] = useState<ApiResponse | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [advanceRes, setAdvanceRes] = useState<ApiResponse | null>(null);
  const [advanceLoading, setAdvanceLoading] = useState(false);

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [interval, setIntervalMs] = useState(2000);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const profiles = getProfiles();
    const activeId = getActiveProfileId();
    setProfile(
      profiles.find((p) => p.id === activeId) ??
        profiles[0] ??
        getDefaultProfile(),
    );
    setBaseUrl(localStorage.getItem(BASE_URL_KEY) ?? DEFAULT_BASE_URL);
  }, []);

  const fetchTable = useCallback(async () => {
    if (!tableId) return;
    setTableLoading(true);
    try {
      const res = await sendRequest(baseUrl, profile, {
        method: "GET",
        path: "/tables/{tableId}",
        headers: {},
        body: null,
        pathParams: { tableId },
        queryParams: {},
      });
      setTableRes(res);
    } catch (err) {
      setTableRes({
        status: 0, statusText: "Network Error", headers: {},
        body: { error: (err as Error).message },
        rawBody: (err as Error).message, duration: 0,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setTableLoading(false);
    }
  }, [baseUrl, profile, tableId]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && tableId) {
      timerRef.current = setInterval(fetchTable, interval);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
    if (timerRef.current) clearInterval(timerRef.current);
  }, [autoRefresh, tableId, interval, fetchTable]);

  const fetchHand = useCallback(async () => {
    if (!tableId) return;
    setHandLoading(true);
    try {
      const res = await sendRequest(baseUrl, profile, {
        method: "GET",
        path: "/tables/{tableId}/my-hand",
        headers: {},
        body: null,
        pathParams: { tableId },
        queryParams: {},
      });
      setHandRes(res);
    } catch (err) {
      setHandRes({
        status: 0, statusText: "Network Error", headers: {},
        body: { error: (err as Error).message },
        rawBody: (err as Error).message, duration: 0,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setHandLoading(false);
    }
  }, [baseUrl, profile, tableId]);

  const sendAction = useCallback(async () => {
    if (!tableId) return;
    setActionLoading(true);
    const body: Record<string, unknown> = { actionType };
    if (amount) body.amount = Number(amount);
    try {
      const res = await sendRequest(baseUrl, profile, {
        method: "POST",
        path: "/tables/{tableId}/action",
        headers: {},
        body,
        pathParams: { tableId },
        queryParams: {},
      });
      setActionRes(res);
    } catch (err) {
      setActionRes({
        status: 0, statusText: "Network Error", headers: {},
        body: { error: (err as Error).message },
        rawBody: (err as Error).message, duration: 0,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setActionLoading(false);
    }
  }, [baseUrl, profile, tableId, actionType, amount]);

  const advanceTable = useCallback(async () => {
    if (!tableId) return;
    setAdvanceLoading(true);
    try {
      const res = await sendRequest(baseUrl, profile, {
        method: "POST",
        path: "/admin/tables/{tableId}/advance",
        headers: {},
        body: null,
        pathParams: { tableId },
        queryParams: {},
      });
      setAdvanceRes(res);
    } catch (err) {
      setAdvanceRes({
        status: 0, statusText: "Network Error", headers: {},
        body: { error: (err as Error).message },
        rawBody: (err as Error).message, duration: 0,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setAdvanceLoading(false);
    }
  }, [baseUrl, profile, tableId]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-white">Tables</h1>

      {/* Table ID input */}
      <div className="mb-6 flex items-end gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-gray-400">Table ID</label>
          <input
            type="text"
            value={tableId}
            onChange={(e) => setTableId(e.target.value)}
            placeholder="Enter table ID"
            className="w-full rounded border border-gray-600 bg-gray-700 px-2 py-1.5 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Table state */}
      <section className="mb-6 rounded-lg border border-gray-700 bg-gray-800 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Table State</h2>
          <button
            type="button"
            onClick={fetchTable}
            disabled={tableLoading || !tableId}
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
          >
            {tableLoading ? "Loading…" : "Fetch"}
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-600"
            />
            Auto-refresh
          </label>
          {autoRefresh && (
            <select
              value={interval}
              onChange={(e) => setIntervalMs(Number(e.target.value))}
              className="rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-gray-200"
            >
              <option value={1000}>1s</option>
              <option value={2000}>2s</option>
              <option value={5000}>5s</option>
            </select>
          )}
        </div>
        <ResponseViewer response={tableRes} loading={tableLoading} />
      </section>

      {/* My hand */}
      <section className="mb-6 rounded-lg border border-gray-700 bg-gray-800 p-4">
        <div className="mb-3 flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">My Hand</h2>
          <button
            type="button"
            onClick={fetchHand}
            disabled={handLoading || !tableId}
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
          >
            {handLoading ? "Loading…" : "GET /tables/{tableId}/my-hand"}
          </button>
        </div>
        <ResponseViewer response={handRes} loading={handLoading} />
      </section>

      {/* Action sender */}
      <section className="mb-6 rounded-lg border border-gray-700 bg-gray-800 p-4">
        <h2 className="mb-3 text-lg font-semibold text-white">Send Action</h2>
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-400">Action</label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="rounded border border-gray-600 bg-gray-700 px-2 py-1.5 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="fold">fold</option>
              <option value="check">check</option>
              <option value="call">call</option>
              <option value="raise">raise</option>
              <option value="all-in">all-in</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">
              Amount (optional)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-28 rounded border border-gray-600 bg-gray-700 px-2 py-1.5 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={sendAction}
            disabled={actionLoading || !tableId}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {actionLoading ? "Sending…" : "Send Action"}
          </button>
        </div>
        <ResponseViewer response={actionRes} loading={actionLoading} />
      </section>

      {/* Admin advance */}
      <section className="rounded-lg border border-gray-700 bg-gray-800 p-4">
        <div className="mb-3 flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Admin Advance</h2>
          <button
            type="button"
            onClick={advanceTable}
            disabled={advanceLoading || !tableId}
            className="rounded-lg bg-yellow-700 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
          >
            {advanceLoading ? "Advancing…" : "POST /admin/tables/{tableId}/advance"}
          </button>
        </div>
        <ResponseViewer response={advanceRes} loading={advanceLoading} />
      </section>
    </main>
  );
}
